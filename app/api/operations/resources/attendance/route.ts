import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

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

        const [records, total] = await Promise.all([
          prisma.operationsAttendance.findMany({
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
          prisma.operationsAttendance.count({ where }),
        ])

        // Calculate stats
        const todayRecords = records.filter(r => {
          const recordDate = new Date(r.date)
          const today = new Date()
          return recordDate.toDateString() === today.toDateString()
        })

        const stats = {
          total: todayRecords.length,
          present: todayRecords.filter(r => r.status === 'PRESENT').length,
          absent: todayRecords.filter(r => r.status === 'ABSENT').length,
          late: todayRecords.filter(r => r.status === 'LATE').length,
          attendanceRate: todayRecords.length > 0
            ? Number(((todayRecords.filter(r => r.status === 'PRESENT').length / todayRecords.length) * 100).toFixed(1))
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
        const existing = await prisma.operationsAttendance.findFirst({
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
          const updated = await prisma.operationsAttendance.update({
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
        const attendance = await prisma.operationsAttendance.create({
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

