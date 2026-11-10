import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { fallbackStore } from '../models/fallbackStore.js';
import { getDBStatus } from '../config/db.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'querymind_secret_jwt_key_987654321_ankita_2026');

      if (getDBStatus().fallbackMode) {
        const user = await fallbackStore.users.findById(decoded.id);
        if (!user) {
          return res.status(401).json({ success: false, message: 'User not found' });
        }
        req.user = user;
      } else {
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
          return res.status(401).json({ success: false, message: 'User not found' });
        }
        req.user = user;
      }

      return next();
    } catch (error) {
      console.error('[Auth Middleware] Token verification failed:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed verification or expired'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no bearer token provided'
    });
  }
};
