/**
 * シンプルなロガーユーティリティ
 * 本番環境では環境変数でログレベルを制御
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function getLogLevel(): number {
  const level = (process.env.LOG_LEVEL || 'info').toLowerCase() as LogLevel;
  return LOG_LEVELS[level] ?? LOG_LEVELS.info;
}

function formatMessage(level: string, message: string): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
}

export const logger = {
  debug: (message: string, ...args: unknown[]) => {
    if (getLogLevel() <= LOG_LEVELS.debug) {
      console.debug(formatMessage('debug', message), ...args);
    }
  },

  info: (message: string, ...args: unknown[]) => {
    if (getLogLevel() <= LOG_LEVELS.info) {
      console.info(formatMessage('info', message), ...args);
    }
  },

  warn: (message: string, ...args: unknown[]) => {
    if (getLogLevel() <= LOG_LEVELS.warn) {
      console.warn(formatMessage('warn', message), ...args);
    }
  },

  error: (message: string, ...args: unknown[]) => {
    if (getLogLevel() <= LOG_LEVELS.error) {
      console.error(formatMessage('error', message), ...args);
    }
  },
};
