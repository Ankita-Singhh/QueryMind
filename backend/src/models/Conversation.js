import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true,
    enum: ['user', 'model', 'system']
  },
  content: {
    type: String,
    required: true
  },
  tokens: {
    type: Number,
    default: 0
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      default: 'New Conversation',
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    model: {
      type: String,
      default: 'gemini-3.8-flash'
    },
    systemPrompt: {
      type: String,
      default: 'You are QueryMind, an intelligent, empathetic, and context-aware conversational AI assistant.'
    },
    messages: [messageSchema]
  },
  {
    timestamps: true
  }
);

export const Conversation = mongoose.model('Conversation', conversationSchema);
