import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// In-memory collections for zero-setup execution
const memoryUsers = new Map();
const memoryConversations = new Map();

export const fallbackStore = {
  users: {
    async findOne({ email }) {
      for (const user of memoryUsers.values()) {
        if (user.email.toLowerCase() === email.toLowerCase()) {
          return { ...user };
        }
      }
      return null;
    },

    async findById(id) {
      const user = memoryUsers.get(id);
      if (!user) return null;
      return { ...user };
    },

    async create({ name, email, password, preferences }) {
      const id = crypto.randomUUID();
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const newUser = {
        _id: id,
        id,
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        preferences: preferences || {
          theme: 'dark',
          model: 'gemini-3.8-flash',
          temperature: 0.7,
          systemInstruction: 'You are QueryMind, a helpful and precise AI assistant.'
        },
        createdAt: new Date(),
        async matchPassword(enteredPassword) {
          return await bcrypt.compare(enteredPassword, this.password);
        }
      };
      memoryUsers.set(id, newUser);
      return { ...newUser };
    },

    async updatePreferences(id, preferences) {
      const user = memoryUsers.get(id);
      if (!user) return null;
      user.preferences = { ...user.preferences, ...preferences };
      memoryUsers.set(id, user);
      return { ...user };
    }
  },

  conversations: {
    async findByUser(userId) {
      const list = [];
      for (const conv of memoryConversations.values()) {
        if (conv.userId === userId) {
          list.push({ ...conv });
        }
      }
      return list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    },

    async findById(id) {
      const conv = memoryConversations.get(id);
      if (!conv) return null;
      return { ...conv };
    },

    async create({ userId, title, model, systemPrompt, messages = [] }) {
      const id = crypto.randomUUID();
      const newConv = {
        _id: id,
        id,
        userId,
        title: title || 'New Conversation',
        model: model || 'gemini-3.8-flash',
        systemPrompt: systemPrompt || 'You are QueryMind, an intelligent, empathetic, and context-aware conversational AI assistant.',
        messages,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      memoryConversations.set(id, newConv);
      return { ...newConv };
    },

    async addMessage(id, message) {
      const conv = memoryConversations.get(id);
      if (!conv) return null;
      const msgObj = {
        _id: crypto.randomUUID(),
        ...message,
        timestamp: new Date()
      };
      conv.messages.push(msgObj);
      conv.updatedAt = new Date();
      memoryConversations.set(id, conv);
      return msgObj;
    },

    async updateTitle(id, title) {
      const conv = memoryConversations.get(id);
      if (!conv) return null;
      conv.title = title;
      conv.updatedAt = new Date();
      memoryConversations.set(id, conv);
      return { ...conv };
    },

    async delete(id) {
      return memoryConversations.delete(id);
    }
  }
};
