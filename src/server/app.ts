import express, { type Express } from 'express';
import { requestContextMiddleware } from './middleware/request-context';
import { healthRouter } from './modules/health/health.routes';
import { databaseRouter } from './modules/database/database.routes';
import { apiNotFoundHandler, centralizedErrorHandler } from './middleware/error-handler';

export function createApiApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Request correlation ID, structured logging & security headers
  app.use(requestContextMiddleware);

  // API v1 Modular Routers
  app.use('/api/v1', healthRouter);
  app.use('/api/v1', databaseRouter);

  // Unknown API route 404 handler
  app.use('/api', apiNotFoundHandler);

  // Centralized error handling middleware
  app.use(centralizedErrorHandler);

  return app;
}
