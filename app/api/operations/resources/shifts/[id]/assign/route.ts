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

const assignShiftSchema = z.object({
  employeeId: z.string().min(1),
  startDate: z.string(),
  endDate: z.string().optional(),
})

// POST - Assign employee to shift
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'CREATE' },
    async (request, userInfo) => {
      try {
        const body = await request.json()
        const validatedData = assignShiftSchema.parse(body)

        const operationsShift = getOperationsShift()
        const operationsShiftAssignment = getOperationsShiftAssignment()
        if (!operationsShift || !operationsShiftAssignment) {
          return NextResponse.json(
            { error: 'Operations shift models not available' },
            { status: 503 }
          )
        }

        // Verify shift exists
        const shift = await operationsShift.findFirst({
          where: {
            id: params.id,
            tenantId: userInfo.tenantId,
          },
        })

        if (!shift) {
          return NextResponse.json(
            { error: 'Shift not found' },
            { status: 404 }
          )
        }

        // Verify employee exists
        const employee = await prisma.user.findFirst({
          where: {
            id: validatedData.employeeId,
            tenantId: userInfo.tenantId,
          },
        })

        if (!employee) {
          return NextResponse.json(
            { error: 'Employee not found' },
            { status: 404 }
          )
        }

        // Check for overlapping assignments
        const existing = await operationsShiftAssignment.findFirst({
          where: {
            employeeId: validatedData.employeeId,
            tenantId: userInfo.tenantId,
            endDate: null, // Active assignment
            shiftId: {
              not: params.id, // Different shift
            },
          },
        })

        if (existing) {
          return NextResponse.json(
            { error: 'Employee already assigned to another active shift' },
            { status: 400 }
          )
        }

        // End any existing assignment to this shift
        await operationsShiftAssignment.updateMany({
          where: {
            employeeId: validatedData.employeeId,
            shiftId: params.id,
            tenantId: userInfo.tenantId,
            endDate: null,
          },
          data: {
            endDate: new Date(validatedData.startDate),
          },
        })

        const assignment = await operationsShiftAssignment.create({
          data: {
            shiftId: params.id,
            employeeId: validatedData.employeeId,
            startDate: new Date(validatedData.startDate),
            endDate: validatedData.endDate
              ? new Date(validatedData.endDate)
              : null,
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
            shift: true,
          },
        })

        return NextResponse.json(assignment, { status: 201 })
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Invalid input', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error assigning shift:', error)
        return NextResponse.json(
          { error: 'Failed to assign shift' },
          { status: 500 }
        )
      }
    }
  )
}
