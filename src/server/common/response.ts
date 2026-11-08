import type { Response } from 'express';
import type { AppErrorCode, ErrorDetailItem } from './errors';

export interface ApiSuccessEnvelope<T> {
  success: true;
  data: T;
  meta: {
    timestamp: string;
    requestId: string;
  };
}

export interface ApiErrorEnvelope {
  success: false;
  error: {
    code: AppErrorCode;
    message: string;
    suggestions: string[];
    details: ErrorDetailItem[];
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}

export function buildSuccessEnvelope<T>(data: T, requestId = 'req_local'): ApiSuccessEnvelope<T> {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  };
}

export function buildErrorEnvelope(
  options: {
    code: AppErrorCode;
    message: string;
    suggestions?: string[];
    details?: ErrorDetailItem[];
  },
  requestId = 'req_local'
): ApiErrorEnvelope {
  return {
    success: false,
    error: {
      code: options.code,
      message: options.message,
      suggestions: options.suggestions ?? [],
      details: options.details ?? [],
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  };
}

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): Response {
  const requestId = (res.locals.requestId as string) || 'req_unknown';
  return res.status(statusCode).json(buildSuccessEnvelope(data, requestId));
}
