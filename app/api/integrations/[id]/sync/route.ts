/**
 * Phase 5: Integration Sync API
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'
import { createSyncJob, executeSyncJob, getSyncJobHistory, getSyncLogs, SyncConfiguration } from '@/lib/integrations/sync-framework'
import { SyncType } from '@prisma/client'

const createSyncJobSchema = z.object({
  syncType: z.nativeEnum(SyncType),
  configuration: z.object({
    resourceType: z.string(),
    direction: z.enum(['pull', 'push', 'bidirectional']),
    fields: z.array(z.string()).optional(),
    filters: z.record(z.any()).optional(),
    schedule: z.string().optional(),
  }),
})

// POST /api/integrations/[id]/sync - Trigger sync
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermissionCheck(
    request,
    { resource: 'integrations', action: 'UPDATE' },
    async (req, userInfo) => {
      try {
        const body = await request.json()
        const data = createSyncJobSchema.parse(body)

        const integration = await prisma.integration.findFirst({
          where: {
            id: params.id,
            tenantId: userInfo.tenantId,
          },
        })

        if (!integration) {
          return NextResponse.json(
            { error: 'Integration not found' },
            { status: 404 }
          )
        }

        if (!integration.isActive) {
          return NextResponse.json(
            { error: 'Integration is not active' },
            { status: 400 }
          )
        }

        // Create sync job
        const job = await createSyncJob(
          params.id,
          userInfo.tenantId,
          data.syncType,
          data.configuration
        )

        // Execute sync in background (in production, use a queue)
        executeSyncJob(job.id).catch(error => {
          console.error('Sync job failed:', error)
        })

        return NextResponse.json({ job }, { status: 201 })
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Validation error', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error triggering sync:', error)
        return NextResponse.json(
          { error: 'Failed to trigger sync', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

// GET /api/integrations/[id]/sync - Get sync history
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermissionCheck(
    request,
    { resource: 'integrations', action: 'READ' },
    async (req, userInfo) => {
      try {
        const { searchParams } = new URL(req.url)
        const limit = parseInt(searchParams.get('limit') || '50')
        const logs = searchParams.get('logs') === 'true'

        const integration = await prisma.integration.findFirst({
          where: {
            id: params.id,
            tenantId: userInfo.tenantId,
          },
        })

        if (!integration) {
          return NextResponse.json(
            { error: 'Integration not found' },
            { status: 404 }
          )
        }

        const jobs = await getSyncJobHistory(params.id, limit)

        let syncLogs = []
        if (logs) {
          syncLogs = await getSyncLogs(params.id, undefined, undefined, 100)
        }

        return NextResponse.json({
          jobs,
          logs: syncLogs,
        })
      } catch (error: any) {
        console.error('Error fetching sync history:', error)
        return NextResponse.json(
          { error: 'Failed to fetch sync history', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

