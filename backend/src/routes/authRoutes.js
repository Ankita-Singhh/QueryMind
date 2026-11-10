import express from 'express';
import { register, login, getMe, updatePreferences } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { generalLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', generalLimiter, register);
router.post('/login', generalLimiter, login);
router.get('/me', protect, getMe);
router.put('/preferences', protect, updatePreferences);

export default router;
