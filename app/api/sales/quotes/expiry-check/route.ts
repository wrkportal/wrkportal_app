import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'

/**
 * Check for quotes expiring soon and send notifications
 * This should be called by a cron job or scheduled task
 */
export async function POST(request: NextRequest) {
  try {
    // Verify this is called by a cron job (add secret verification in production)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = new Date()
    const in7Days = new Date()
    in7Days.setDate(in7Days.getDate() + 7)
    const in3Days = new Date()
    in3Days.setDate(in3Days.getDate() + 3)

    // Find quotes expiring in 7 days (not yet expired)
    const expiringQuotes = await prisma.salesQuote.findMany({
      where: {
        status: {
          in: ['DRAFT', 'SENT', 'IN_REVIEW', 'APPROVED'],
        },
        validUntil: {
          gte: today,
          lte: in7Days,
        },
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        account: {
          select: {
            name: true,
          },
        },
      },
    })

    const notificationsCreated = []

    for (const quote of expiringQuotes) {
      if (!quote.validUntil) continue

      const daysUntilExpiry = Math.ceil(
        (quote.validUntil.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      )

      // Send notification to quote creator
      await createNotification({
        userId: quote.createdBy.id,
        tenantId: quote.tenantId,
        type: 'DEADLINE',
        title: `Quote ${quote.quoteNumber} expiring soon`,
        message: `Quote "${quote.name}" will expire in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}. ${quote.account ? `Account: ${quote.account.name}` : ''}`,
        entityType: 'QUOTE',
        entityId: quote.id,
        priority: daysUntilExpiry <= 3 ? 'HIGH' : 'MEDIUM',
      })

      notificationsCreated.push({
        quoteId: quote.id,
        quoteNumber: quote.quoteNumber,
        daysUntilExpiry,
      })
    }

    // Mark quotes as expired that are past validUntil
    await prisma.salesQuote.updateMany({
      where: {
        status: {
          in: ['DRAFT', 'SENT', 'IN_REVIEW', 'APPROVED'],
        },
        validUntil: {
          lt: today,
        },
      },
      data: {
        status: 'EXPIRED',
      },
    })

    return NextResponse.json({
      success: true,
      notificationsCreated: notificationsCreated.length,
      quotes: notificationsCreated,
    })
  } catch (error: any) {
    console.error('Error checking quote expiry:', error)
    return NextResponse.json(
      { error: 'Failed to check quote expiry', details: error.message },
      { status: 500 }
    )
  }
}

// Also allow GET for manual trigger
export async function GET(request: NextRequest) {
  return POST(request)
}

