import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: Pool | undefined
  adapter: PrismaPg | undefined
}

/**
 * Prisma Client with optimized configuration
 * 
 * Connection pooling is configured via DATABASE_URL parameters:
 * - connection_limit: Maximum connections in pool (recommended: 10-20)
 * - pool_timeout: Pool timeout in seconds (default: 10)
 * - connect_timeout: Connection timeout in seconds (default: 5)
 * 
 * Example DATABASE_URL:
 * postgresql://user:password@host:port/database?connection_limit=10&pool_timeout=5
 */
function getPrismaClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  // Reuse pool and adapter across requests in serverless environment
  if (!globalForPrisma.pool) {
    globalForPrisma.pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      // Optimize for serverless - use connection pooling from DATABASE_URL
      // Don't set max here, let the connection string parameters handle it
    })
  }

  if (!globalForPrisma.adapter) {
    globalForPrisma.adapter = new PrismaPg(globalForPrisma.pool)
  }

  if (!globalForPrisma.prisma) {
    // Prisma 7+ requires adapter for direct database connection
    // Type assertion needed: Prisma 7.2.0 type definitions don't include adapter property
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prismaOptions: any = {
      adapter: globalForPrisma.adapter,
      // Suppress Prisma error logs since we handle them gracefully in our code
      // Set PRISMA_LOG_ERRORS=true in .env.local if you want to see Prisma errors
      log:
        process.env.NODE_ENV === 'development'
          ? process.env.PRISMA_LOG_ERRORS === 'true' ? ['error', 'warn'] : []
          : ['error'],
    }
    globalForPrisma.prisma = new PrismaClient(prismaOptions)
  }

  return globalForPrisma.prisma
}

const missingDatabaseUrlError = new Error('DATABASE_URL environment variable is not set')

export const prisma =
  process.env.DATABASE_URL
    ? getPrismaClient()
    // Defer the error until a DB call is attempted (avoids build-time crash).
    : (new Proxy(
        {},
        {
          get() {
            throw missingDatabaseUrlError
          },
        }
      ) as PrismaClient)

// Handle connection errors gracefully with retry logic
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
  
  // Disconnect on process termination
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
  
  process.on('SIGINT', async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
  
  process.on('SIGTERM', async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
}

// Helper function to handle database operations with connection retry
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
        error?.message?.includes('Can\'t reach database') ||
        error?.code === 'P1001' ||
        error?.code === 'P1017'
      
      if (isConnectionError && i < retries - 1) {
        console.warn(`Database connection error (attempt ${i + 1}/${retries}), retrying...`)
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
        // Try to reconnect
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
