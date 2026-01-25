import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

// Helper function to safely access operationsShift model
function getOperationsShift() {
  return (prisma as any).operationsShift as any
}

// Helper function to safely access operationsShiftAssignment model
function getOperationsShiftAssignment() {
  return (prisma as any).operationsShiftAssignment as any
}

const createShiftSchema = z.object({
  name: z.string().min(1),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/), // HH:mm format
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/), // HH:mm format
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
})

const assignShiftSchema = z.object({
  employeeId: z.string().min(1),
  startDate: z.string(),
  endDate: z.string().optional(),
})

// GET - List shifts
export async function GET(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'READ' },
    async (request, userInfo) => {
      try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const includeAssignments = searchParams.get('includeAssignments') === 'true'

        const where: any = {
          tenantId: userInfo.tenantId,
        }

        if (status) {
          where.status = status
        }

        const operationsShift = getOperationsShift()
        const operationsShiftAssignment = getOperationsShiftAssignment()
        if (!operationsShift || !operationsShiftAssignment) {
          return NextResponse.json(
            { error: 'Operations shift models not available' },
            { status: 503 }
          )
        }

        const shifts = await (operationsShift as any).findMany({
          where,
          include: {
            shiftAssignments: includeAssignments ? {
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
              where: {
                endDate: null, // Only active assignments
              },
            } : false,
          },
          orderBy: {
            startTime: 'asc',
          },
        })

        // Calculate stats
        const stats = {
          total: shifts.length,
          active: shifts.filter((s: any) => s.status === 'ACTIVE').length,
          totalEmployees: await (operationsShiftAssignment as any).count({
            where: {
              tenantId: userInfo.tenantId,
              endDate: null,
            },
          }),
        }

        const shiftsWithEmployees = await Promise.all(
          shifts.map(async (shift: any) => ({
            ...shift,
            employees: includeAssignments && shift.shiftAssignments
              ? shift.shiftAssignments.length
              : await (operationsShiftAssignment as any).count({
                  where: {
                    shiftId: shift.id,
                    tenantId: userInfo.tenantId,
                    endDate: null,
                  },
                }),
          }))
        )

        return NextResponse.json({
          shifts: shiftsWithEmployees,
          stats,
        })
      } catch (error) {
        console.error('Error fetching shifts:', error)
        return NextResponse.json(
          { error: 'Failed to fetch shifts' },
          { status: 500 }
        )
      }
    }
  )
}

// POST - Create shift
export async function POST(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'CREATE' },
    async (request, userInfo) => {
      try {
        const body = await request.json()
        const validatedData = createShiftSchema.parse(body)

        const operationsShift = getOperationsShift()
        if (!operationsShift) {
          return NextResponse.json(
            { error: 'Operations shift model not available' },
            { status: 503 }
          )
        }

        const shift = await (operationsShift as any).create({
          data: {
            name: validatedData.name,
            startTime: validatedData.startTime,
            endTime: validatedData.endTime,
            status: validatedData.status || 'ACTIVE',
            tenantId: userInfo.tenantId,
          },
        })

        return NextResponse.json(shift, { status: 201 })
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Invalid input', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error creating shift:', error)
        return NextResponse.json(
          { error: 'Failed to create shift' },
          { status: 500 }
        )
      }
    }
  )
}

