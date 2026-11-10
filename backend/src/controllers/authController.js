import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { fallbackStore } from '../models/fallbackStore.js';
import { getDBStatus } from '../config/db.js';

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'querymind_secret_jwt_key_987654321_ankita_2026',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    if (getDBStatus().fallbackMode) {
      const existingUser = await fallbackStore.users.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'An account with that email already exists'
        });
      }

      const user = await fallbackStore.users.create({ name, email, password });
      const token = generateToken(user.id);

      return res.status(201).json({
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          preferences: user.preferences
        }
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with that email already exists'
      });
    }

    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        preferences: user.preferences
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    if (getDBStatus().fallbackMode) {
      const user = await fallbackStore.users.findOne({ email });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials. User not found.'
        });
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials. Incorrect password.'
        });
      }

      const token = generateToken(user.id);
      return res.status(200).json({
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          preferences: user.preferences
        }
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.'
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Incorrect password.'
      });
    }

    const token = generateToken(user._id);
    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        preferences: user.preferences
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      user: {
        id: req.user._id || req.user.id,
        name: req.user.name,
        email: req.user.email,
        preferences: req.user.preferences
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updatePreferences = async (req, res, next) => {
  try {
    const { theme, model, temperature, systemInstruction } = req.body;
    const userId = req.user._id || req.user.id;

    if (getDBStatus().fallbackMode) {
      const updated = await fallbackStore.users.updatePreferences(userId, {
        theme,
        model,
        temperature,
        systemInstruction
      });
      return res.status(200).json({ success: true, preferences: updated.preferences });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (theme) user.preferences.theme = theme;
    if (model) user.preferences.model = model;
    if (typeof temperature === 'number') user.preferences.temperature = temperature;
    if (systemInstruction !== undefined) user.preferences.systemInstruction = systemInstruction;

    await user.save();

    return res.status(200).json({
      success: true,
      preferences: user.preferences
    });
  } catch (error) {
    next(error);
  }
};
