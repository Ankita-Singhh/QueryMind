import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, getDBStatus } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();

// Middleware: CORS
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(new Error('CORS policy: This origin is not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware: Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check & Diagnostics Route
app.get('/api/health', (req, res) => {
  dotenv.config({ override: true });
  const dbStatus = getDBStatus();
  res.status(200).json({
    status: 'ok',
    service: 'QueryMind API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      driver: dbStatus.driver,
      connected: dbStatus.isConnected,
      fallbackMode: dbStatus.fallbackMode
    },
    geminiConfigured: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '' && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here')
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// 404 Route Handler for undefined endpoints
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Root welcome
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to QueryMind API - Generative AI Conversational Web Application',
    documentation: '/api/health'
  });
});

// Centralized Error Handler Middleware
app.use(errorHandler);

// Start Server
const PORT = parseInt(process.env.PORT || '5000', 10);

const startServer = async () => {
  try {
    // Attempt database connection
    await connectDB();

    const listenWithFallback = (portToTry) => {
      const server = app.listen(portToTry, () => {
        console.log(`\n============================================================`);
        console.log(`🧠 QueryMind API Server running on: http://localhost:${portToTry}`);
        console.log(`📡 Healthcheck: http://localhost:${portToTry}/api/health`);
        console.log(`🔐 Auth Endpoints: http://localhost:${portToTry}/api/auth`);
        console.log(`💬 Chat & SSE Stream: http://localhost:${portToTry}/api/chat`);
        console.log(`============================================================\n`);
      });

      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.warn(`\n[Port Notice]: Port ${portToTry} is already in use by another running process.`);
          if (portToTry === PORT) {
            const fallbackPort = portToTry === 5000 ? 5001 : portToTry + 1;
            console.warn(`QueryMind is automatically attempting fallback port: ${fallbackPort}...\n`);
            listenWithFallback(fallbackPort);
          } else {
            console.error(`Unable to bind server: both port ${PORT} and ${portToTry} are in use.`);
            process.exit(1);
          }
        } else {
          console.error('Failed to start QueryMind server:', err);
          process.exit(1);
        }
      });
    };

    listenWithFallback(PORT);
  } catch (error) {
    console.error('Failed to initialize QueryMind server:', error);
    process.exit(1);
  }
};

startServer();
