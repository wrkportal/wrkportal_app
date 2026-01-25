import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

// Helper function to safely access operationsNewHire model
function getOperationsNewHire() {
  return (prisma as any).operationsNewHire as any
}

const createNewHireSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  department: z.string().min(1),
  joinDate: z.string(),
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED']).optional(),
  offerAccepted: z.boolean().optional(),
})

// GET - List new hires
export async function GET(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'READ' },
    async (request, userInfo) => {
      try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const department = searchParams.get('department')
        const upcoming = searchParams.get('upcoming') === 'true'
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')
        const skip = (page - 1) * limit

        const where: any = {
          tenantId: userInfo.tenantId,
        }

        if (status) {
          where.status = status
        }
        if (department) {
          where.department = department
        }
        if (upcoming) {
          where.joinDate = {
            gte: new Date(),
          }
        }

        const operationsNewHire = getOperationsNewHire()
        if (!operationsNewHire) {
          return NextResponse.json(
            { error: 'Operations new hire model not available' },
            { status: 503 }
          )
        }

        const [newHires, total] = await Promise.all([
          (operationsNewHire as any).findMany({
            where,
            include: {
              operationsOnboarding: {
                select: {
                  id: true,
                  status: true,
                  progress: true,
                  startDate: true,
                },
              },
            },
            orderBy: {
              joinDate: 'asc',
            },
            skip,
            take: limit,
          }),
          (operationsNewHire as any).count({ where }),
        ])

        // Calculate stats
        const thisMonth = new Date()
        thisMonth.setDate(1)
        thisMonth.setHours(0, 0, 0, 0)

        const stats = {
          total: await (operationsNewHire as any).count({
            where: { tenantId: userInfo.tenantId },
          }),
          thisMonth: await (operationsNewHire as any).count({
            where: {
              tenantId: userInfo.tenantId,
              joinDate: {
                gte: thisMonth,
              },
            },
          }),
          pending: await (operationsNewHire as any).count({
            where: {
              tenantId: userInfo.tenantId,
              status: 'PENDING',
            },
          }),
          confirmed: await (operationsNewHire as any).count({
            where: {
              tenantId: userInfo.tenantId,
              status: 'CONFIRMED',
            },
          }),
          offerAccepted: await (operationsNewHire as any).count({
            where: {
              tenantId: userInfo.tenantId,
              offerAccepted: true,
            },
          }),
        }

        return NextResponse.json({
          newHires,
          stats,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        })
      } catch (error) {
        console.error('Error fetching new hires:', error)
        return NextResponse.json(
          { error: 'Failed to fetch new hires' },
          { status: 500 }
        )
      }
    }
  )
}

// POST - Create new hire
export async function POST(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'CREATE' },
    async (request, userInfo) => {
      try {
        const body = await request.json()
        const validatedData = createNewHireSchema.parse(body)

        const operationsNewHire = getOperationsNewHire()
        if (!operationsNewHire) {
          return NextResponse.json(
            { error: 'Operations new hire model not available' },
            { status: 503 }
          )
        }

        const newHire = await (operationsNewHire as any).create({
          data: {
            name: validatedData.name,
            email: validatedData.email,
            department: validatedData.department,
            joinDate: new Date(validatedData.joinDate),
            status: validatedData.status || 'PENDING',
            offerAccepted: validatedData.offerAccepted || false,
            tenantId: userInfo.tenantId,
          },
        })

        return NextResponse.json(newHire, { status: 201 })
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Invalid input', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error creating new hire:', error)
        return NextResponse.json(
          { error: 'Failed to create new hire' },
          { status: 500 }
        )
      }
    }
  )
}

