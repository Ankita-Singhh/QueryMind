let cachedApiBase = null;

/**
 * Resolves the active QueryMind API base URL, supporting both
 * default port 5000 and automatic fallback port 5001 (if 5000 is occupied).
 */
export const getApiBaseUrl = async () => {
  if (cachedApiBase) return cachedApiBase;
  if (import.meta.env.VITE_API_URL) {
    cachedApiBase = import.meta.env.VITE_API_URL;
    return cachedApiBase;
  }

  // 1. Check if default port 5000 is running QueryMind API
  try {
    const res5000 = await fetch('http://localhost:5000/api/health', { signal: AbortSignal.timeout(600) });
    if (res5000.ok) {
      const data = await res5000.json();
      if (data.service === 'QueryMind API') {
        cachedApiBase = 'http://localhost:5000/api';
        return cachedApiBase;
      }
    }
  } catch {}

  // 2. Check if fallback port 5001 is running QueryMind API
  try {
    const res5001 = await fetch('http://localhost:5001/api/health', { signal: AbortSignal.timeout(600) });
    if (res5001.ok) {
      const data = await res5001.json();
      if (data.service === 'QueryMind API') {
        cachedApiBase = 'http://localhost:5001/api';
        return cachedApiBase;
      }
    }
  } catch {}

  // 3. Fallback to standard localhost:5000/api
  cachedApiBase = 'http://localhost:5000/api';
  return cachedApiBase;
};

/**
 * Returns authorization header with stored JWT
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('querymind_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const api = {
  // Authentication Endpoints
  async register(name, email, password) {
    const baseUrl = await getApiBaseUrl();
    const res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');
    return data;
  },

  async login(email, password) {
    const baseUrl = await getApiBaseUrl();
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    return data;
  },

  async getMe() {
    const baseUrl = await getApiBaseUrl();
    const res = await fetch(`${baseUrl}/auth/me`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Session expired');
    return data;
  },

  async updatePreferences(preferences) {
    const baseUrl = await getApiBaseUrl();
    const res = await fetch(`${baseUrl}/auth/preferences`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(preferences)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update preferences');
    return data;
  },

  // Conversation Management
  async getConversations() {
    const baseUrl = await getApiBaseUrl();
    const res = await fetch(`${baseUrl}/chat/conversations`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch conversations');
    return data.conversations || [];
  },

  async getConversationById(id) {
    const baseUrl = await getApiBaseUrl();
    const res = await fetch(`${baseUrl}/chat/conversations/${id}`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch conversation');
    return data.conversation;
  },

  async createConversation(data = {}) {
    const baseUrl = await getApiBaseUrl();
    const res = await fetch(`${baseUrl}/chat/conversations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.message || 'Failed to create conversation');
    return resData.conversation;
  },

  async deleteConversation(id) {
    const baseUrl = await getApiBaseUrl();
    const res = await fetch(`${baseUrl}/chat/conversations/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete conversation');
    return data;
  },

  // Standard REST AI Inference
  async sendMessage(payload) {
    const baseUrl = await getApiBaseUrl();
    const res = await fetch(`${baseUrl}/chat/send`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to generate response');
    return data;
  },

  // Server-Sent Events (SSE) Streaming AI Inference
  async streamMessage(payload, { onStart, onChunk, onDone, onError, signal }) {
    try {
      const baseUrl = await getApiBaseUrl();
      const response = await fetch(`${baseUrl}/chat/stream`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
        signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        // Keep incomplete tail in buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;

          const dataStr = trimmed.slice(5).trim();
          if (dataStr === '[DONE]') {
            continue;
          }

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.type === 'start') {
              onStart?.(parsed);
            } else if (parsed.type === 'chunk') {
              onChunk?.(parsed.chunk);
            } else if (parsed.type === 'done') {
              onDone?.(parsed);
            } else if (parsed.type === 'error') {
              onError?.(new Error(parsed.message));
            }
          } catch (e) {
            console.warn('[SSE Parse Notice]:', e.message, dataStr);
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('[SSE Stream Aborted by user]');
      } else {
        onError?.(err);
      }
    }
  },

  // System Health / Status
  async getHealth() {
    try {
      const baseUrl = await getApiBaseUrl();
      const res = await fetch(`${baseUrl}/health`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }
};
