import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

// Helper function to safely access operationsAttrition model
function getOperationsAttrition() {
  return (prisma as any).operationsAttrition as any
}

type AttritionRecord = {
  tenure: number | null
  type: 'VOLUNTARY' | 'INVOLUNTARY'
}

const createAttritionSchema = z.object({
  employeeId: z.string().min(1),
  exitDate: z.string(),
  reason: z.string().optional(),
  type: z.enum(['VOLUNTARY', 'INVOLUNTARY']),
  exitInterview: z.string().optional(),
})

// GET - Get attrition data
export async function GET(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'READ' },
    async (request, userInfo) => {
      try {
        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type')
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')
        const skip = (page - 1) * limit

        const where: any = {
          tenantId: userInfo.tenantId,
        }

        if (type) {
          where.type = type
        }
        if (startDate || endDate) {
          where.exitDate = {}
          if (startDate) {
            where.exitDate.gte = new Date(startDate)
          }
          if (endDate) {
            where.exitDate.lte = new Date(endDate)
          }
        }

        const operationsAttrition = getOperationsAttrition()
        if (!operationsAttrition) {
          return NextResponse.json(
            { error: 'Operations attrition model not available' },
            { status: 503 }
          )
        }

        const [attritions, total] = await Promise.all([
          (operationsAttrition as any).findMany({
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
              exitDate: 'desc',
            },
            skip,
            take: limit,
          }),
          (operationsAttrition as any).count({ where }),
        ])

        // Calculate stats
        const totalEmployees = await prisma.user.count({
          where: {
            tenantId: userInfo.tenantId,
            status: 'ACTIVE',
          },
        })

        const thisMonth = new Date()
        thisMonth.setDate(1)
        thisMonth.setHours(0, 0, 0, 0)

        const thisMonthAttritions = await (operationsAttrition as any).findMany({
          where: {
            tenantId: userInfo.tenantId,
            exitDate: {
              gte: thisMonth,
            },
          },
        })

        const voluntary = (thisMonthAttritions as AttritionRecord[]).filter(
          (a: AttritionRecord) => a.type === 'VOLUNTARY'
        ).length
        const involuntary = (thisMonthAttritions as AttritionRecord[]).filter(
          (a: AttritionRecord) => a.type === 'INVOLUNTARY'
        ).length
        const monthlyAttrition = (thisMonthAttritions as AttritionRecord[]).length
        const monthlyAttritionRate = totalEmployees > 0
          ? Number(((monthlyAttrition / totalEmployees) * 100).toFixed(2))
          : 0

        // Calculate average tenure
        const tenures = (attritions as AttritionRecord[])
          .filter((a: AttritionRecord) => a.tenure !== null)
          .map((a: AttritionRecord) => a.tenure!)
        const avgTenure = tenures.length > 0
          ? Number((tenures.reduce((sum: number, t: number) => sum + t, 0) / tenures.length).toFixed(1))
          : 0

        return NextResponse.json({
          attritions,
          stats: {
            monthlyAttrition,
            monthlyAttritionRate,
            voluntary,
            involuntary,
            avgTenure,
          },
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        })
      } catch (error) {
        console.error('Error fetching attrition data:', error)
        return NextResponse.json(
          { error: 'Failed to fetch attrition data' },
          { status: 500 }
        )
      }
    }
  )
}

// POST - Record employee exit
export async function POST(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'CREATE' },
    async (request, userInfo) => {
      try {
        const body = await request.json()
        const validatedData = createAttritionSchema.parse(body)

        // Calculate tenure (months)
        const employee = await prisma.user.findFirst({
          where: {
            id: validatedData.employeeId,
            tenantId: userInfo.tenantId,
          },
          select: {
            createdAt: true,
          },
        })

        let tenure: number | null = null
        if (employee) {
          const startDate = new Date(employee.createdAt)
          const exitDate = new Date(validatedData.exitDate)
          const months = (exitDate.getFullYear() - startDate.getFullYear()) * 12 +
            (exitDate.getMonth() - startDate.getMonth())
          tenure = months
        }

        const operationsAttrition = getOperationsAttrition()
        if (!operationsAttrition) {
          return NextResponse.json(
            { error: 'Operations attrition model not available' },
            { status: 503 }
          )
        }

        const attrition = await (operationsAttrition as any).create({
          data: {
            employeeId: validatedData.employeeId,
            exitDate: new Date(validatedData.exitDate),
            reason: validatedData.reason,
            type: validatedData.type,
            exitInterview: validatedData.exitInterview,
            tenure,
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

        // Optionally update user status to inactive
        await prisma.user.update({
          where: { id: validatedData.employeeId },
          data: { status: 'INACTIVE' },
        })

        return NextResponse.json(attrition, { status: 201 })
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Invalid input', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error recording attrition:', error)
        return NextResponse.json(
          { error: 'Failed to record attrition' },
          { status: 500 }
        )
      }
    }
  )
}

