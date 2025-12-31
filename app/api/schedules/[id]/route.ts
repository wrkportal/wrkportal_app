/**
 * Phase 5.6: Schedule CRUD API
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'
import { calculateNextRun } from '@/lib/scheduling/scheduler'
import { z } from 'zod'

const updateScheduleSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  frequency: z.enum(['ONCE', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM']).optional(),
  cronExpression: z.string().optional(),
  timezone: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  exportFormat: z.enum(['PDF', 'EXCEL', 'CSV', 'JSON', 'PNG', 'HTML']).optional(),
  includeCharts: z.boolean().optional(),
  includeData: z.boolean().optional(),
  pageSize: z.string().optional(),
  orientation: z.string().optional(),
  deliveryChannels: z.array(z.enum(['EMAIL', 'SLACK', 'TEAMS', 'WEBHOOK', 'GOOGLE_DRIVE', 'DROPBOX', 'ONEDRIVE', 'S3'])).optional(),
  recipients: z.array(z.string()).optional(),
  subject: z.string().optional(),
  message: z.string().optional(),
  isActive: z.boolean().optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'COMPLETED', 'FAILED']).optional(),
})

// GET /api/schedules/[id] - Get schedule
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  return withPermissionCheck(
    request,
    { resource: 'reports', action: 'READ' },
    async (req, userInfo) => {
      try {
        const resolvedParams = 'then' in params ? await params : params
        
        if (!prisma.reportSchedule) {
          return NextResponse.json(
            { error: 'Schedule model not available' },
            { status: 500 }
          )
        }

        const schedule = await prisma.reportSchedule.findUnique({
          where: { id: resolvedParams.id },
          include: {
            createdBy: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            deliveries: {
              orderBy: {
                createdAt: 'desc',
              },
              take: 10,
            },
            _count: {
              select: {
                deliveries: true,
              },
            },
          },
        })

        if (!schedule || schedule.tenantId !== userInfo.tenantId) {
          return NextResponse.json(
            { error: 'Schedule not found' },
            { status: 404 }
          )
        }

        return NextResponse.json({ schedule })
      } catch (error: any) {
        console.error('Error fetching schedule:', error)
        return NextResponse.json(
          { error: 'Failed to fetch schedule', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

// PATCH /api/schedules/[id] - Update schedule
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  return withPermissionCheck(
    request,
    { resource: 'reports', action: 'UPDATE' },
    async (req, userInfo) => {
      try {
        const resolvedParams = 'then' in params ? await params : params
        
        if (!prisma.reportSchedule) {
          return NextResponse.json(
            { error: 'Schedule model not available' },
            { status: 500 }
          )
        }

        const schedule = await prisma.reportSchedule.findUnique({
          where: { id: resolvedParams.id },
        })

        if (!schedule || schedule.tenantId !== userInfo.tenantId) {
          return NextResponse.json(
            { error: 'Schedule not found' },
            { status: 404 }
          )
        }

        const body = await req.json()
        const data = updateScheduleSchema.parse(body)

        // Recalculate next run if frequency changed
        let updateData: any = {
          ...data,
          updatedById: userInfo.userId,
        }

        if (data.frequency || data.cronExpression) {
          const nextRun = calculateNextRun(
            (data.frequency || schedule.frequency) as any,
            data.cronExpression || schedule.cronExpression || null,
            schedule.lastRunAt,
            data.timezone || schedule.timezone
          )

          if (nextRun.isValid) {
            updateData.nextRunAt = nextRun.nextRunAt
          }
        }

        if (data.startDate !== undefined) {
          updateData.startDate = data.startDate ? new Date(data.startDate) : null
        }
        if (data.endDate !== undefined) {
          updateData.endDate = data.endDate ? new Date(data.endDate) : null
        }

        const updated = await prisma.reportSchedule.update({
          where: { id: resolvedParams.id },
          data: updateData,
          include: {
            createdBy: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        })

        return NextResponse.json({ schedule: updated })
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Validation error', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error updating schedule:', error)
        return NextResponse.json(
          { error: 'Failed to update schedule', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

// DELETE /api/schedules/[id] - Delete schedule
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  return withPermissionCheck(
    request,
    { resource: 'reports', action: 'DELETE' },
    async (req, userInfo) => {
      try {
        const resolvedParams = 'then' in params ? await params : params
        
        if (!prisma.reportSchedule) {
          return NextResponse.json(
            { error: 'Schedule model not available' },
            { status: 500 }
          )
        }

        const schedule = await prisma.reportSchedule.findUnique({
          where: { id: resolvedParams.id },
        })

        if (!schedule || schedule.tenantId !== userInfo.tenantId) {
          return NextResponse.json(
            { error: 'Schedule not found' },
            { status: 404 }
          )
        }

        await prisma.reportSchedule.delete({
          where: { id: resolvedParams.id },
        })

        return NextResponse.json({ success: true })
      } catch (error: any) {
        console.error('Error deleting schedule:', error)
        return NextResponse.json(
          { error: 'Failed to delete schedule', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

