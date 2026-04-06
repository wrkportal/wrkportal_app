import { NextResponse } from 'next/server'
import { checkDatabaseHealth } from '@/lib/performance/connection-pooling'
import { checkRedisHealth } from '@/lib/aws/redis'

/**
 * GET /api/health
 *
 * Health check endpoint used by:
 * - ECS task health checks
 * - ALB target group health checks
 * - CloudWatch synthetic monitoring
 */
export async function GET() {
  const start = Date.now()

  const [db, cache] = await Promise.allSettled([
    checkDatabaseHealth(),
    checkRedisHealth(),
  ])

  const dbResult = db.status === 'fulfilled' ? db.value : { healthy: false, latencyMs: 0, error: 'Check failed' }
  const cacheResult = cache.status === 'fulfilled' ? cache.value : { healthy: false, latencyMs: 0, error: 'Check failed' }

  const healthy = dbResult.healthy && cacheResult.healthy
  const status = healthy ? 200 : 503

  return NextResponse.json(
    {
      status: healthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      totalLatencyMs: Date.now() - start,
      services: {
        database: {
          status: dbResult.healthy ? 'up' : 'down',
          latencyMs: dbResult.latencyMs,
          error: dbResult.error,
        },
        cache: {
          status: cacheResult.healthy ? 'up' : 'down',
          latencyMs: cacheResult.latencyMs,
          error: cacheResult.error,
        },
      },
    },
    { status }
  )
}
