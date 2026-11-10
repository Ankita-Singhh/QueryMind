import { Conversation } from '../models/Conversation.js';
import { fallbackStore } from '../models/fallbackStore.js';
import { getDBStatus } from '../config/db.js';
import { GeminiService } from '../services/geminiService.js';
import { estimateTokens } from '../services/memoryService.js';

export const getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;

    if (getDBStatus().fallbackMode) {
      const list = await fallbackStore.conversations.findByUser(userId);
      return res.status(200).json({ success: true, conversations: list });
    }

    const conversations = await Conversation.find({ userId })
      .select('title model createdAt updatedAt messages')
      .sort({ updatedAt: -1 });

    const formatted = conversations.map((c) => ({
      _id: c._id,
      id: c._id,
      title: c.title,
      model: c.model,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      messageCount: c.messages.length,
      lastMessage: c.messages[c.messages.length - 1]?.content?.slice(0, 80) || ''
    }));

    return res.status(200).json({ success: true, conversations: formatted });
  } catch (error) {
    next(error);
  }
};

export const getConversationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    if (getDBStatus().fallbackMode) {
      const conversation = await fallbackStore.conversations.findById(id);
      if (!conversation || conversation.userId !== userId) {
        return res.status(404).json({ success: false, message: 'Conversation not found' });
      }
      return res.status(200).json({ success: true, conversation });
    }

    const conversation = await Conversation.findOne({ _id: id, userId });
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    return res.status(200).json({ success: true, conversation });
  } catch (error) {
    next(error);
  }
};

export const createConversation = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { title, model, systemPrompt } = req.body;

    if (getDBStatus().fallbackMode) {
      const newConv = await fallbackStore.conversations.create({
        userId,
        title: title || 'New Conversation',
        model: model || req.user?.preferences?.model || 'gemini-3.8-flash',
        systemPrompt: systemPrompt || req.user?.preferences?.systemInstruction
      });
      return res.status(201).json({ success: true, conversation: newConv });
    }

    const conversation = await Conversation.create({
      userId,
      title: title || 'New Conversation',
      model: model || req.user?.preferences?.model || 'gemini-3.8-flash',
      systemPrompt: systemPrompt || req.user?.preferences?.systemInstruction,
      messages: []
    });

    return res.status(201).json({ success: true, conversation });
  } catch (error) {
    next(error);
  }
};

export const deleteConversation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    if (getDBStatus().fallbackMode) {
      const deleted = await fallbackStore.conversations.delete(id);
      return res.status(200).json({ success: true, message: 'Conversation deleted' });
    }

    const conversation = await Conversation.findOneAndDelete({ _id: id, userId });
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    return res.status(200).json({ success: true, message: 'Conversation deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Standard REST Unary AI Inference Handler
 */
export const sendMessage = async (req, res, next) => {
  try {
    const { conversationId, message, model, persona, temperature } = req.body;
    const userId = req.user._id || req.user.id;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    let conversation;
    let isFallback = getDBStatus().fallbackMode;

    if (isFallback) {
      if (conversationId) {
        conversation = await fallbackStore.conversations.findById(conversationId);
      }
      if (!conversation) {
        conversation = await fallbackStore.conversations.create({
          userId,
          title: message.slice(0, 35) + (message.length > 35 ? '...' : ''),
          model: model || 'gemini-3.8-flash'
        });
      }
    } else {
      if (conversationId) {
        conversation = await Conversation.findOne({ _id: conversationId, userId });
      }
      if (!conversation) {
        conversation = await Conversation.create({
          userId,
          title: message.slice(0, 35) + (message.length > 35 ? '...' : ''),
          model: model || 'gemini-3.8-flash',
          messages: []
        });
      }
    }

    const history = conversation.messages || [];

    // Save user message
    const userMessage = {
      role: 'user',
      content: message.trim(),
      tokens: estimateTokens(message),
      timestamp: new Date()
    };

    if (isFallback) {
      await fallbackStore.conversations.addMessage(conversation.id || conversation._id, userMessage);
    } else {
      conversation.messages.push(userMessage);
    }

    // Call Gemini API
    const aiResult = await GeminiService.generateResponse({
      prompt: message.trim(),
      history,
      model: model || conversation.model || 'gemini-3.8-flash',
      temperature: temperature !== undefined ? temperature : req.user?.preferences?.temperature,
      systemInstruction: conversation.systemPrompt || req.user?.preferences?.systemInstruction,
      persona: persona || 'general'
    });

    const modelMessage = {
      role: 'model',
      content: aiResult.text,
      tokens: aiResult.tokensEstimate || estimateTokens(aiResult.text),
      timestamp: new Date()
    };

    if (isFallback) {
      await fallbackStore.conversations.addMessage(conversation.id || conversation._id, modelMessage);
      // Auto-update title if it's the first exchange
      if (conversation.title === 'New Conversation') {
        const generatedTitle = message.slice(0, 30) + '...';
        await fallbackStore.conversations.updateTitle(conversation.id || conversation._id, generatedTitle);
        conversation.title = generatedTitle;
      }
    } else {
      conversation.messages.push(modelMessage);
      if (conversation.title === 'New Conversation') {
        conversation.title = message.slice(0, 30) + '...';
      }
      await conversation.save();
    }

    return res.status(200).json({
      success: true,
      conversationId: conversation._id || conversation.id,
      title: conversation.title,
      userMessage,
      modelMessage,
      modelUsed: aiResult.modelUsed
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Server-Sent Events (SSE) Streaming AI Inference Handler
 */
export const streamMessage = async (req, res, next) => {
  try {
    const { conversationId, message, model, persona, temperature } = req.body;
    const userId = req.user._id || req.user.id;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    let conversation;
    let isFallback = getDBStatus().fallbackMode;

    if (isFallback) {
      if (conversationId) {
        conversation = await fallbackStore.conversations.findById(conversationId);
      }
      if (!conversation) {
        conversation = await fallbackStore.conversations.create({
          userId,
          title: message.slice(0, 35) + (message.length > 35 ? '...' : ''),
          model: model || 'gemini-3.8-flash'
        });
      }
    } else {
      if (conversationId) {
        conversation = await Conversation.findOne({ _id: conversationId, userId });
      }
      if (!conversation) {
        conversation = await Conversation.create({
          userId,
          title: message.slice(0, 35) + (message.length > 35 ? '...' : ''),
          model: model || 'gemini-3.8-flash',
          messages: []
        });
      }
    }

    const history = [...(conversation.messages || [])];

    // Save user message
    const userMessage = {
      role: 'user',
      content: message.trim(),
      tokens: estimateTokens(message),
      timestamp: new Date()
    };

    if (isFallback) {
      await fallbackStore.conversations.addMessage(conversation.id || conversation._id, userMessage);
    } else {
      conversation.messages.push(userMessage);
      await conversation.save();
    }

    // Prepare SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Send metadata event
    res.write(`data: ${JSON.stringify({
      type: 'start',
      conversationId: conversation._id || conversation.id,
      title: conversation.title
    })}\n\n`);

    let accumulatedText = '';

    await GeminiService.streamResponse({
      prompt: message.trim(),
      history,
      model: model || conversation.model || 'gemini-3.8-flash',
      temperature: temperature !== undefined ? temperature : req.user?.preferences?.temperature,
      systemInstruction: conversation.systemPrompt || req.user?.preferences?.systemInstruction,
      persona: persona || 'general',
      onChunk: (chunk) => {
        accumulatedText += chunk;
        res.write(`data: ${JSON.stringify({ type: 'chunk', chunk })}\n\n`);
      },
      onDone: async ({ modelUsed }) => {
        const modelMessage = {
          role: 'model',
          content: accumulatedText,
          tokens: estimateTokens(accumulatedText),
          timestamp: new Date()
        };

        if (isFallback) {
          await fallbackStore.conversations.addMessage(conversation.id || conversation._id, modelMessage);
          if (conversation.title === 'New Conversation') {
            await fallbackStore.conversations.updateTitle(conversation.id || conversation._id, message.slice(0, 30) + '...');
          }
        } else {
          conversation.messages.push(modelMessage);
          if (conversation.title === 'New Conversation') {
            conversation.title = message.slice(0, 30) + '...';
          }
          await conversation.save();
        }

        res.write(`data: ${JSON.stringify({
          type: 'done',
          modelUsed,
          modelMessage
        })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      },
      onError: (err) => {
        console.error('[Stream Error]:', err.message);
        res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
        res.end();
      }
    });
  } catch (error) {
    next(error);
  }
};
