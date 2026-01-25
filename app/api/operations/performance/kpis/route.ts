import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

// Helper function to safely access operationsKPI model
function getOperationsKPI() {
  return (prisma as any).operationsKPI as any
}

const createKPISchema = z.object({
  name: z.string().min(1),
  currentValue: z.number(),
  targetValue: z.number(),
  unit: z.string().min(1),
  trend: z.enum(['IMPROVING', 'STABLE', 'DECLINING', 'INCREASING']).optional(),
  department: z.string().optional(),
  period: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']).optional(),
})

// GET - Get KPIs
export async function GET(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'READ' },
    async (request, userInfo) => {
      try {
        const { searchParams } = new URL(request.url)
        const department = searchParams.get('department')
        const period = searchParams.get('period')
        const status = searchParams.get('status')
        const date = searchParams.get('date')

        const where: any = {
          tenantId: userInfo.tenantId,
        }

        if (department) {
          where.department = department
        }
        if (period) {
          where.period = period
        }
        if (status) {
          where.status = status
        }
        if (date) {
          const dateObj = new Date(date)
          where.date = {
            gte: new Date(dateObj.setHours(0, 0, 0, 0)),
            lt: new Date(dateObj.setHours(23, 59, 59, 999)),
          }
        } else {
          // Default to current month
          const now = new Date()
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
          where.date = {
            gte: startOfMonth,
          }
        }

        const operationsKPI = getOperationsKPI()
        if (!operationsKPI) {
          return NextResponse.json(
            { error: 'Operations KPI model not available' },
            { status: 503 }
          )
        }

        const kpis = await operationsKPI.findMany({
          where,
          orderBy: [
            { date: 'desc' },
            { name: 'asc' },
          ],
        })

        // Calculate overall stats
        const stats = {
          total: kpis.length,
          onTrack: kpis.filter((k: any) => k.status === 'ON_TRACK').length,
          atRisk: kpis.filter((k: any) => k.status === 'AT_RISK').length,
          offTrack: kpis.filter((k: any) => k.status === 'OFF_TRACK').length,
          exceeded: kpis.filter((k: any) => k.status === 'EXCEEDED').length,
        }

        return NextResponse.json({
          kpis,
          stats,
        })
      } catch (error) {
        console.error('Error fetching KPIs:', error)
        return NextResponse.json(
          { error: 'Failed to fetch KPIs' },
          { status: 500 }
        )
      }
    }
  )
}

// POST - Create/Update KPI
export async function POST(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'CREATE' },
    async (request, userInfo) => {
      try {
        const body = await request.json()
        const validatedData = createKPISchema.parse(body)

        // Determine status based on current vs target
        let status: 'ON_TRACK' | 'AT_RISK' | 'OFF_TRACK' | 'EXCEEDED' = 'ON_TRACK'
        const variance = ((validatedData.currentValue - validatedData.targetValue) / validatedData.targetValue) * 100

        if (variance >= 10) {
          status = 'EXCEEDED'
        } else if (variance <= -20) {
          status = 'OFF_TRACK'
        } else if (variance <= -10) {
          status = 'AT_RISK'
        }

        const operationsKPI = getOperationsKPI()
        if (!operationsKPI) {
          return NextResponse.json(
            { error: 'Operations KPI model not available' },
            { status: 503 }
          )
        }

        const kpi = await operationsKPI.create({
          data: {
            name: validatedData.name,
            currentValue: validatedData.currentValue,
            targetValue: validatedData.targetValue,
            unit: validatedData.unit,
            trend: validatedData.trend || 'STABLE',
            status,
            department: validatedData.department,
            period: validatedData.period || 'MONTHLY',
            date: new Date(),
            tenantId: userInfo.tenantId,
          },
        })

        return NextResponse.json(kpi, { status: 201 })
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Invalid input', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error creating KPI:', error)
        return NextResponse.json(
          { error: 'Failed to create KPI' },
          { status: 500 }
        )
      }
    }
  )
}

