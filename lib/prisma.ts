import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Prisma Client — connects to AWS Aurora Serverless v2 PostgreSQL.
 *
 * Connection pooling is handled by AWS RDS Proxy in production.
 * DATABASE_URL is injected via ECS Task Definition from SSM Parameter Store.
 */
function getPrismaClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  return new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? process.env.PRISMA_LOG_ERRORS === 'true'
          ? ['error', 'warn']
          : []
        : ['error'],
    datasourceUrl: process.env.DATABASE_URL,
  })
}

const missingDatabaseUrlError = new Error('DATABASE_URL environment variable is not set')

export const prisma =
  process.env.DATABASE_URL
    ? (globalForPrisma.prisma ??= getPrismaClient())
    : (new Proxy(
        {},
        {
          get() {
            throw missingDatabaseUrlError
          },
        }
      ) as PrismaClient)

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Graceful shutdown
const shutdown = async () => {
  await prisma.$disconnect()
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

/**
 * Execute a database operation with connection retry and exponential backoff.
 * Handles transient Aurora connection issues (cold starts, failovers).
 */
export async function withDatabaseRetry<T>(
  operation: () => Promise<T>,
  retries = 3
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await operation()
    } catch (error: any) {
      const isConnectionError =
        error?.message?.includes('Closed') ||
        error?.message?.includes("Can't reach database") ||
        error?.code === 'P1001' ||
        error?.code === 'P1017'

      if (isConnectionError && i < retries - 1) {
        console.warn(`Database connection error (attempt ${i + 1}/${retries}), retrying...`)
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, i)))
        try {
          await prisma.$connect()
        } catch {
          // Ignore reconnect errors, will retry operation
        }
        continue
      }
      throw error
    }
  }
  throw new Error('Database operation failed after retries')
}
