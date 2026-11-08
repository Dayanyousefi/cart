import express, { type Express } from 'express';
import { requestContextMiddleware } from './middleware/request-context';
import { healthRouter } from './modules/health/health.routes';
import { databaseRouter } from './modules/database/database.routes';
import { inviteRouter } from './modules/invite/invite.routes.ts';
import { apiNotFoundHandler, centralizedErrorHandler } from './middleware/error-handler';

export function createApiApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));

  // Request correlation ID, structured logging & security headers
  app.use(requestContextMiddleware);

  // API v1 Modular Routers
  app.use('/api/v1', healthRouter);
  app.use('/api/v1', databaseRouter);
  app.use('/api/v1', inviteRouter);

  // Unknown API route 404 handler
  app.use('/api', apiNotFoundHandler);

  // Centralized error handling middleware
  app.use(centralizedErrorHandler);

  return app;
}
