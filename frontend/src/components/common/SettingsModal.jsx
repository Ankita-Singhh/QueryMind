import React, { useState, useEffect } from 'react';
import { useChat } from '../../context/ChatContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { CloseIcon, SettingsIcon } from './Icons.jsx';

export const SettingsModal = ({ isOpen, onClose }) => {
  const {
    selectedModel,
    setSelectedModel,
    selectedPersona,
    setSelectedPersona,
    temperature,
    setTemperature,
    systemHealth
  } = useChat();

  const { user, updatePreferences } = useAuth();

  const [customPrompt, setCustomPrompt] = useState(
    user?.preferences?.systemInstruction || 'You are QueryMind, an advanced, context-aware Generative AI conversational assistant.'
  );
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    if (user?.preferences?.systemInstruction) {
      setCustomPrompt(user.preferences.systemInstruction);
    }
  }, [user]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveStatus('Saving...');
    try {
      if (user) {
        await updatePreferences({
          model: selectedModel,
          temperature,
          systemInstruction: customPrompt
        });
      }
      setSaveStatus('Saved successfully!');
      setTimeout(() => {
        setSaveStatus('');
        onClose();
      }, 1000);
    } catch (err) {
      setSaveStatus(`Failed to save: ${err.message}`);
    }
  };

  const mouseDownOnBackdrop = useRef(false);

  const handleOverlayMouseDown = (e) => {
    mouseDownOnBackdrop.current = (e.target === e.currentTarget);
  };

  const handleOverlayClick = (e) => {
    if (mouseDownOnBackdrop.current && e.target === e.currentTarget) {
      onClose();
    }
    mouseDownOnBackdrop.current = false;
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      onMouseDown={handleOverlayMouseDown}
      onClick={handleOverlayClick}
    >
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        style={{ maxWidth: '480px' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <SettingsIcon size={20} className="text-cyan-accent" />
            <h2 id="settings-title" className="modal-title">Model & System Settings</h2>
          </div>
          <button
            type="button"
            className="close-btn"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label="Close settings"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        <form onSubmit={handleSave}>
          {/* Model Selection */}
          <div className="form-group">
            <label className="form-label" htmlFor="model-select">Gemini Model</label>
            <select
              id="model-select"
              className="form-input"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              <option value="gemini-3.5-flash">Google Gemini 3.5 Flash (Recommended - Fastest & Stable)</option>
              <option value="gemini-3.8-flash">Google Gemini 3.8 Flash</option>
              <option value="gemini-flash-latest">Google Gemini Flash Latest</option>
            </select>
          </div>

          {/* AI Persona */}
          <div className="form-group">
            <label className="form-label" htmlFor="persona-select">Operational Persona</label>
            <select
              id="persona-select"
              className="form-input"
              value={selectedPersona}
              onChange={(e) => setSelectedPersona(e.target.value)}
            >
              <option value="general">General AI Assistant (Balanced & Empathetic)</option>
              <option value="coder">Senior Software Engineer & Architect (Code, Bugs, Systems)</option>
              <option value="creative">Creative Thinker & Ideator (Brainstorming & Copy)</option>
              <option value="analytical">Analytical & Fact-Checking (Rigorous, Objective)</option>
            </select>
          </div>

          {/* Temperature Slider */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" htmlFor="temperature-slider">Creativity / Temperature</label>
              <span style={{ fontSize: '0.82rem', color: '#06b6d4', fontWeight: 600 }}>{temperature}</span>
            </div>
            <input
              id="temperature-slider"
              type="range"
              min="0.0"
              max="1.5"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#6366f1', marginTop: '0.35rem' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b' }}>
              <span>0.0 (Precise / Factual)</span>
              <span>1.5 (Creative / Exploratory)</span>
            </div>
          </div>

          {/* System Instruction / Grounding Directive */}
          <div className="form-group">
            <label className="form-label" htmlFor="custom-system-prompt">Grounding Directive / System Prompt</label>
            <textarea
              id="custom-system-prompt"
              className="form-input"
              rows="3"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Instructions that guide every response..."
            />
          </div>

          {/* Diagnostics Box */}
          <div
            style={{
              padding: '0.75rem',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              fontSize: '0.8rem',
              color: '#94a3b8',
              marginBottom: '1.25rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Database Backend:</span>
              <strong style={{ color: systemHealth?.database?.connected ? '#10b981' : '#f59e0b' }}>
                {systemHealth?.database?.driver || 'Detecting...'}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Gemini API Key:</span>
              <strong style={{ color: systemHealth?.geminiConfigured ? '#10b981' : '#f59e0b' }}>
                {systemHealth?.geminiConfigured ? 'Configured & Active' : 'Demo Mock Mode (Add key in .env)'}
              </strong>
            </div>
          </div>

          {saveStatus && (
            <div style={{ textAlign: 'center', marginBottom: '0.75rem', fontSize: '0.85rem', color: '#10b981' }}>
              {saveStatus}
            </div>
          )}

          <button type="submit" className="submit-btn">
            Apply Settings
          </button>
        </form>
      </div>
    </div>
  );
};
