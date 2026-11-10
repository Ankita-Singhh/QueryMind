import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { CloseIcon, SparklesIcon } from './Icons.jsx';

export const AuthModal = () => {
  const { authModalOpen, setAuthModalOpen, login, register, loginAsDemo } = useAuth();
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const mouseDownOnBackdrop = useRef(false);
  const emailInputRef = useRef(null);

  // Auto-focus the input when modal opens
  useEffect(() => {
    if (authModalOpen) {
      const timer = setTimeout(() => {
        emailInputRef.current?.focus();
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [authModalOpen, isLoginTab]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!authModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setAuthModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [authModalOpen, setAuthModalOpen]);

  if (!authModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setError('');
    setSubmitting(true);

    try {
      if (isLoginTab) {
        await login(email, password);
      } else {
        if (!name.trim()) throw new Error('Please enter your full name');
        await register(name, email, password);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setError('');
    setSubmitting(true);
    try {
      await loginAsDemo();
    } catch (err) {
      setError(err.message || 'Failed to login with demo account');
    } finally {
      setSubmitting(false);
    }
  };

  // Safe backdrop click handlers: only close if user deliberately clicked on the backdrop itself
  const handleOverlayMouseDown = (e) => {
    mouseDownOnBackdrop.current = (e.target === e.currentTarget);
  };

  const handleOverlayClick = (e) => {
    if (mouseDownOnBackdrop.current && e.target === e.currentTarget) {
      setAuthModalOpen(false);
    }
    mouseDownOnBackdrop.current = false;
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      onMouseDown={handleOverlayMouseDown}
      onClick={handleOverlayClick}
    >
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid rgba(255,255,255,0.08)' }}>
            <button
              type="button"
              style={{
                background: 'transparent',
                border: 'none',
                color: isLoginTab ? '#6366f1' : '#94a3b8',
                borderBottom: isLoginTab ? '2px solid #6366f1' : '2px solid transparent',
                padding: '0.5rem 1rem',
                fontWeight: 700,
                cursor: 'pointer',
                marginBottom: '-2px'
              }}
              onClick={(e) => {
                e.stopPropagation();
                setIsLoginTab(true);
                setError('');
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              style={{
                background: 'transparent',
                border: 'none',
                color: !isLoginTab ? '#6366f1' : '#94a3b8',
                borderBottom: !isLoginTab ? '2px solid #6366f1' : '2px solid transparent',
                padding: '0.5rem 1rem',
                fontWeight: 700,
                cursor: 'pointer',
                marginBottom: '-2px'
              }}
              onClick={(e) => {
                e.stopPropagation();
                setIsLoginTab(false);
                setError('');
              }}
            >
              Create Account
            </button>
          </div>
          <button
            type="button"
            className="close-btn"
            onClick={(e) => {
              e.stopPropagation();
              setAuthModalOpen(false);
            }}
            aria-label="Close modal"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
          {error && (
            <div
              style={{
                padding: '0.65rem 0.85rem',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #ef4444',
                borderRadius: '8px',
                color: '#fca5a5',
                fontSize: '0.85rem',
                marginBottom: '1rem'
              }}
              role="alert"
            >
              {error}
            </div>
          )}

          {!isLoginTab && (
            <div className="form-group">
              <label className="form-label" htmlFor="user-name">Full Name</label>
              <input
                id="user-name"
                type="text"
                className="form-input"
                placeholder="Ankita Singh"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="user-email">Email Address</label>
            <input
              ref={emailInputRef}
              id="user-email"
              type="email"
              className="form-input"
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="user-password">Password</label>
            <input
              id="user-password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="submit-btn"
            disabled={submitting}
          >
            {submitting ? 'Authenticating...' : isLoginTab ? 'Sign In to QueryMind' : 'Create Free Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', margin: '1rem 0 0.5rem', color: '#64748b', fontSize: '0.82rem' }}>
          <span>— or test immediately without credentials —</span>
        </div>

        <button
          type="button"
          className="demo-account-btn"
          onClick={handleDemoClick}
          disabled={submitting}
        >
          <SparklesIcon size={16} />
          <span>1-Click Test as Demo User</span>
        </button>
      </div>
    </div>
  );
};
