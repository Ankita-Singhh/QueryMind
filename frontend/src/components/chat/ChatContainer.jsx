import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '../../context/ChatContext.jsx';
import { MessageBubble } from './MessageBubble.jsx';
import { SparklesIcon } from '../common/Icons.jsx';

const SUGGESTIONS = [
  {
    tag: 'Explain Concept',
    prompt: 'Explain quantum computing in simple terms with a real-world analogy.'
  },
  {
    tag: 'Code Architecture',
    prompt: 'Design a scalable Node.js microservice architecture with rate limiting and JWT auth.'
  },
  {
    tag: 'Debugging',
    prompt: 'How do I identify and fix memory leaks and re-render loops in React 19?'
  },
  {
    tag: 'Prompt Engineering',
    prompt: 'What prompt engineering strategies best mitigate hallucinations in LLM applications?'
  }
];

export const ChatContainer = () => {
  const { messages, isGenerating, streamedContent, sendMessage, loadingChat } = useChat();
  const bottomRef = useRef(null);
  const containerRef = useRef(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  // Auto-scroll to bottom on message or stream changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamedContent, isGenerating]);

  // Handle scroll detection
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 160;
    setShowScrollBtn(isScrolledUp);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div
      ref={containerRef}
      className="chat-container"
      onScroll={handleScroll}
      role="log"
      aria-live="polite"
    >
      <div className="chat-inner">
        {loadingChat ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-dim)' }}>
            <p>Loading conversation memory...</p>
          </div>
        ) : messages.length === 0 && !isGenerating ? (
          /* Welcome View with Prompt Suggestions */
          <div className="welcome-view">
            <div className="brand-icon-box" style={{ width: '56px', height: '56px', marginBottom: '1.25rem' }}>
              <SparklesIcon size={30} />
            </div>
            <h1 className="welcome-title">How can QueryMind assist you today?</h1>
            <p className="welcome-subtitle">
              Intelligent multi-turn memory • Grounded anti-hallucination inference • Live SSE streaming
            </p>

            <div className="prompt-suggestions">
              {SUGGESTIONS.map((item, idx) => (
                <div
                  key={idx}
                  className="suggestion-card"
                  onClick={() => sendMessage(item.prompt)}
                  tabIndex={0}
                  role="button"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') sendMessage(item.prompt);
                  }}
                  aria-label={`Suggestion: ${item.prompt}`}
                >
                  <div className="suggestion-tag">{item.tag}</div>
                  <div className="suggestion-text">{item.prompt}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Conversation Message List */
          <>
            {messages.map((msg, index) => (
              <MessageBubble
                key={msg._id || msg.id || index}
                message={msg}
              />
            ))}

            {/* Active Streaming Message Bubble */}
            {isGenerating && (
              <MessageBubble
                message={{
                  role: 'model',
                  content: streamedContent || 'Thinking and organizing response...'
                }}
                isStreaming={true}
              />
            )}
          </>
        )}

        <div ref={bottomRef} style={{ height: '1px' }} />
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBtn && (
        <button
          type="button"
          onClick={scrollToBottom}
          aria-label="Scroll to newest messages"
          style={{
            position: 'absolute',
            bottom: '100px',
            right: '28px',
            padding: '0.5rem 0.85rem',
            background: 'var(--bg-glass-card)',
            color: 'var(--text-main)',
            border: '1px solid var(--border-glass)',
            borderRadius: '9999px',
            backdropFilter: 'blur(8px)',
            boxShadow: 'var(--shadow-glass)',
            cursor: 'pointer',
            fontSize: '0.8rem',
            zIndex: 15
          }}
        >
          ↓ New messages
        </button>
      )}
    </div>
  );
};
