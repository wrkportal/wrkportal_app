/**
 * AI-Enhanced Lead Scoring API
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { updateLeadScoreWithAI, BehavioralSignals } from '@/lib/sales/ai-lead-scoring'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const leadId = params.id
    const body = await request.json()
    const behavioralSignals: BehavioralSignals | undefined = body.behavioralSignals

    // Get tenant ID from lead
    const lead = await prisma.salesLead.findUnique({
      where: { id: leadId },
      select: { tenantId: true },
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Calculate AI-enhanced score
    const aiScore = await updateLeadScoreWithAI(
      leadId,
      lead.tenantId,
      behavioralSignals
    )

    return NextResponse.json(aiScore)
  } catch (error: any) {
    console.error('Error calculating AI lead score:', error)
    return NextResponse.json(
      { error: 'Failed to calculate lead score', details: error.message },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const leadId = params.id

    // Get lead with AI scoring data
    const lead = await prisma.salesLead.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        score: true,
        customFields: true,
      },
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const customFields = lead.customFields as any
    const aiScoring = customFields?.aiScoring || null

    return NextResponse.json({
      leadId: lead.id,
      currentScore: lead.score,
      aiScoring,
    })
  } catch (error: any) {
    console.error('Error fetching AI lead score:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lead score', details: error.message },
      { status: 500 }
    )
  }
}
