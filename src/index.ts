import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { env } from './config/env';
import { corsOptions } from './config/cors';
import { authMiddleware } from './config/auth';
import { logger } from './config/logger';
import { AppError } from './utils/error';
import { sendError } from './utils/responses';

// Import routes
import healthRouter from './routes/health';
import privacyRouter from './routes/privacy';
import ugcRouter from './routes/ugc';
import billingRouter from './routes/billing';
import webhookRouter from './routes/webhook';

const app = express();

// ==================== MIDDLEWARE ====================

// CORS - must be first
app.use(cors(corsOptions));

// Webhook route with raw body parser (MUST come before express.json())
app.use('/webhook', express.raw({ type: 'application/json' }), webhookRouter);

// JSON body parser for all other routes
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// ==================== ROUTES ====================

// Public routes (no auth required)
app.get('/health', healthRouter);
app.use('/privacy', privacyRouter);

// Protected API routes (require auth)
app.use('/api/ugc', authMiddleware, ugcRouter);
app.use('/api/billing', authMiddleware, billingRouter);

// ==================== ERROR HANDLING ====================

// 404 handler
app.use((req, res) => {
  sendError(res, 404, 'NOT_FOUND', 'Route not found');
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', err);

  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.errorCode, err.message, err.details);
  } else {
    sendError(res, 500, 'INTERNAL_ERROR', 'An unexpected error occurred');
  }
});

// ==================== START SERVER ====================

const port = env.PORT;

app.listen(port, () => {
  logger.info(`🚀 Server is running on port ${port}`);
  logger.info(`📝 Environment: ${env.NODE_ENV}`);
  logger.info(`✅ Health check: http://localhost:${port}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

export default app;
