/**
 * Production-safe logger utility
 * - Only logs in development mode
 * - Provides namespaced logging for easier debugging
 * - Silences all non-error logs in production (PHASE 6.4)
 */

const isDev = !import.meta.env.PROD

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug'

interface Logger {
  log: (...args: unknown[]) => void
  info: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
  debug: (...args: unknown[]) => void
}

/**
 * Creates a namespaced logger that only outputs in development
 * @param namespace - A prefix for all log messages (e.g., '[VoiceCall]', '[Auth]')
 */
export function createLogger(namespace: string): Logger {
  const createLogFn = (level: LogLevel) => (...args: unknown[]) => {
    // Always allow errors in production for debugging critical issues
    if (level === 'error') {
      console[level](namespace, ...args)
      return
    }

    // Only log non-errors in development
    if (isDev) {
      console[level](namespace, ...args)
    }
  }

  return {
    log: createLogFn('log'),
    info: createLogFn('info'),
    warn: createLogFn('warn'),
    error: createLogFn('error'),
    debug: createLogFn('debug'),
  }
}

/**
 * Global logger for general app logs
 */
export const logger = createLogger('[App]')

/**
 * Specific loggers for different modules
 */
export const voiceCallLogger = createLogger('[VoiceCall]')
export const voiceChatLogger = createLogger('[VoiceChat]')
export const pushLogger = createLogger('[Push]')
export const authLogger = createLogger('[Auth]')
export const networkLogger = createLogger('[Network]')
