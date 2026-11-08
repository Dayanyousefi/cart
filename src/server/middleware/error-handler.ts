import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../common/errors';
import { buildErrorEnvelope } from '../common/response';
import { logger } from '../common/logger';

export function apiNotFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(AppError.notFound(`مسیر درخواستی ${req.method} ${req.originalUrl} در API پلتفرم یافت نشد.`));
}

export function centralizedErrorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = (res.locals.requestId as string) || 'req_unknown';

  if (err instanceof AppError) {
    logger.warn(`Operational error [${err.code}]: ${err.message}`, {
      requestId,
      module: 'error-handler',
      meta: {
        statusCode: err.statusCode,
        path: req.originalUrl,
      },
    });

    res.status(err.statusCode).json(
      buildErrorEnvelope(
        {
          code: err.code,
          message: err.message,
          suggestions: err.suggestions,
          details: err.details,
        },
        requestId
      )
    );
    return;
  }

  const unexpectedMessage = err instanceof Error ? err.message : 'Unknown error';
  logger.error(`Unhandled internal exception: ${unexpectedMessage}`, {
    requestId,
    module: 'error-handler',
    meta: {
      path: req.originalUrl,
    },
  });

  res.status(500).json(
    buildErrorEnvelope(
      {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'خطای داخلی سرور رخ داده است. شناسه خطا در لاگ سیستم ثبت شد.',
      },
      requestId
    )
  );
}
