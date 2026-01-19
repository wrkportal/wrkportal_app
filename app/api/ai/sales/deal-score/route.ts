import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { scoreDeal } from '@/lib/ai/services/sales/deal-scorer'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { opportunityId } = await request.json()

    if (!opportunityId) {
      return NextResponse.json({ error: 'Opportunity ID is required' }, { status: 400 })
    }

    // Fetch opportunity with related data
    const opportunity = await prisma.salesOpportunity.findFirst({
      where: {
        id: opportunityId,
        tenantId: session.user.tenantId!,
      },
      include: {
        account: {
          select: {
            type: true,
            industry: true,
          },
        },
        activities: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
        contacts: {
          include: {
            contact: true,
          },
        },
      },
    })

    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 })
    }

    // Calculate days in pipeline
    const createdAt = new Date(opportunity.createdAt)
    const now = new Date()
    const daysInPipeline = Math.ceil((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))

    // Calculate days since last activity
    const lastActivity = opportunity.activities[0]
    const daysSinceLastActivity = lastActivity
      ? Math.ceil((now.getTime() - new Date(lastActivity.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : daysInPipeline

    // Prepare data for scoring
    const opportunityData = {
      id: opportunity.id,
      name: opportunity.name,
      amount: Number(opportunity.amount || 0),
      stage: opportunity.stage,
      probability: opportunity.probability || 0,
      expectedCloseDate: opportunity.expectedCloseDate?.toISOString() || null,
      status: opportunity.status,
      daysInPipeline,
      account: opportunity.account,
      activities: {
        count: opportunity.activities.length,
        lastActivityDate: lastActivity?.createdAt.toISOString() || null,
        daysSinceLastActivity,
      },
      contacts: {
        count: opportunity.contacts.length,
        decisionMakers: opportunity.contacts.filter(c => 
          c.contact.title?.toLowerCase().includes('director') ||
          c.contact.title?.toLowerCase().includes('vp') ||
          c.contact.title?.toLowerCase().includes('cfo') ||
          c.contact.title?.toLowerCase().includes('ceo') ||
          c.contact.title?.toLowerCase().includes('manager')
        ).length,
      },
    }

    // Score the deal
    const scoreResult = await scoreDeal(opportunityData)

    return NextResponse.json(scoreResult)
  } catch (error: any) {
    console.error('Error scoring deal:', error)
    return NextResponse.json(
      { error: 'Failed to score deal', details: error.message },
      { status: 500 }
    )
  }
}

