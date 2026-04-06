/**
 * Database Connection Pooling Configuration
 *
 * Connection pooling for AWS Aurora Serverless v2 is handled at two levels:
 * 1. AWS RDS Proxy (recommended in production) — manages connection reuse across ECS tasks
 * 2. Prisma Client — internal pool with sensible defaults
 *
 * DATABASE_URL format via RDS Proxy:
 * postgresql://user:password@wrkportal-proxy.proxy-xxx.us-east-1.rds.amazonaws.com:5432/wrkportal?schema=public
 */

import { prisma } from '@/lib/prisma'

/**
 * Health check — verifies database connectivity
 */
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean
  latencyMs: number
  error?: string
}> {
  const start = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    return { healthy: true, latencyMs: Date.now() - start }
  } catch (error: any) {
    return { healthy: false, latencyMs: Date.now() - start, error: error.message }
  }
}
