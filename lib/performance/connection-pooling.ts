/**
 * Database Connection Pooling Configuration
 * Optimizes database connection management for better performance
 */

import { PrismaClient } from '@prisma/client'

/**
 * Connection pool configuration for Prisma
 * These settings optimize database connections for production use
 */
export const connectionPoolConfig = {
  // Maximum number of connections in the pool
  maxConnections: 10,
  
  // Minimum number of connections to keep alive
  minConnections: 2,
  
  // Connection timeout in milliseconds
  connectionTimeout: 5000,
  
  // Idle timeout - close connections after being idle
  idleTimeout: 30000, // 30 seconds
}

/**
 * Configure Prisma client with connection pooling
 * This is handled automatically by Prisma, but we document best practices
 */
export function getOptimizedPrismaClient() {
  // Prisma automatically handles connection pooling
  // The DATABASE_URL should include connection pool parameters:
  // postgresql://user:password@host:port/database?connection_limit=10&pool_timeout=5

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
    
    // Datasource configuration is in schema.prisma
    // Connection pooling is handled by the database URL parameters
  })
}

/**
 * Recommended DATABASE_URL format with connection pooling:
 * 
 * For PostgreSQL (Neon, Supabase, etc.):
 * postgresql://user:password@host:port/database?connection_limit=10&pool_timeout=5&connect_timeout=5
 * 
 * Connection URL parameters:
 * - connection_limit: Maximum connections (default: varies by provider)
 * - pool_timeout: Pool timeout in seconds (default: 10)
 * - connect_timeout: Connection timeout in seconds (default: 5)
 * - sslmode: SSL mode (prefer/require for production)
 */

/**
 * Best Practices for Connection Pooling:
 * 
 * 1. **Connection Limit**: Set based on your database provider's limits
 *    - Neon: Up to 100 connections
 *    - Supabase: Up to 200 connections
 *    - Self-hosted: Configure based on server resources
 * 
 * 2. **Pool Size**: 
 *    - Small app: 5-10 connections
 *    - Medium app: 10-20 connections
 *    - Large app: 20-50 connections
 * 
 * 3. **Connection Reuse**: Prisma automatically reuses connections
 *    - Don't create multiple PrismaClient instances
 *    - Use singleton pattern (already implemented)
 * 
 * 4. **Connection Lifecycle**:
 *    - Connections are created on-demand
 *    - Idle connections are kept alive
 *    - Connections are closed when pool is destroyed
 * 
 * 5. **Error Handling**:
 *    - Handle connection errors gracefully
 *    - Implement retry logic for transient failures
 *    - Monitor connection pool health
 */

/**
 * Health check for database connection pool
 */
export async function checkConnectionPoolHealth(prisma: PrismaClient): Promise<{
  healthy: boolean
  latency?: number
  error?: string
}> {
  const start = Date.now()
  
  try {
    await prisma.$queryRaw`SELECT 1`
    const latency = Date.now() - start
    
    return {
      healthy: true,
      latency,
    }
  } catch (error: any) {
    return {
      healthy: false,
      error: error.message,
    }
  }
}

