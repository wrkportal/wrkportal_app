/**
 * Structured Logger — Pino
 *
 * JSON structured logging for CloudWatch Logs.
 * ECS awslogs driver ships these to CloudWatch automatically.
 *
 * Usage:
 *   import { logger } from '@/lib/logger'
 *   logger.info({ userId, action: 'login' }, 'User logged in')
 *   logger.error({ err, requestId }, 'Database query failed')
 */

import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  // In production, output JSON for CloudWatch parsing
  // In dev, use pretty-print (if pino-pretty is installed)
  ...(process.env.NODE_ENV !== 'production' && {
    transport: {
      target: 'pino/file',
      options: { destination: 1 }, // stdout
    },
  }),
  base: {
    service: 'wrkportal',
    env: process.env.NODE_ENV || 'development',
  },
  // Redact sensitive fields from logs
  redact: {
    paths: [
      'password',
      'token',
      'secret',
      'authorization',
      'cookie',
      'req.headers.authorization',
      'req.headers.cookie',
    ],
    censor: '[REDACTED]',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
})

/**
 * Create a child logger with request context
 */
export function createRequestLogger(requestId: string, userId?: string, tenantId?: string) {
  return logger.child({
    requestId,
    ...(userId && { userId }),
    ...(tenantId && { tenantId }),
  })
}
