import crypto from 'crypto';

/**
 * Structured Enterprise Logger with Correlation IDs & JSON Output
 */
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

const CURRENT_LOG_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] ?? LOG_LEVELS.INFO;

function formatLog(level, message, context = {}) {
  const timestamp = new Date().toISOString();
  const correlationId = context.correlationId || crypto.randomUUID();
  
  const logEntry = {
    timestamp,
    level,
    correlationId,
    message,
    ...context
  };

  if (process.env.NODE_ENV === 'production') {
    return JSON.stringify(logEntry);
  }

  // Developer-friendly formatted string in local dev
  const color = level === 'ERROR' ? '\x1b[31m' : level === 'WARN' ? '\x1b[33m' : level === 'INFO' ? '\x1b[36m' : '\x1b[90m';
  const reset = '\x1b[0m';
  const metaStr = Object.keys(context).length > 0 ? ` ${JSON.stringify(context)}` : '';
  return `${color}[${timestamp}] [${level}]${reset} [${correlationId.slice(0, 8)}] ${message}${metaStr}`;
}

export const logger = {
  debug: (message, context) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.DEBUG) {
      console.log(formatLog('DEBUG', message, context));
    }
  },
  info: (message, context) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.INFO) {
      console.log(formatLog('INFO', message, context));
    }
  },
  warn: (message, context) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.WARN) {
      console.warn(formatLog('WARN', message, context));
    }
  },
  error: (message, context) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.ERROR) {
      console.error(formatLog('ERROR', message, context));
    }
  }
};

export default logger;
