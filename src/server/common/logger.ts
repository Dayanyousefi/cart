export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  requestId?: string;
  module?: string;
  meta?: Record<string, unknown>;
}

const recentLogsRingBuffer: LogEntry[] = [];
const MAX_BUFFER_LOGS = 50;

export function createLogEntry(
  level: LogLevel,
  message: string,
  context?: { requestId?: string; module?: string; meta?: Record<string, unknown> }
): LogEntry {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(context?.requestId ? { requestId: context.requestId } : {}),
    ...(context?.module ? { module: context.module } : {}),
    ...(context?.meta ? { meta: context.meta } : {}),
  };

  recentLogsRingBuffer.unshift(entry);
  if (recentLogsRingBuffer.length > MAX_BUFFER_LOGS) {
    recentLogsRingBuffer.pop();
  }

  return entry;
}

export const logger = {
  debug(
    message: string,
    context?: { requestId?: string; module?: string; meta?: Record<string, unknown> }
  ) {
    return createLogEntry('debug', message, context);
  },
  info(
    message: string,
    context?: { requestId?: string; module?: string; meta?: Record<string, unknown> }
  ) {
    const entry = createLogEntry('info', message, context);
    if (process.env.NODE_ENV !== 'test') {
      console.log(JSON.stringify(entry));
    }
    return entry;
  },
  warn(
    message: string,
    context?: { requestId?: string; module?: string; meta?: Record<string, unknown> }
  ) {
    const entry = createLogEntry('warn', message, context);
    if (process.env.NODE_ENV !== 'test') {
      console.warn(JSON.stringify(entry));
    }
    return entry;
  },
  error(
    message: string,
    context?: { requestId?: string; module?: string; meta?: Record<string, unknown> }
  ) {
    const entry = createLogEntry('error', message, context);
    if (process.env.NODE_ENV !== 'test') {
      console.error(JSON.stringify(entry));
    }
    return entry;
  },
  getRecentLogs(limit = 15): LogEntry[] {
    return recentLogsRingBuffer.slice(0, limit);
  },
};
