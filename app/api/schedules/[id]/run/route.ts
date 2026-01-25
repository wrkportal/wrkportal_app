/**
 * Phase 5.6: Manual Schedule Execution
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'
import { generateExport } from '@/lib/export/export-engine'
import { deliverReport } from '@/lib/delivery/delivery-engine'
import { updateScheduleAfterRun } from '@/lib/scheduling/scheduler'

// POST /api/schedules/[id]/run - Manually trigger schedule
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  return withPermissionCheck(
    request,
    { resource: 'reports', action: 'UPDATE' },
    async (req, userInfo) => {
      try {
        const resolvedParams = 'then' in params ? await params : params
        
        const reportSchedule = (prisma as any).reportSchedule
        if (!reportSchedule) {
          return NextResponse.json(
            { error: 'Schedule model not available' },
            { status: 500 }
          )
        }

        const schedule = await reportSchedule.findUnique({
          where: { id: resolvedParams.id },
        })

        if (!schedule || schedule.tenantId !== userInfo.tenantId) {
          return NextResponse.json(
            { error: 'Schedule not found' },
            { status: 404 }
          )
        }

        // Generate export
        const exportResult = await generateExport(
          schedule.resourceType,
          schedule.resourceId,
          {
            format: schedule.exportFormat,
            includeCharts: schedule.includeCharts,
            includeData: schedule.includeData,
            pageSize: schedule.pageSize || undefined,
            orientation: schedule.orientation as 'portrait' | 'landscape' | undefined,
          }
        )

        // Deliver through all channels
        const deliveryResults = []
        for (const channel of schedule.deliveryChannels) {
          for (const recipient of schedule.recipients) {
            const result = await deliverReport(schedule.id, schedule.tenantId, {
              channel,
              recipient,
              subject: schedule.subject || undefined,
              message: schedule.message || undefined,
              fileUrl: exportResult.fileUrl,
              fileName: exportResult.fileName,
              mimeType: exportResult.mimeType,
              webhookUrl: schedule.webhookUrl || undefined,
              webhookHeaders: schedule.webhookHeaders as Record<string, string> | undefined,
              webhookMethod: schedule.webhookMethod || undefined,
            })
            deliveryResults.push(result)
          }
        }

        const allSuccessful = deliveryResults.every(r => r.success)

        // Update schedule
        await updateScheduleAfterRun(schedule.id, allSuccessful)

        return NextResponse.json({
          success: allSuccessful,
          export: exportResult,
          deliveries: deliveryResults,
        })
      } catch (error: any) {
        console.error('Error running schedule:', error)
        return NextResponse.json(
          { error: 'Failed to run schedule', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

