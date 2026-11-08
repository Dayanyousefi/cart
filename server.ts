import path from 'node:path';
import fs from 'node:fs';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { envConfig } from './src/server/config/env';
import { logger } from './src/server/common/logger';
import { requestContextMiddleware } from './src/server/middleware/request-context';
import { healthRouter } from './src/server/modules/health/health.routes';
import { databaseRouter } from './src/server/modules/database/database.routes';
import { apiNotFoundHandler, centralizedErrorHandler } from './src/server/middleware/error-handler';

async function startServer(): Promise<void> {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Request context, security headers & structured access logs
  app.use(requestContextMiddleware);

  // Mount API v1 routes
  app.use('/api/v1', healthRouter);
  app.use('/api/v1', databaseRouter);
  app.use('/api', apiNotFoundHandler);

  if (envConfig.nodeEnv !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  // Centralized Error Handling Middleware
  app.use(centralizedErrorHandler);

  app.listen(envConfig.port, '0.0.0.0', () => {
    logger.info(
      `Eyvan Modular Monolith Server started on http://0.0.0.0:${envConfig.port} [${envConfig.nodeEnv}]`,
      {
        module: 'bootstrap',
        meta: {
          port: envConfig.port,
          nodeEnv: envConfig.nodeEnv,
          timezone: envConfig.defaultTimezone,
          queueDriver: envConfig.queueDriver,
          paymentGateway: envConfig.paymentGatewayProvider,
        },
      }
    );
  });
}

startServer().catch((err) => {
  logger.error('Fatal error during server bootstrap', {
    module: 'bootstrap',
    meta: { error: err instanceof Error ? err.message : String(err) },
  });
  process.exit(1);
});
