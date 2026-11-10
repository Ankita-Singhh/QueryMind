import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../context/ChatContext.jsx';
import { SendIcon, StopIcon } from '../common/Icons.jsx';

export const MessageInput = () => {
  const { sendMessage, isGenerating, stopGeneration, useStreaming, setUseStreaming } = useChat();
  const [input, setInput] = useState('');
  const textareaRef = useRef(null);

  // Auto-resize textarea height as content expands
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleKeyDown = (e) => {
    // Enter sends message, Shift+Enter adds newline
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!input.trim() || isGenerating) return;
    sendMessage(input);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  // Approximate token calculation for real-time prompt budgeting
  const estimatedTokens = Math.ceil(input.length / 4);

  return (
    <div className="input-area-wrapper">
      <div className="input-box-container">
        <textarea
          ref={textareaRef}
          className="chat-textarea"
          placeholder="Ask QueryMind anything, brainstorm architectures, or debug code... (Press Enter to send)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isGenerating}
          rows={1}
          aria-label="Chat prompt input"
        />

        <div className="input-controls-row">
          <div className="input-options">
            <label className="stream-toggle-label" title="Enable real-time typewriter stream via Server-Sent Events">
              <input
                type="checkbox"
                checked={useStreaming}
                onChange={(e) => setUseStreaming(e.target.checked)}
                style={{ accentColor: 'var(--cyan-accent)', cursor: 'pointer' }}
              />
              <span>Live Streaming</span>
            </label>

            {input.length > 0 && (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                {input.length} chars (~{estimatedTokens} tokens)
              </span>
            )}
          </div>

          <div className="action-buttons">
            {isGenerating ? (
              <button
                type="button"
                className="stop-btn"
                onClick={stopGeneration}
                aria-label="Stop response generation"
              >
                <StopIcon size={14} style={{ marginRight: '6px' }} />
                <span>Stop</span>
              </button>
            ) : (
              <button
                type="button"
                className="send-btn"
                onClick={handleSend}
                disabled={!input.trim()}
                aria-label="Send message to QueryMind"
              >
                <SendIcon size={15} style={{ marginRight: '6px' }} />
                <span>Send</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
