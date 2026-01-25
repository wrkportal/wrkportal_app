import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

// Helper function to safely access operationsQualityCheck model
function getOperationsQualityCheck() {
  return (prisma as any).operationsQualityCheck as any
}

const createQualityCheckSchema = z.object({
  checkType: z.string().min(1),
  passed: z.number().int().min(0),
  failed: z.number().int().min(0),
  notes: z.string().optional(),
})

// GET - Get quality checks
export async function GET(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'READ' },
    async (request, userInfo) => {
      try {
        const { searchParams } = new URL(request.url)
        const checkType = searchParams.get('checkType')
        const status = searchParams.get('status')
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')
        const skip = (page - 1) * limit

        const where: any = {
          tenantId: userInfo.tenantId,
        }

        if (checkType) {
          where.checkType = checkType
        }
        if (status) {
          where.status = status
        }
        if (startDate || endDate) {
          where.date = {}
          if (startDate) {
            where.date.gte = new Date(startDate)
          }
          if (endDate) {
            where.date.lte = new Date(endDate)
          }
        }

        const operationsQualityCheck = getOperationsQualityCheck()
        if (!operationsQualityCheck) {
          return NextResponse.json(
            { error: 'Operations quality check model not available' },
            { status: 503 }
          )
        }

        const [qualityChecks, total] = await Promise.all([
          operationsQualityCheck.findMany({
            where,
            orderBy: {
              date: 'desc',
            },
            skip,
            take: limit,
          }),
          operationsQualityCheck.count({ where }),
        ])

        // Calculate overall stats
        const overallQuality = qualityChecks.length > 0
          ? Number((qualityChecks.reduce((sum: number, q: any) => sum + Number(q.passRate), 0) / qualityChecks.length).toFixed(1))
          : 0

        const stats = {
          total: await operationsQualityCheck.count({
            where: { tenantId: userInfo.tenantId },
          }),
          passed: qualityChecks.reduce((sum: number, q: any) => sum + q.passed, 0),
          failed: qualityChecks.reduce((sum: number, q: any) => sum + q.failed, 0),
          overallQuality,
        }

        return NextResponse.json({
          qualityChecks,
          stats,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        })
      } catch (error) {
        console.error('Error fetching quality checks:', error)
        return NextResponse.json(
          { error: 'Failed to fetch quality checks' },
          { status: 500 }
        )
      }
    }
  )
}

// POST - Record quality check
export async function POST(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'CREATE' },
    async (request, userInfo) => {
      try {
        const body = await request.json()
        const validatedData = createQualityCheckSchema.parse(body)

        const total = validatedData.passed + validatedData.failed
        const passRate = total > 0
          ? Number(((validatedData.passed / total) * 100).toFixed(2))
          : 0

        let status: 'PASS' | 'FAIL' | 'WARNING' = 'PASS'
        if (passRate < 80) {
          status = 'FAIL'
        } else if (passRate < 90) {
          status = 'WARNING'
        }

        const operationsQualityCheck = getOperationsQualityCheck()
        if (!operationsQualityCheck) {
          return NextResponse.json(
            { error: 'Operations quality check model not available' },
            { status: 503 }
          )
        }

        const qualityCheck = await operationsQualityCheck.create({
          data: {
            checkType: validatedData.checkType,
            passed: validatedData.passed,
            failed: validatedData.failed,
            passRate,
            status,
            notes: validatedData.notes,
            date: new Date(),
            tenantId: userInfo.tenantId,
          },
        })

        return NextResponse.json(qualityCheck, { status: 201 })
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Invalid input', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error recording quality check:', error)
        return NextResponse.json(
          { error: 'Failed to record quality check' },
          { status: 500 }
        )
      }
    }
  )
}

