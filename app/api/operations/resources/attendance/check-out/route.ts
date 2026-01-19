import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

const checkOutSchema = z.object({
  employeeId: z.string().optional(),
  checkOut: z.string().optional(), // ISO date string
})

// POST - Check out
export async function POST(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'UPDATE' },
    async (request, userInfo) => {
      try {
        const body = await request.json()
        const validatedData = checkOutSchema.parse(body)
        
        const employeeId = validatedData.employeeId || userInfo.userId
        const checkOutTime = validatedData.checkOut ? new Date(validatedData.checkOut) : new Date()
        const today = new Date(checkOutTime)
        today.setHours(0, 0, 0, 0)

        // Find today's attendance record
        const attendance = await prisma.operationsAttendance.findFirst({
          where: {
            employeeId,
            tenantId: userInfo.tenantId,
            date: {
              gte: today,
              lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
            },
          },
        })

        if (!attendance) {
          return NextResponse.json(
            { error: 'No check-in record found for today' },
            { status: 404 }
          )
        }

        // Calculate hours worked
        let hoursWorked = 0
        if (attendance.checkIn) {
          hoursWorked = (checkOutTime.getTime() - attendance.checkIn.getTime()) / (1000 * 60 * 60)
        }

        // Update record
        const updated = await prisma.operationsAttendance.update({
          where: { id: attendance.id },
          data: {
            checkOut: checkOutTime,
            hoursWorked: hoursWorked,
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
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Invalid input', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error checking out:', error)
        return NextResponse.json(
          { error: 'Failed to check out' },
          { status: 500 }
        )
      }
    }
  )
}

