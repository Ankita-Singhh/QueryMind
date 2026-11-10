import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api.js';
import { useAuth } from './AuthContext.jsx';

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const { isAuthenticated, user, setAuthModalOpen } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamedContent, setStreamedContent] = useState('');
  const [errorToast, setErrorToast] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);

  // Helper to ensure deprecated/unsupported models are automatically upgraded
  const sanitizeModelName = (m) => {
    if (!m || m === 'gemini-1.5-flash' || m === 'gemini-2.5-flash' || m === 'gemini-1.0-pro') {
      return 'gemini-3.5-flash';
    }
    return m;
  };

  // Settings & Presets
  const [selectedModel, setSelectedModel] = useState('gemini-3.5-flash');
  const [selectedPersona, setSelectedPersona] = useState('general');
  const [useStreaming, setUseStreaming] = useState(true);
  const [temperature, setTemperature] = useState(0.7);

  const abortControllerRef = useRef(null);

  // Fetch system health on mount
  useEffect(() => {
    const fetchHealth = async () => {
      const data = await api.getHealth();
      setSystemHealth(data);
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  // Sync user preferences when user logs in
  useEffect(() => {
    if (user?.preferences) {
      if (user.preferences.model) setSelectedModel(sanitizeModelName(user.preferences.model));
      if (user.preferences.temperature !== undefined) setTemperature(user.preferences.temperature);
    }
  }, [user]);

  // Load conversations when authenticated
  const loadConversations = useCallback(async () => {
    if (!isAuthenticated) {
      setConversations([]);
      return;
    }
    setLoadingList(true);
    try {
      const list = await api.getConversations();
      setConversations(list);
    } catch (err) {
      console.error('[ChatContext] Failed to load conversations:', err.message);
    } finally {
      setLoadingList(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Select a conversation and load its messages
  const selectConversation = async (id) => {
    if (id === currentId) return;
    if (isGenerating) {
      stopGeneration();
    }
    setCurrentId(id);
    setLoadingChat(true);
    setStreamedContent('');
    try {
      const conv = await api.getConversationById(id);
      setMessages(conv.messages || []);
      if (conv.model) setSelectedModel(sanitizeModelName(conv.model));
    } catch (err) {
      showError(`Failed to load conversation: ${err.message}`);
    } finally {
      setLoadingChat(false);
    }
  };

  // Start a fresh new chat
  const createNewChat = () => {
    if (isGenerating) {
      stopGeneration();
    }
    setCurrentId(null);
    setMessages([]);
    setStreamedContent('');
  };

  // Delete a conversation
  const deleteConversation = async (id) => {
    try {
      await api.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => (c._id || c.id) !== id));
      if (currentId === id) {
        createNewChat();
      }
    } catch (err) {
      showError(`Failed to delete conversation: ${err.message}`);
    }
  };

  // Error alert notification
  const showError = (msg) => {
    setErrorToast(msg);
    setTimeout(() => {
      setErrorToast(null);
    }, 5000);
  };

  // Stop ongoing generation
  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
  };

  // Send message
  const sendMessage = async (text) => {
    if (!text || !text.trim() || isGenerating) return;

    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }

    const trimmedText = text.trim();
    const tempUserMsg = {
      _id: `temp-user-${Date.now()}`,
      role: 'user',
      content: trimmedText,
      timestamp: new Date().toISOString()
    };

    // Optimistically append user message
    setMessages((prev) => [...prev, tempUserMsg]);
    setIsGenerating(true);
    setStreamedContent('');

    const payload = {
      conversationId: currentId,
      message: trimmedText,
      model: selectedModel,
      persona: selectedPersona,
      temperature
    };

    if (useStreaming) {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      let partialText = '';

      await api.streamMessage(payload, {
        signal: controller.signal,
        onStart: (startMeta) => {
          if (!currentId && startMeta.conversationId) {
            setCurrentId(startMeta.conversationId);
            loadConversations();
          }
        },
        onChunk: (chunk) => {
          partialText += chunk;
          setStreamedContent(partialText);
        },
        onDone: (doneData) => {
          const finalModelMsg = doneData.modelMessage || {
            _id: `model-${Date.now()}`,
            role: 'model',
            content: partialText,
            timestamp: new Date().toISOString()
          };
          setMessages((prev) => [...prev, finalModelMsg]);
          setStreamedContent('');
          setIsGenerating(false);
          abortControllerRef.current = null;
          loadConversations();
        },
        onError: (err) => {
          console.error('[Chat Stream Error]:', err);
          showError(err.message || 'Stream generation error');
          setIsGenerating(false);
          setStreamedContent('');
          abortControllerRef.current = null;
        }
      });
    } else {
      // Standard REST Unary
      try {
        const res = await api.sendMessage(payload);
        if (res.success) {
          if (!currentId && res.conversationId) {
            setCurrentId(res.conversationId);
            loadConversations();
          }
          setMessages((prev) => [...prev, res.modelMessage]);
        }
      } catch (err) {
        showError(err.message || 'Failed to get response');
      } finally {
        setIsGenerating(false);
      }
    }
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        currentId,
        messages,
        loadingList,
        loadingChat,
        isGenerating,
        streamedContent,
        errorToast,
        systemHealth,
        selectedModel,
        selectedPersona,
        useStreaming,
        temperature,
        setSelectedModel,
        setSelectedPersona,
        setUseStreaming,
        setTemperature,
        selectConversation,
        createNewChat,
        deleteConversation,
        sendMessage,
        stopGeneration,
        showError,
        refreshConversations: loadConversations
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
