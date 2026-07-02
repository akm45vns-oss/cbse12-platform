import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler } from './middlewares/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import { globalLimiter } from './middlewares/rateLimiter.js';

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true
}));

// Apply Global Rate Limiter
app.use(globalLimiter);

// Body Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'API is running', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/v1/auth', authRoutes);

// Global Error Handler Middleware
app.use(errorHandler);

export default app;
