import express from 'express';
import {
  getConversations,
  getConversationById,
  createConversation,
  deleteConversation,
  sendMessage,
  streamMessage
} from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';
import { aiInferenceLimiter, generalLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Conversation management
router.get('/conversations', protect, generalLimiter, getConversations);
router.get('/conversations/:id', protect, generalLimiter, getConversationById);
router.post('/conversations', protect, generalLimiter, createConversation);
router.delete('/conversations/:id', protect, generalLimiter, deleteConversation);

// AI Inference endpoints
router.post('/send', protect, aiInferenceLimiter, sendMessage);
router.post('/stream', protect, aiInferenceLimiter, streamMessage);

export default router;
