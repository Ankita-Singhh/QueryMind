import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('querymind_token') || null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const logout = () => {
    localStorage.removeItem('querymind_token');
    setToken(null);
    setUser(null);
  };

  // Initialize session from token
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('querymind_token');
      if (savedToken) {
        try {
          const res = await api.getMe();
          if (res.success && res.user) {
            setUser(res.user);
          } else {
            logout();
          }
        } catch (err) {
          console.warn('[Auth] Session validation failed:', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    if (res.success && res.token) {
      localStorage.setItem('querymind_token', res.token);
      setToken(res.token);
      setUser(res.user);
      setAuthModalOpen(false);
      return res;
    }
    throw new Error(res.message || 'Login failed');
  };

  const register = async (name, email, password) => {
    const res = await api.register(name, email, password);
    if (res.success && res.token) {
      localStorage.setItem('querymind_token', res.token);
      setToken(res.token);
      setUser(res.user);
      setAuthModalOpen(false);
      return res;
    }
    throw new Error(res.message || 'Registration failed');
  };

  const loginAsDemo = async () => {
    // Convenient 1-click test login for reviewers/interviewers
    const demoEmail = 'guest.developer@querymind.ai';
    const demoPassword = 'Password123!';
    try {
      await login(demoEmail, demoPassword);
    } catch {
      // If demo user doesn't exist yet, auto-register
      await register('Demo Developer', demoEmail, demoPassword);
    }
  };

  const updatePreferences = async (newPrefs) => {
    const res = await api.updatePreferences(newPrefs);
    if (res.success && res.preferences) {
      setUser((prev) => ({
        ...prev,
        preferences: res.preferences
      }));
    }
    return res;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        authModalOpen,
        setAuthModalOpen,
        login,
        register,
        loginAsDemo,
        logout,
        updatePreferences
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
