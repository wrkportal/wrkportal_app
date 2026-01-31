import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { period, forecastType, unitPrice, volume, forecastedAmount } = body

    const forecast = await prisma.salesForecast.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId!,
      },
    })

    if (!forecast) {
      return NextResponse.json({ error: 'Forecast not found' }, { status: 404 })
    }

    // Calculate revenue if unitPrice and volume are provided
    let revenue = forecast.revenue
    if (unitPrice !== undefined && volume !== undefined) {
      const price = parseFloat(unitPrice || 0)
      const vol = parseFloat(volume || 0)
      revenue = new Prisma.Decimal(price * vol)
    } else if (forecastedAmount !== undefined) {
      revenue = new Prisma.Decimal(parseFloat(forecastedAmount))
    }

    const updatedForecast = await prisma.salesForecast.update({
      where: { id: params.id },
      data: {
        period: period || forecast.period,
        forecastType: forecastType || forecast.forecastType,
        unitPrice: unitPrice !== undefined ? (unitPrice ? new Prisma.Decimal(parseFloat(unitPrice)) : null) : forecast.unitPrice,
        volume: volume !== undefined ? (volume ? new Prisma.Decimal(parseFloat(volume)) : null) : forecast.volume,
        forecastedAmount: revenue,
        revenue,
        quota: revenue,
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

    return NextResponse.json(updatedForecast)
  } catch (error: any) {
    console.error('Error updating forecast:', error)
    return NextResponse.json(
      { error: 'Failed to update forecast', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const forecast = await prisma.salesForecast.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId!,
      },
    })

    if (!forecast) {
      return NextResponse.json({ error: 'Forecast not found' }, { status: 404 })
    }

    await prisma.salesForecast.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting forecast:', error)
    return NextResponse.json(
      { error: 'Failed to delete forecast', details: error.message },
      { status: 500 }
    )
  }
}

