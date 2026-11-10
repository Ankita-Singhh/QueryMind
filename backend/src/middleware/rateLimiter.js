import rateLimit from 'express-rate-limit';

/**
 * Standard API rate limiter for general routes (Auth, profile, conversations)
 */
export const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

/**
 * Specialized AI Inference limiter to protect Gemini API quotas and costs
 */
export const aiInferenceLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 30, // 30 AI prompts per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'QueryMind rate limit reached (30 queries / minute). Please wait a moment before submitting your next prompt.',
    code: 'AI_RATE_LIMIT_EXCEEDED'
  }
});
