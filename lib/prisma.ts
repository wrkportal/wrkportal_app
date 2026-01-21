import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
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
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Prisma 7+ requires adapter for direct database connection
    adapter: adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['error', 'warn']
        : ['error'],
    // Connection pooling is handled automatically by Prisma via DATABASE_URL
    // Ensure your DATABASE_URL includes pool parameters for optimal performance
  })

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
