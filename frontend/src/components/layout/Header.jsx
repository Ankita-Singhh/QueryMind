import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useChat } from '../../context/ChatContext.jsx';
import { SparklesIcon, SettingsIcon, UserIcon, MenuIcon } from '../common/Icons.jsx';

export const Header = ({ onOpenSettings, onToggleSidebar }) => {
  const { user, isAuthenticated, logout, setAuthModalOpen } = useAuth();
  const { selectedModel, setSelectedModel, selectedPersona, setSelectedPersona, systemHealth } = useChat();

  return (
    <header className="app-header">
      <div className="header-left">
        <button
          type="button"
          className="close-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle conversation history sidebar"
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <MenuIcon size={20} />
        </button>

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className="brand-icon-box" style={{ width: '28px', height: '28px' }}>
            <SparklesIcon size={16} />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.02em' }}>
            Query<span style={{ color: 'var(--cyan-accent)' }}>Mind</span>
          </span>
        </div>

        {/* Gemini Live / Mock Status Badge */}
        <div className="pill-badge" title={systemHealth?.geminiConfigured ? "Connected to Google Gemini API" : "Running in Zero-Setup Demo Mode"}>
          <span className={`status-dot ${systemHealth?.geminiConfigured ? 'active' : 'warning'}`}></span>
          <span style={{ color: 'var(--text-muted)' }}>
            {systemHealth?.geminiConfigured ? 'Gemini Live' : 'Demo Mode'}
          </span>
        </div>
      </div>

      <div className="header-right">
        {/* Model Selector Pill */}
        <select
          className="select-pill"
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          aria-label="Select AI Model"
        >
          <option value="gemini-3.5-flash">Gemini 3.5 Flash (Fastest)</option>
          <option value="gemini-3.8-flash">Gemini 3.8 Flash</option>
          <option value="gemini-flash-latest">Gemini Flash Latest</option>
        </select>

        {/* Persona Selector Pill */}
        <select
          className="select-pill"
          value={selectedPersona}
          onChange={(e) => setSelectedPersona(e.target.value)}
          aria-label="Select Assistant Persona"
        >
          <option value="general">Persona: General</option>
          <option value="coder">Persona: Software Engineer</option>
          <option value="creative">Persona: Creative</option>
          <option value="analytical">Persona: Analytical</option>
        </select>

        {/* Settings Button */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="close-btn"
          aria-label="Open model and grounding settings"
          style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}
        >
          <SettingsIcon size={18} />
        </button>

        {/* Auth status / Login Button */}
        {isAuthenticated ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.85rem',
                color: 'var(--text-main)',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '0.3rem 0.65rem',
                borderRadius: '9999px',
                border: '1px solid var(--border-glass)'
              }}
            >
              <UserIcon size={14} className="text-cyan-accent" />
              <span>{user?.name?.split(' ')[0] || 'User'}</span>
            </div>
            <button
              type="button"
              onClick={logout}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-dim)',
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
            >
              Sign Out
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="send-btn"
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}
            onClick={() => setAuthModalOpen(true)}
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};
