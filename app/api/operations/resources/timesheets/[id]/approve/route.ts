import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

const approveTimesheetSchema = z.object({
  notes: z.string().optional(),
})

// POST - Approve timesheet
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'UPDATE' },
    async (request, userInfo) => {
      try {
        const body = await request.json()
        const validatedData = approveTimesheetSchema.parse(body)

        const timesheet = await prisma.operationsTimesheet.findFirst({
          where: {
            id: params.id,
            tenantId: userInfo.tenantId,
          },
        })

        if (!timesheet) {
          return NextResponse.json(
            { error: 'Timesheet not found' },
            { status: 404 }
          )
        }

        if (timesheet.status === 'APPROVED') {
          return NextResponse.json(
            { error: 'Timesheet already approved' },
            { status: 400 }
          )
        }

        const updated = await prisma.operationsTimesheet.update({
          where: { id: params.id },
          data: {
            status: 'APPROVED',
            approvedById: userInfo.userId,
            approvedAt: new Date(),
            notes: validatedData.notes
              ? `${timesheet.notes || ''}\n${validatedData.notes}`.trim()
              : timesheet.notes,
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
            approvedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        })

        return NextResponse.json(updated)
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Invalid input', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error approving timesheet:', error)
        return NextResponse.json(
          { error: 'Failed to approve timesheet' },
          { status: 500 }
        )
      }
    }
  )
}

