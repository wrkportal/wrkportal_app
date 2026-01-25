import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

// Helper function to safely access operationsAttendance model
function getOperationsAttendance() {
  return (prisma as any).operationsAttendance as any
}

type AttendanceRecord = {
  id: string
  date: Date
  status: string
  checkIn?: Date | null
}

const checkInSchema = z.object({
  employeeId: z.string().optional(),
  checkIn: z.string().optional(), // ISO date string
})

// GET - Get attendance records
export async function GET(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'READ' },
    async (request, userInfo) => {
      try {
        const { searchParams } = new URL(request.url)
        const date = searchParams.get('date')
        const employeeId = searchParams.get('employeeId')
        const status = searchParams.get('status')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')
        const skip = (page - 1) * limit

        const where: any = {
          tenantId: userInfo.tenantId,
        }

        if (date) {
          const dateObj = new Date(date)
          where.date = {
            gte: new Date(dateObj.setHours(0, 0, 0, 0)),
            lt: new Date(dateObj.setHours(23, 59, 59, 999)),
          }
        } else {
          // Default to today
          const today = new Date()
          where.date = {
            gte: new Date(today.setHours(0, 0, 0, 0)),
            lt: new Date(today.setHours(23, 59, 59, 999)),
          }
        }

        if (employeeId) {
          where.employeeId = employeeId
        }
        if (status) {
          where.status = status
        }

        const operationsAttendance = getOperationsAttendance()
        if (!operationsAttendance) {
          return NextResponse.json(
            { error: 'Operations attendance model not available' },
            { status: 503 }
          )
        }

        const [records, total] = await Promise.all([
          (operationsAttendance as any).findMany({
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
            },
            orderBy: {
              date: 'desc',
            },
            skip,
            take: limit,
          }),
          (operationsAttendance as any).count({ where }),
        ])

        // Calculate stats
        const todayRecords = (records as AttendanceRecord[]).filter((r: AttendanceRecord) => {
          const recordDate = new Date(r.date)
          const today = new Date()
          return recordDate.toDateString() === today.toDateString()
        })

        const stats = {
          total: todayRecords.length,
          present: todayRecords.filter((r: AttendanceRecord) => r.status === 'PRESENT').length,
          absent: todayRecords.filter((r: AttendanceRecord) => r.status === 'ABSENT').length,
          late: todayRecords.filter((r: AttendanceRecord) => r.status === 'LATE').length,
          attendanceRate: todayRecords.length > 0
            ? Number(((todayRecords.filter((r: AttendanceRecord) => r.status === 'PRESENT').length / todayRecords.length) * 100).toFixed(1))
            : 0,
        }

        return NextResponse.json({
          records,
          stats,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        })
      } catch (error) {
        console.error('Error fetching attendance:', error)
        return NextResponse.json(
          { error: 'Failed to fetch attendance records' },
          { status: 500 }
        )
      }
    }
  )
}

// POST - Check in
export async function POST(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'CREATE' },
    async (request, userInfo) => {
      try {
        const body = await request.json()
        const validatedData = checkInSchema.parse(body)
        
        const employeeId = validatedData.employeeId || userInfo.userId
        const checkInTime = validatedData.checkIn ? new Date(validatedData.checkIn) : new Date()
        const today = new Date(checkInTime)
        today.setHours(0, 0, 0, 0)

        // Check if attendance record already exists
        const operationsAttendance = getOperationsAttendance()
        if (!operationsAttendance) {
          return NextResponse.json(
            { error: 'Operations attendance model not available' },
            { status: 503 }
          )
        }

        const existing = await (operationsAttendance as any).findFirst({
          where: {
            employeeId,
            tenantId: userInfo.tenantId,
            date: {
              gte: today,
              lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
            },
          },
        })

        if (existing) {
          // Update existing record
          const updated = await (operationsAttendance as any).update({
            where: { id: existing.id },
            data: {
              checkIn: checkInTime,
              status: 'PRESENT',
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

        // Create new record
        const attendance = await (operationsAttendance as any).create({
          data: {
            employeeId,
            date: today,
            checkIn: checkInTime,
            status: 'PRESENT',
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

        return NextResponse.json(attendance, { status: 201 })
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Invalid input', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error checking in:', error)
        return NextResponse.json(
          { error: 'Failed to check in' },
          { status: 500 }
        )
      }
    }
  )
}

