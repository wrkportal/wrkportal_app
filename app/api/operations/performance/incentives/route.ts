import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

// Helper function to safely access operationsIncentive model
function getOperationsIncentive() {
  return (prisma as any).operationsIncentive as any
}

const createIncentiveSchema = z.object({
  employeeId: z.string().min(1),
  type: z.enum(['PERFORMANCE', 'QUALITY', 'PRODUCTIVITY']),
  amount: z.number().positive(),
  month: z.string().regex(/^\d{4}-\d{2}$/), // YYYY-MM format
})

const calculateIncentiveSchema = z.object({
  employeeId: z.string().min(1),
  type: z.enum(['PERFORMANCE', 'QUALITY', 'PRODUCTIVITY']),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  performanceScore: z.number().min(0).max(100).optional(),
  qualityScore: z.number().min(0).max(100).optional(),
  productivityScore: z.number().min(0).max(100).optional(),
})

// GET - Get incentives
export async function GET(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'READ' },
    async (request, userInfo) => {
      try {
        const { searchParams } = new URL(request.url)
        const employeeId = searchParams.get('employeeId')
        const type = searchParams.get('type')
        const month = searchParams.get('month')
        const status = searchParams.get('status')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')
        const skip = (page - 1) * limit

        const where: any = {
          tenantId: userInfo.tenantId,
        }

        if (employeeId) {
          where.employeeId = employeeId
        }
        if (type) {
          where.type = type
        }
        if (month) {
          where.month = month
        }
        if (status) {
          where.status = status
        }

        const operationsIncentive = getOperationsIncentive()
        if (!operationsIncentive) {
          return NextResponse.json(
            { error: 'Operations incentive model not available' },
            { status: 503 }
          )
        }

        const [incentives, total] = await Promise.all([
          operationsIncentive.findMany({
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
              month: 'desc',
            },
            skip,
            take: limit,
          }),
          operationsIncentive.count({ where }),
        ])

        // Calculate stats
        const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
        const stats = {
          total: await operationsIncentive.count({
            where: { tenantId: userInfo.tenantId },
          }),
          thisMonth: await operationsIncentive.count({
            where: {
              tenantId: userInfo.tenantId,
              month: currentMonth,
            },
          }),
          pending: await operationsIncentive.count({
            where: {
              tenantId: userInfo.tenantId,
              status: 'PENDING',
            },
          }),
          approved: await operationsIncentive.count({
            where: {
              tenantId: userInfo.tenantId,
              status: 'APPROVED',
            },
          }),
          totalAmount: incentives.reduce((sum: number, i: any) => sum + Number(i.amount), 0),
        }

        return NextResponse.json({
          incentives,
          stats,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        })
      } catch (error) {
        console.error('Error fetching incentives:', error)
        return NextResponse.json(
          { error: 'Failed to fetch incentives' },
          { status: 500 }
        )
      }
    }
  )
}

// POST - Create incentive or calculate
export async function POST(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'CREATE' },
    async (request, userInfo) => {
      try {
        const body = await request.json()
        
        // Check if it's a calculation request
        if (body.calculate) {
          const validatedData = calculateIncentiveSchema.parse(body)
          
          // Calculate incentive based on scores
          let amount = 0
          const baseAmount = 500 // Base incentive amount

          if (validatedData.type === 'PERFORMANCE' && validatedData.performanceScore) {
            amount = baseAmount * (validatedData.performanceScore / 100)
          } else if (validatedData.type === 'QUALITY' && validatedData.qualityScore) {
            amount = baseAmount * (validatedData.qualityScore / 100)
          } else if (validatedData.type === 'PRODUCTIVITY' && validatedData.productivityScore) {
            amount = baseAmount * (validatedData.productivityScore / 100)
          }

          return NextResponse.json({
            calculated: true,
            amount: Number(amount.toFixed(2)),
            type: validatedData.type,
            month: validatedData.month,
          })
        }

        // Regular create
        const validatedData = createIncentiveSchema.parse(body)

        // Check if incentive already exists for this employee/month/type
        const operationsIncentive = getOperationsIncentive()
        if (!operationsIncentive) {
          return NextResponse.json(
            { error: 'Operations incentive model not available' },
            { status: 503 }
          )
        }

        const existing = await operationsIncentive.findFirst({
          where: {
            employeeId: validatedData.employeeId,
            type: validatedData.type,
            month: validatedData.month,
            tenantId: userInfo.tenantId,
          },
        })

        if (existing) {
          return NextResponse.json(
            { error: 'Incentive already exists for this employee, type, and month' },
            { status: 400 }
          )
        }

        const incentive = await operationsIncentive.create({
          data: {
            employeeId: validatedData.employeeId,
            type: validatedData.type,
            amount: validatedData.amount,
            month: validatedData.month,
            status: 'PENDING',
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

        return NextResponse.json(incentive, { status: 201 })
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Invalid input', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error creating incentive:', error)
        return NextResponse.json(
          { error: 'Failed to create incentive' },
          { status: 500 }
        )
      }
    }
  )
}

