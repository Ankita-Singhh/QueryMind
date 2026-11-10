/**
 * MemoryService handles multi-turn conversation memory management,
 * sliding window context trimming, and prompt engineering strategies
 * to reduce hallucinations and maintain dialogue coherence.
 */

// Approximate token calculation helper (roughly 4 characters per token for English text & code)
export const estimateTokens = (text = '') => {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
};

export class MemoryService {
  /**
   * Applies prompt engineering rules and grounding directives
   * to mitigate hallucinations and ensure coherent, structured responses.
   */
  static constructSystemInstruction(customInstruction = '', persona = 'general') {
    const baseInstruction = customInstruction.trim() || 
      'You are QueryMind, an advanced, context-aware Generative AI conversational assistant.';

    const antiHallucinationRules = `
CRITICAL OPERATIONAL GUIDELINES:
1. TRUTHFULNESS & GROUNDING: Only state facts you are confident in. If information is uncertain, unknown, or outside your knowledge cutoff, explicitly state: "I do not have sufficient information to answer this accurately." Never invent citations, URLs, code packages, or facts.
2. CONVERSATIONAL CONTINUITY: Actively reference entities, requirements, and constraints established in earlier turns of this conversation. Do not contradict earlier statements unless correcting an error.
3. STRUCTURE & CLARITY: Use Markdown for formatting. Use code blocks with appropriate language tags for code. Present complex information using bullet points or concise numbered steps.
4. CODE INTEGRITY: When providing code, ensure it is syntactically valid, modern, and includes brief comments explaining non-obvious logic.
`;

    const personaModifiers = {
      coder: '\nROLE FOCUS: You are an expert Software Architect and Senior Engineer. Focus on clean code, idiomatic patterns, edge cases, and performance.',
      creative: '\nROLE FOCUS: You are a creative ideator and storyteller. Provide engaging, vibrant, and imaginative yet coherent responses.',
      academic: '\nROLE FOCUS: You are a rigorous researcher and analytical thinker. Provide well-reasoned, nuanced, and structured analytical responses.',
      general: ''
    };

    const modifier = personaModifiers[persona] || personaModifiers.general;
    return `${baseInstruction}\n${antiHallucinationRules}${modifier}`.trim();
  }

  /**
   * Formats chat history into Google Gemini API compatible contents array:
   * Array of { role: 'user' | 'model', parts: [{ text: string }] }
   * 
   * Applies sliding-window pruning to stay safely within token budgets.
   * Ensures turn alternations (user -> model -> user) required by LLM APIs.
   */
  static prepareGeminiContents({
    history = [],
    newPrompt = '',
    maxTurns = 12, // Sliding window of the most recent turns
    maxTokensBudget = 16000 // Token budget for history
  }) {
    // 1. Take the most recent messages up to maxTurns
    const recentMessages = history.slice(-maxTurns);

    // 2. Map into Gemini turn structure
    const turns = [];
    let currentTokens = 0;

    for (const msg of recentMessages) {
      if (!msg.content || typeof msg.content !== 'string') continue;

      // Gemini roles: 'user' or 'model'
      const role = msg.role === 'model' || msg.role === 'assistant' ? 'model' : 'user';
      const text = msg.content.trim();
      if (!text) continue;

      const tokens = estimateTokens(text);
      if (currentTokens + tokens > maxTokensBudget) {
        // Exceeded token budget for context, stop back-filling
        break;
      }

      currentTokens += tokens;
      turns.push({
        role,
        parts: [{ text }]
      });
    }

    // 3. Ensure no consecutive messages with the same role (merge if needed)
    const normalizedTurns = [];
    for (const turn of turns) {
      const prev = normalizedTurns[normalizedTurns.length - 1];
      if (prev && prev.role === turn.role) {
        prev.parts[0].text += `\n\n${turn.parts[0].text}`;
      } else {
        normalizedTurns.push({ ...turn });
      }
    }

    // 4. Append current user prompt
    if (newPrompt && newPrompt.trim()) {
      const promptText = newPrompt.trim();
      const prev = normalizedTurns[normalizedTurns.length - 1];
      if (prev && prev.role === 'user') {
        prev.parts[0].text += `\n\n${promptText}`;
      } else {
        normalizedTurns.push({
          role: 'user',
          parts: [{ text: promptText }]
        });
      }
    }

    return normalizedTurns;
  }
}
