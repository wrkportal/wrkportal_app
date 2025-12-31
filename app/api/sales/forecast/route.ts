import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period')
    const accountId = searchParams.get('accountId')

    const where: any = {
      tenantId: session.user.tenantId!,
    }

    // Client-level forecasts (accountId is required)
    if (accountId) {
      where.accountId = accountId
    }

    if (period) {
      where.period = period
    }

    const forecasts = await prisma.salesForecast.findMany({
      where,
      include: {
        account: {
          select: {
            id: true,
            name: true,
            email: true,
            type: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        period: 'asc',
      },
    })

    return NextResponse.json(forecasts)
  } catch (error: any) {
    console.error('Error fetching forecasts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch forecasts', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { accountId, period, forecastType, unitPrice, volume, forecastedAmount } = body

    if (!accountId || !period) {
      return NextResponse.json(
        { error: 'Account ID and period are required' },
        { status: 400 }
      )
    }

    // Calculate revenue if unitPrice and volume are provided
    let revenue = parseFloat(forecastedAmount || 0)
    if (unitPrice && volume) {
      revenue = parseFloat(unitPrice) * parseFloat(volume)
    }

    // Validate account exists
    const account = await prisma.salesAccount.findFirst({
      where: {
        id: accountId,
        tenantId: session.user.tenantId!,
      },
    })

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    const forecast = await prisma.salesForecast.upsert({
      where: {
        tenantId_accountId_period: {
          tenantId: session.user.tenantId!,
          accountId,
          period,
        },
      },
      update: {
        forecastType: forecastType || 'MONTHLY',
        unitPrice: unitPrice ? parseFloat(unitPrice) : null,
        volume: volume ? parseFloat(volume) : null,
        forecastedAmount: revenue,
        revenue,
        quota: revenue, // Use revenue as quota for client-level forecasts
      },
      create: {
        tenantId: session.user.tenantId!,
        accountId: accountId,
        userId: session.user.id,
        period,
        forecastType: forecastType || 'MONTHLY',
        unitPrice: unitPrice ? parseFloat(unitPrice) : null,
        volume: volume ? parseFloat(volume) : null,
        forecastedAmount: revenue,
        revenue,
        quota: revenue,
        actualAmount: 0,
        pipelineAmount: 0,
        closedWonAmount: 0,
        closedLostAmount: 0,
        attainment: 0,
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            email: true,
            type: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    })

    return NextResponse.json(forecast, { status: 201 })
  } catch (error: any) {
    console.error('Error creating forecast:', error)
    return NextResponse.json(
      { error: 'Failed to create forecast', details: error.message },
      { status: 500 }
    )
  }
}
