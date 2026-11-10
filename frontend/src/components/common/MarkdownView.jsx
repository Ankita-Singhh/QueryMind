import React, { useState } from 'react';
import { CopyIcon, CheckIcon } from './Icons.jsx';

const CodeBlock = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ position: 'relative', margin: '0.85rem 0' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#070a14',
          padding: '0.35rem 0.75rem',
          borderTopLeftRadius: '8px',
          borderTopRightRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderBottom: 'none',
          fontSize: '0.75rem',
          color: '#94a3b8',
          fontFamily: 'monospace'
        }}
      >
        <span>{language || 'text'}</span>
        <button
          onClick={handleCopy}
          type="button"
          aria-label="Copy code to clipboard"
          style={{
            background: 'transparent',
            border: 'none',
            color: copied ? '#10b981' : '#94a3b8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.75rem'
          }}
        >
          {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre
        style={{
          margin: 0,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0
        }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
};

export const MarkdownView = ({ content = '' }) => {
  if (!content) return null;

  // Split content by code blocks first
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="markdown-content">
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const lines = part.slice(3, -3).split('\n');
          const language = lines[0].trim();
          const code = lines.slice(1).join('\n');
          return <CodeBlock key={index} language={language} code={code} />;
        }

        // Parse regular markdown lines (headings, lists, bold, inline code)
        const paragraphs = part.split(/\n\s*\n/);
        return paragraphs.map((para, pIdx) => {
          const trimmed = para.trim();
          if (!trimmed) return null;

          // Headings
          if (trimmed.startsWith('### ')) {
            return <h4 key={`${index}-${pIdx}`} style={{ margin: '0.85rem 0 0.35rem', color: '#f8fafc', fontWeight: 700 }}>{trimmed.slice(4)}</h4>;
          }
          if (trimmed.startsWith('## ')) {
            return <h3 key={`${index}-${pIdx}`} style={{ margin: '1rem 0 0.45rem', color: '#f8fafc', fontWeight: 700 }}>{trimmed.slice(3)}</h3>;
          }
          if (trimmed.startsWith('# ')) {
            return <h2 key={`${index}-${pIdx}`} style={{ margin: '1.25rem 0 0.5rem', color: '#f8fafc', fontWeight: 800 }}>{trimmed.slice(2)}</h2>;
          }

          // Bullet List
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const items = trimmed.split('\n');
            return (
              <ul key={`${index}-${pIdx}`}>
                {items.map((item, iIdx) => (
                  <li key={iIdx}>{formatInline(item.replace(/^[-*]\s+/, ''))}</li>
                ))}
              </ul>
            );
          }

          // Numbered List
          if (/^\d+\.\s/.test(trimmed)) {
            const items = trimmed.split('\n');
            return (
              <ol key={`${index}-${pIdx}`}>
                {items.map((item, iIdx) => (
                  <li key={iIdx}>{formatInline(item.replace(/^\d+\.\s+/, ''))}</li>
                ))}
              </ol>
            );
          }

          return (
            <p key={`${index}-${pIdx}`}>
              {formatInline(trimmed)}
            </p>
          );
        });
      })}
    </div>
  );
};

// Helper for inline styles: **bold**, *italic*, `code`
function formatInline(text) {
  // Split by inline code first
  const codeParts = text.split(/(`[^`]+`)/g);

  return codeParts.map((sub, sIdx) => {
    if (sub.startsWith('`') && sub.endsWith('`')) {
      return <code key={sIdx}>{sub.slice(1, -1)}</code>;
    }

    // Process bold
    const boldParts = sub.split(/(\*\*[^*]+\*\*)/g);
    return boldParts.map((bPart, bIdx) => {
      if (bPart.startsWith('**') && bPart.endsWith('**')) {
        return <strong key={`${sIdx}-${bIdx}`}>{bPart.slice(2, -2)}</strong>;
      }
      return bPart;
    });
  });
}
