import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { logger } from '../common/logger';

export function requestContextMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incomingId = req.header('x-request-id');
  const requestId =
    incomingId && /^[a-zA-Z0-9_-]{4,64}$/.test(incomingId)
      ? incomingId
      : `req_${crypto.randomBytes(6).toString('hex')}`;

  res.locals.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  // Baseline security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (req.path.startsWith('/api/')) {
    const startTime = Date.now();
    res.on('finish', () => {
      const durationMs = Date.now() - startTime;
      logger.info(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${durationMs}ms)`, {
        requestId,
        module: 'http',
        meta: {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          durationMs,
        },
      });
    });
  }

  next();
}
