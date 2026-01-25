import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

// Helper function to safely access operationsTimesheet model
function getOperationsTimesheet() {
  return (prisma as any).operationsTimesheet as any
}

const createTimesheetSchema = z.object({
  employeeId: z.string().optional(),
  weekStartDate: z.string(),
  weekEndDate: z.string(),
  totalHours: z.number().min(0),
  overtimeHours: z.number().min(0).optional(),
  notes: z.string().optional(),
})

const approveTimesheetSchema = z.object({
  notes: z.string().optional(),
})

// GET - List timesheets
export async function GET(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'READ' },
    async (request, userInfo) => {
      try {
        const { searchParams } = new URL(request.url)
        const employeeId = searchParams.get('employeeId')
        const status = searchParams.get('status')
        const weekStartDate = searchParams.get('weekStartDate')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')
        const skip = (page - 1) * limit

        const where: any = {
          tenantId: userInfo.tenantId,
        }

        if (employeeId) {
          where.employeeId = employeeId
        }
        if (status) {
          where.status = status
        }
        if (weekStartDate) {
          const startDate = new Date(weekStartDate)
          where.weekStartDate = {
            gte: startDate,
            lt: new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000),
          }
        }

        const operationsTimesheet = getOperationsTimesheet()
        if (!operationsTimesheet) {
          return NextResponse.json(
            { error: 'Operations timesheet model not available' },
            { status: 503 }
          )
        }

        const [timesheets, total] = await Promise.all([
          (operationsTimesheet as any).findMany({
            where,
            include: {
              employee: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  department: true,
                },
              },
              approvedBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: {
              weekStartDate: 'desc',
            },
            skip,
            take: limit,
          }),
          (operationsTimesheet as any).count({ where }),
        ])

        // Calculate stats
        const stats = {
          total: await (operationsTimesheet as any).count({
            where: { tenantId: userInfo.tenantId },
          }),
          pending: await (operationsTimesheet as any).count({
            where: {
              tenantId: userInfo.tenantId,
              status: 'SUBMITTED',
            },
          }),
          approved: await (operationsTimesheet as any).count({
            where: {
              tenantId: userInfo.tenantId,
              status: 'APPROVED',
            },
          }),
          draft: await (operationsTimesheet as any).count({
            where: {
              tenantId: userInfo.tenantId,
              status: 'DRAFT',
            },
          }),
        }

        return NextResponse.json({
          timesheets,
          stats,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        })
      } catch (error) {
        console.error('Error fetching timesheets:', error)
        return NextResponse.json(
          { error: 'Failed to fetch timesheets' },
          { status: 500 }
        )
      }
    }
  )
}

// POST - Create/Submit timesheet
export async function POST(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'CREATE' },
    async (request, userInfo) => {
      try {
        const body = await request.json()
        const validatedData = createTimesheetSchema.parse(body)

        const employeeId = validatedData.employeeId || userInfo.userId

        // Check if timesheet already exists for this week
        const operationsTimesheet = getOperationsTimesheet()
        if (!operationsTimesheet) {
          return NextResponse.json(
            { error: 'Operations timesheet model not available' },
            { status: 503 }
          )
        }

        const existing = await (operationsTimesheet as any).findFirst({
          where: {
            employeeId,
            weekStartDate: new Date(validatedData.weekStartDate),
            tenantId: userInfo.tenantId,
          },
        })

        if (existing) {
          // Update existing timesheet
          const updated = await (operationsTimesheet as any).update({
            where: { id: existing.id },
            data: {
              weekEndDate: new Date(validatedData.weekEndDate),
              totalHours: validatedData.totalHours,
              overtimeHours: validatedData.overtimeHours || 0,
              notes: validatedData.notes,
              status: 'SUBMITTED',
            },
            include: {
              employee: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  department: true,
                },
              },
            },
          })
          return NextResponse.json(updated)
        }

        // Create new timesheet
        const timesheet = await (operationsTimesheet as any).create({
          data: {
            employeeId,
            weekStartDate: new Date(validatedData.weekStartDate),
            weekEndDate: new Date(validatedData.weekEndDate),
            totalHours: validatedData.totalHours,
            overtimeHours: validatedData.overtimeHours || 0,
            notes: validatedData.notes,
            status: 'SUBMITTED',
            tenantId: userInfo.tenantId,
          },
          include: {
            employee: {
              select: {
                id: true,
                name: true,
                email: true,
                department: true,
              },
            },
          },
        })

        return NextResponse.json(timesheet, { status: 201 })
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Invalid input', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error creating timesheet:', error)
        return NextResponse.json(
          { error: 'Failed to create timesheet' },
          { status: 500 }
        )
      }
    }
  )
}

