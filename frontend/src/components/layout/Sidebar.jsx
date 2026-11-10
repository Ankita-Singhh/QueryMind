import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { PlusIcon, TrashIcon, SparklesIcon, CloseIcon } from '../common/Icons.jsx';

export const Sidebar = ({ isOpen, onClose }) => {
  const { conversations, currentId, selectConversation, createNewChat, deleteConversation, loadingList } = useChat();
  const { isAuthenticated, setAuthModalOpen } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = conversations.filter((c) =>
    (c.title || 'New Conversation').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (id) => {
    selectConversation(id);
    if (window.innerWidth <= 768) {
      onClose();
    }
  };

  const handleNewChat = () => {
    createNewChat();
    if (window.innerWidth <= 768) {
      onClose();
    }
  };

  return (
    <aside
      className={`sidebar ${isOpen ? 'open' : ''}`}
      aria-label="Conversation History"
    >
      <div className="sidebar-header">
        <div className="brand-row">
          <div className="brand-badge">
            <div className="brand-icon-box">
              <SparklesIcon size={18} />
            </div>
            <span>QueryMind</span>
          </div>
          {/* Close button for mobile */}
          <button
            type="button"
            className="close-btn"
            onClick={onClose}
            aria-label="Close sidebar"
            style={{ display: 'none' }}
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <button
          type="button"
          className="new-chat-btn"
          onClick={handleNewChat}
          aria-label="Start new chat session"
        >
          <PlusIcon size={16} />
          <span>New Chat</span>
        </button>

        {conversations.length > 5 && (
          <input
            type="text"
            className="form-input"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.65rem' }}
            aria-label="Search conversation history"
          />
        )}
      </div>

      {/* Conversations List */}
      <div className="conversations-list" role="list">
        {loadingList ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            Loading history...
          </div>
        ) : !isAuthenticated ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            <p style={{ marginBottom: '0.75rem' }}>Sign in to save and sync your conversations.</p>
            <button
              type="button"
              className="send-btn"
              style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}
              onClick={() => setAuthModalOpen(true)}
            >
              Sign In
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            {searchQuery ? 'No matching chats found' : 'No previous conversations yet. Ask a question to begin!'}
          </div>
        ) : (
          filtered.map((conv) => {
            const id = conv._id || conv.id;
            const isActive = id === currentId;
            return (
              <div
                key={id}
                className={`conversation-item ${isActive ? 'active' : ''}`}
                onClick={() => handleSelect(id)}
                role="listitem"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSelect(id);
                }}
              >
                <span className="conv-title" title={conv.title}>
                  {conv.title || 'Untitled Conversation'}
                </span>
                <button
                  type="button"
                  className="conv-del-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Delete this conversation?')) {
                      deleteConversation(id);
                    }
                  }}
                  aria-label={`Delete conversation: ${conv.title}`}
                >
                  <TrashIcon size={14} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
          <span>QueryMind AI v1.0</span>
          <a
            href="https://github.com/Ankita-Singhh"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--cyan-accent)', textDecoration: 'none' }}
          >
            @Ankita-Singhh
          </a>
        </div>
      </div>
    </aside>
  );
};
