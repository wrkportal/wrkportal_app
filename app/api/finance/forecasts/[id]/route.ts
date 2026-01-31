import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET /api/finance/forecasts/[id] - Get forecast details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const forecast = await prisma.forecast.findFirst({
      where: {
        id: params.id,
        budget: {
          tenantId: (session.user as any).tenantId,
        },
      },
      include: {
        budget: {
          select: {
            id: true,
            name: true,
            totalAmount: true,
            categories: {
              select: {
                id: true,
                name: true,
                allocatedAmount: true,
                spentAmount: true,
              },
            },
          },
        },
        project: {
          select: { id: true, name: true, code: true, progress: true },
        },
        dataPoints: {
          orderBy: { date: 'asc' },
        },
      },
    })

    if (!forecast) {
      return NextResponse.json({ error: 'Forecast not found' }, { status: 404 })
    }

    // Calculate variance
    const budgetTotal = Number(forecast.budget.totalAmount)
    const forecastedAmount = Number(forecast.forecastedAmount)
    const variance = forecastedAmount - budgetTotal
    const variancePercent = budgetTotal > 0 ? (variance / budgetTotal) * 100 : 0

    return NextResponse.json({
      forecast: {
        ...forecast,
        variance,
        variancePercent,
      },
    })
  } catch (error: any) {
    console.error('Error fetching forecast:', error)
    return NextResponse.json(
      { error: 'Failed to fetch forecast', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE /api/finance/forecasts/[id] - Delete forecast
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    const userRole = (session.user as any).role
    const allowedRoles = ['FINANCE_CONTROLLER', 'ORG_ADMIN', 'TENANT_SUPER_ADMIN']
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const forecast = await prisma.forecast.findFirst({
      where: {
        id: params.id,
        budget: {
          tenantId: (session.user as any).tenantId,
        },
      },
    })

    if (!forecast) {
      return NextResponse.json({ error: 'Forecast not found' }, { status: 404 })
    }

    await prisma.forecast.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Forecast deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting forecast:', error)
    return NextResponse.json(
      { error: 'Failed to delete forecast', details: error.message },
      { status: 500 }
    )
  }
}

