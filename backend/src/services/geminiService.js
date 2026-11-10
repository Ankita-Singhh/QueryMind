import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { MemoryService } from './memoryService.js';

let genAIClient = null;
let currentKey = null;

const getGenAIClient = () => {
  // Dynamically re-read .env so user edits take effect immediately without server restart
  dotenv.config({ override: true });
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') {
    return null;
  }
  if (!genAIClient || currentKey !== apiKey) {
    genAIClient = new GoogleGenAI({ apiKey });
    currentKey = apiKey;
  }
  return genAIClient;
};

export class GeminiService {
  static sanitizeModel(m) {
    if (!m || m === 'gemini-1.5-flash' || m === 'gemini-2.5-flash' || m === 'gemini-1.0-pro') {
      return 'gemini-3.5-flash';
    }
    return m;
  }

  /**
   * Generates a non-streaming response via Google Gemini API
   */
  static async generateResponse({
    prompt,
    history = [],
    model = 'gemini-3.5-flash',
    temperature = 0.7,
    systemInstruction = '',
    persona = 'general'
  }) {
    const client = getGenAIClient();

    // Check if live API key is set
    if (!client) {
      return {
        text: `**QueryMind Demo Mode** 🧠✨\n\nI received your prompt: *"${prompt}"*\n\nTo connect live Google Gemini intelligence:\n1. Open \`backend/.env\`\n2. Add your Google Gemini API key: \`GEMINI_API_KEY=AIzaSy...\`\n3. Restart the server.\n\n*You can obtain a free Gemini API Key at [Google AI Studio](https://aistudio.google.com/app/apikey).*`,
        modelUsed: 'mock-demo-mode',
        tokensEstimate: 60
      };
    }

    const compiledSystemInstruction = MemoryService.constructSystemInstruction(systemInstruction, persona);
    const contents = MemoryService.prepareGeminiContents({ history, newPrompt: prompt });

    const activeModel = GeminiService.sanitizeModel(model);
    const modelsToTry = Array.from(new Set([activeModel, 'gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-flash-latest']));
    let lastError = null;

    for (const targetModel of modelsToTry) {
      try {
        const response = await client.models.generateContent({
          model: targetModel,
          contents,
          config: {
            systemInstruction: compiledSystemInstruction,
            temperature: Math.max(0, Math.min(2, temperature || 0.7)),
            maxOutputTokens: 2048,
          }
        });

        const text = response?.text || (typeof response?.text === 'function' ? response.text() : '');
        return {
          text: text || 'No text output returned by Gemini.',
          modelUsed: targetModel,
          tokensEstimate: response?.usageMetadata?.totalTokenCount || 0
        };
      } catch (err) {
        lastError = err;
        console.warn(`[GeminiService] Model ${targetModel} failed: ${err.message}. Retrying fallback...`);
      }
    }

    throw new Error(`Google Gemini inference error: ${lastError?.message || 'Unknown API failure'}`);
  }

  /**
   * Streams response chunks via Server-Sent Events (SSE)
   */
  static async streamResponse({
    prompt,
    history = [],
    model = 'gemini-3.5-flash',
    temperature = 0.7,
    systemInstruction = '',
    persona = 'general',
    onChunk,
    onDone,
    onError
  }) {
    const client = getGenAIClient();

    if (!client) {
      // Simulate natural streaming for demo mode
      const demoMessage = `**QueryMind Demo Mode** 🧠✨\n\nI received your prompt: *"${prompt}"*\n\nMulti-turn context memory is fully active!\n\nTo unlock live Google Gemini 3.5 Flash intelligence:\n1. Open \`backend/.env\`\n2. Add your Google Gemini API key: \`GEMINI_API_KEY=AIzaSy...\`\n3. Restart the server.\n\nGet your free key at: [Google AI Studio](https://aistudio.google.com/app/apikey)`;
      const words = demoMessage.split(' ');
      for (const word of words) {
        onChunk(word + ' ');
        await new Promise((r) => setTimeout(r, 45));
      }
      onDone({ modelUsed: 'mock-demo-mode', totalTokens: 65 });
      return;
    }

    const compiledSystemInstruction = MemoryService.constructSystemInstruction(systemInstruction, persona);
    const contents = MemoryService.prepareGeminiContents({ history, newPrompt: prompt });

    const activeModel = GeminiService.sanitizeModel(model);
    const modelsToTry = Array.from(new Set([activeModel, 'gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-flash-latest']));
    let succeeded = false;
    let lastError = null;

    for (const targetModel of modelsToTry) {
      try {
        const stream = await client.models.generateContentStream({
          model: targetModel,
          contents,
          config: {
            systemInstruction: compiledSystemInstruction,
            temperature: Math.max(0, Math.min(2, temperature || 0.7)),
            maxOutputTokens: 2048,
          }
        });

        let fullText = '';
        for await (const chunk of stream) {
          const chunkText = chunk.text || (typeof chunk.text === 'function' ? chunk.text() : '');
          if (chunkText) {
            fullText += chunkText;
            onChunk(chunkText);
          }
        }

        succeeded = true;
        onDone({ modelUsed: targetModel, fullText });
        break;
      } catch (err) {
        lastError = err;
        console.warn(`[GeminiService] Streaming with ${targetModel} encountered error: ${err.message}`);
      }
    }

    if (!succeeded) {
      onError(lastError || new Error('All Gemini models failed to stream.'));
    }
  }
}
