/**
 * Phase 5.6: Schedule Management API
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'
import { calculateNextRun } from '@/lib/scheduling/scheduler'
import { z } from 'zod'
import { parsePaginationParams, createPaginatedResponse } from '@/lib/performance/pagination'
import { getOrSet, cacheKeys, cacheTTL } from '@/lib/performance/cache'
import { measureQuery } from '@/lib/performance/monitoring'

const getReportSchedule = () => (prisma as any).reportSchedule

const createScheduleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  resourceType: z.string(),
  resourceId: z.string(),
  frequency: z.enum(['ONCE', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM']),
  cronExpression: z.string().optional(),
  timezone: z.string().default('UTC'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  exportFormat: z.enum(['PDF', 'EXCEL', 'CSV', 'JSON', 'PNG', 'HTML']).default('PDF'),
  includeCharts: z.boolean().default(true),
  includeData: z.boolean().default(true),
  pageSize: z.string().optional(),
  orientation: z.string().optional(),
  deliveryChannels: z.array(z.enum(['EMAIL', 'SLACK', 'TEAMS', 'WEBHOOK', 'GOOGLE_DRIVE', 'DROPBOX', 'ONEDRIVE', 'S3'])),
  recipients: z.array(z.string()),
  subject: z.string().optional(),
  message: z.string().optional(),
  attachFile: z.boolean().default(true),
  storageBucket: z.string().optional(),
  storagePath: z.string().optional(),
  webhookUrl: z.string().optional(),
  webhookHeaders: z.record(z.string()).optional(),
  webhookMethod: z.string().optional(),
})

// GET /api/schedules - List schedules
export async function GET(request: NextRequest) {
  return withPermissionCheck(
    request,
    { resource: 'reports', action: 'READ' },
    async (req, userInfo) => {
      try {
        const reportSchedule = getReportSchedule()
        if (!reportSchedule) {
          return NextResponse.json({ schedules: [] })
        }

        const { searchParams } = new URL(req.url)
        const resourceType = searchParams.get('resourceType')
        const resourceId = searchParams.get('resourceId')
        const status = searchParams.get('status')
        
        // Parse pagination params
        const pagination = parsePaginationParams(searchParams)

        const where: any = {
          tenantId: userInfo.tenantId,
          ...(resourceType ? { resourceType } : {}),
          ...(resourceId ? { resourceId } : {}),
          ...(status ? { status } : {}),
        }

        // Create cache key
        const cacheKey = cacheKeys.schedules(userInfo.tenantId) + `:${JSON.stringify(where)}:${pagination.page}:${pagination.limit}`

        // Use cached data if available, otherwise fetch from database
        const result = await getOrSet(
          cacheKey,
          async () => {
            // Get total count
            const total = await measureQuery('schedules.count', () =>
              reportSchedule.count({ where })
            )

            // Get paginated schedules
            const schedules = await measureQuery('schedules.findMany', () =>
              reportSchedule.findMany({
                where,
                skip: pagination.offset,
                take: pagination.limit,
                select: {
                  id: true,
                  name: true,
                  description: true,
                  resourceType: true,
                  resourceId: true,
                  frequency: true,
                  status: true,
                  isActive: true,
                  nextRunAt: true,
                  lastRunAt: true,
                  runCount: true,
                  successCount: true,
                  failureCount: true,
                  createdAt: true,
                  createdBy: {
                    select: {
                      id: true,
                      email: true,
                      firstName: true,
                      lastName: true,
                    },
                  },
                  _count: {
                    select: {
                      deliveries: true,
                    },
                  },
                },
                orderBy: {
                  createdAt: 'desc',
                },
              })
            )

            return createPaginatedResponse(schedules as any[], total as number, pagination)
          },
          cacheTTL.short // Cache for 1 minute
        )

        return NextResponse.json(result)
      } catch (error: any) {
        console.error('Error fetching schedules:', error)
        return NextResponse.json(
          { error: 'Failed to fetch schedules', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

// POST /api/schedules - Create schedule
export async function POST(request: NextRequest) {
  return withPermissionCheck(
    request,
    { resource: 'reports', action: 'CREATE' },
    async (req, userInfo) => {
      try {
        const reportSchedule = getReportSchedule()
        if (!reportSchedule) {
          return NextResponse.json(
            { error: 'Schedule model not available' },
            { status: 500 }
          )
        }

        const body = await req.json()
        const data = createScheduleSchema.parse(body)

        // Calculate next run
        const nextRun = calculateNextRun(
          data.frequency,
          data.cronExpression || null,
          null,
          data.timezone
        )

        if (!nextRun.isValid) {
          return NextResponse.json(
            { error: nextRun.error || 'Invalid schedule configuration' },
            { status: 400 }
          )
        }

        const schedule = await reportSchedule.create({
          data: {
            tenantId: userInfo.tenantId,
            name: data.name,
            description: data.description,
            resourceType: data.resourceType,
            resourceId: data.resourceId,
            frequency: data.frequency,
            cronExpression: data.cronExpression,
            timezone: data.timezone,
            startDate: data.startDate ? new Date(data.startDate) : null,
            endDate: data.endDate ? new Date(data.endDate) : null,
            nextRunAt: nextRun.nextRunAt,
            exportFormat: data.exportFormat,
            includeCharts: data.includeCharts,
            includeData: data.includeData,
            pageSize: data.pageSize,
            orientation: data.orientation,
            deliveryChannels: data.deliveryChannels,
            recipients: data.recipients,
            subject: data.subject,
            message: data.message,
            attachFile: data.attachFile,
            storageBucket: data.storageBucket,
            storagePath: data.storagePath,
            webhookUrl: data.webhookUrl,
            webhookHeaders: data.webhookHeaders || {},
            webhookMethod: data.webhookMethod || 'POST',
            createdById: userInfo.userId,
          },
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

        return NextResponse.json({ schedule }, { status: 201 })
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Validation error', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error creating schedule:', error)
        return NextResponse.json(
          { error: 'Failed to create schedule', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

