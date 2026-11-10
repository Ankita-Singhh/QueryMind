import React, { useState } from 'react';
import { MarkdownView } from '../common/MarkdownView.jsx';
import { SparklesIcon, CopyIcon, CheckIcon } from '../common/Icons.jsx';

export const MessageBubble = ({ message, isStreaming = false }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`message-row ${isUser ? 'user' : 'ai'}`}
      role="article"
      aria-label={`${isUser ? 'User' : 'Assistant'} message`}
    >
      <div className={`avatar ${isUser ? 'user' : 'ai'}`}>
        {isUser ? 'U' : <SparklesIcon size={18} />}
      </div>

      <div className="bubble">
        {isUser ? (
          <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{message.content}</p>
        ) : (
          <>
            <MarkdownView content={message.content} />
            {isStreaming && <span className="streaming-cursor" aria-hidden="true" />}
          </>
        )}

        {/* Message Footer Actions */}
        {!isUser && !isStreaming && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '0.65rem',
              paddingTop: '0.45rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              fontSize: '0.72rem',
              color: 'var(--text-dim)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>{message.tokens ? `~${message.tokens} tokens` : ''}</span>
              {message.timestamp && (
                <span>• {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              )}
            </div>

            <button
              type="button"
              onClick={handleCopy}
              aria-label="Copy message response"
              style={{
                background: 'transparent',
                border: 'none',
                color: copied ? 'var(--success)' : 'var(--text-dim)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.72rem'
              }}
            >
              {copied ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
