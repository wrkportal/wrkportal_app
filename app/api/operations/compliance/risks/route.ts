import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

// Helper function to safely access operationsRisk model
function getOperationsRisk() {
  return (prisma as any).operationsRisk as any
}

const createRiskSchema = z.object({
  category: z.enum(['OPERATIONAL', 'COMPLIANCE', 'TECHNICAL', 'FINANCIAL', 'REPUTATIONAL', 'OTHER']),
  description: z.string().min(1),
  likelihood: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  impact: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  mitigation: z.string().optional(),
})

// GET - Get risks
export async function GET(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'READ' },
    async (request, userInfo) => {
      try {
        const { searchParams } = new URL(request.url)
        const category = searchParams.get('category')
        const riskLevel = searchParams.get('riskLevel')
        const mitigationStatus = searchParams.get('mitigationStatus')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')
        const skip = (page - 1) * limit

        const where: any = {
          tenantId: userInfo.tenantId,
        }

        if (category) {
          where.category = category
        }
        if (riskLevel) {
          where.riskLevel = riskLevel
        }
        if (mitigationStatus) {
          where.mitigationStatus = mitigationStatus
        }

        const operationsRisk = getOperationsRisk()
        if (!operationsRisk) {
          return NextResponse.json(
            { error: 'Operations risk model not available', risks: [], stats: { total: 0, high: 0, mitigated: 0, inProgress: 0 }, pagination: { page, limit, total: 0, totalPages: 0 } },
            { status: 503 }
          )
        }

        const [risks, total] = await Promise.all([
          (operationsRisk as any).findMany({
            where,
            orderBy: [
              { riskLevel: 'desc' },
              { identifiedDate: 'desc' },
            ],
            skip,
            take: limit,
          }),
          (operationsRisk as any).count({ where }),
        ])

        // Calculate stats
        const stats = {
          total: await (operationsRisk as any).count({
            where: { tenantId: userInfo.tenantId },
          }),
          high: await (operationsRisk as any).count({
            where: {
              tenantId: userInfo.tenantId,
              riskLevel: { in: ['HIGH', 'CRITICAL'] },
            },
          }),
          mitigated: await (operationsRisk as any).count({
            where: {
              tenantId: userInfo.tenantId,
              mitigationStatus: 'MITIGATED',
            },
          }),
          inProgress: await (operationsRisk as any).count({
            where: {
              tenantId: userInfo.tenantId,
              mitigationStatus: 'IN_PROGRESS',
            },
          }),
        }

        return NextResponse.json({
          risks,
          stats,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        })
      } catch (error) {
        console.error('Error fetching risks:', error)
        return NextResponse.json(
          { error: 'Failed to fetch risks' },
          { status: 500 }
        )
      }
    }
  )
}

// POST - Identify risk
export async function POST(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'CREATE' },
    async (request, userInfo) => {
      try {
        const body = await request.json()
        const validatedData = createRiskSchema.parse(body)

        const likelihood = validatedData.likelihood || 'MEDIUM'
        const impact = validatedData.impact || 'MEDIUM'

        // Calculate risk level
        let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM'
        if (impact === 'CRITICAL' && (likelihood === 'MEDIUM' || likelihood === 'HIGH')) {
          riskLevel = 'CRITICAL'
        } else if (impact === 'HIGH' && likelihood === 'HIGH') {
          riskLevel = 'CRITICAL'
        } else if (impact === 'HIGH' || (impact === 'MEDIUM' && likelihood === 'HIGH')) {
          riskLevel = 'HIGH'
        } else if (impact === 'LOW' && likelihood === 'LOW') {
          riskLevel = 'LOW'
        }

        const operationsRisk = getOperationsRisk()
        if (!operationsRisk) {
          return NextResponse.json(
            { error: 'Operations risk model not available' },
            { status: 503 }
          )
        }

        const risk = await (operationsRisk as any).create({
          data: {
            category: validatedData.category,
            description: validatedData.description,
            likelihood,
            impact,
            riskLevel,
            mitigation: validatedData.mitigation,
            mitigationStatus: validatedData.mitigation ? 'PLANNED' : 'NOT_STARTED',
            identifiedDate: new Date(),
            tenantId: userInfo.tenantId,
          },
        })

        return NextResponse.json(risk, { status: 201 })
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Invalid input', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error identifying risk:', error)
        return NextResponse.json(
          { error: 'Failed to identify risk' },
          { status: 500 }
        )
      }
    }
  )
}

