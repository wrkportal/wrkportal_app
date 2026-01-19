import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

const createOnboardingSchema = z.object({
  newHireId: z.string().optional(),
  employeeId: z.string().optional(),
  startDate: z.string(),
})

const updateProgressSchema = z.object({
  progress: z.number().int().min(0).max(100),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD']).optional(),
})

// GET - List onboarding records
export async function GET(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'READ' },
    async (request, userInfo) => {
      try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')
        const skip = (page - 1) * limit

        const where: any = {
          tenantId: userInfo.tenantId,
        }

        if (status) {
          where.status = status
        }

        const [onboarding, total] = await Promise.all([
          prisma.operationsOnboarding.findMany({
            where,
            include: {
              newHire: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  department: true,
                  joinDate: true,
                },
              },
            },
            orderBy: {
              startDate: 'desc',
            },
            skip,
            take: limit,
          }),
          prisma.operationsOnboarding.count({ where }),
        ])

        // Calculate stats
        const stats = {
          total: await prisma.operationsOnboarding.count({
            where: { tenantId: userInfo.tenantId },
          }),
          inProgress: await prisma.operationsOnboarding.count({
            where: {
              tenantId: userInfo.tenantId,
              status: 'IN_PROGRESS',
            },
          }),
          completed: await prisma.operationsOnboarding.count({
            where: {
              tenantId: userInfo.tenantId,
              status: 'COMPLETED',
            },
          }),
          avgProgress: onboarding.length > 0
            ? Number((onboarding.reduce((sum, o) => sum + o.progress, 0) / onboarding.length).toFixed(1))
            : 0,
        }

        return NextResponse.json({
          onboarding,
          stats,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        })
      } catch (error) {
        console.error('Error fetching onboarding records:', error)
        return NextResponse.json(
          { error: 'Failed to fetch onboarding records' },
          { status: 500 }
        )
      }
    }
  )
}

// POST - Start onboarding
export async function POST(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'CREATE' },
    async (request, userInfo) => {
      try {
        const body = await request.json()
        const validatedData = createOnboardingSchema.parse(body)

        if (!validatedData.newHireId && !validatedData.employeeId) {
          return NextResponse.json(
            { error: 'Either newHireId or employeeId is required' },
            { status: 400 }
          )
        }

        // Verify new hire exists if provided
        if (validatedData.newHireId) {
          const newHire = await prisma.operationsNewHire.findFirst({
            where: {
              id: validatedData.newHireId,
              tenantId: userInfo.tenantId,
            },
          })

          if (!newHire) {
            return NextResponse.json(
              { error: 'New hire not found' },
              { status: 404 }
            )
          }
        }

        // Verify employee exists if provided
        if (validatedData.employeeId) {
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
        }

        const onboarding = await prisma.operationsOnboarding.create({
          data: {
            newHireId: validatedData.newHireId,
            employeeId: validatedData.employeeId,
            startDate: new Date(validatedData.startDate),
            status: 'IN_PROGRESS',
            progress: 0,
            tenantId: userInfo.tenantId,
          },
          include: {
            newHire: {
              select: {
                id: true,
                name: true,
                email: true,
                department: true,
                joinDate: true,
              },
            },
          },
        })

        return NextResponse.json(onboarding, { status: 201 })
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Invalid input', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error starting onboarding:', error)
        return NextResponse.json(
          { error: 'Failed to start onboarding' },
          { status: 500 }
        )
      }
    }
  )
}

