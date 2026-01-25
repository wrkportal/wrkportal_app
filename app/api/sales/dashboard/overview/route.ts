import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const tenantId = session.user.tenantId!

    // Fetch all relevant data
    const [opportunities, leads, activities, quotes, accounts] = await Promise.all([
      // Opportunities assigned to user
      prisma.salesOpportunity.findMany({
        where: {
          tenantId,
          ownerId: userId,
          status: 'OPEN',
        },
        include: {
          account: {
            select: { id: true, name: true },
          },
        },
        orderBy: { expectedCloseDate: 'asc' },
      }),
      // Leads assigned to user
      prisma.salesLead.findMany({
        where: {
          tenantId,
          assignedToId: userId,
        },
      }),
      // Activities assigned to user for today
      prisma.salesActivity.findMany({
        where: {
          tenantId,
          assignedToId: userId,
          status: { in: ['PLANNED', 'IN_PROGRESS'] },
          dueDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
        include: {
          opportunity: {
            select: { id: true, name: true, amount: true },
          },
          lead: {
            select: { id: true, firstName: true, lastName: true },
          },
          contact: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        orderBy: { priority: 'desc' },
      }),
      // Quotes for scoreboard
      prisma.salesQuote.findMany({
        where: {
          tenantId,
          createdById: userId,
        },
        select: {
          id: true,
          status: true,
          totalAmount: true,
          createdAt: true,
        },
      }),
      // Accounts for scoreboard
      prisma.salesAccount.findMany({
        where: {
          tenantId,
          ownerId: userId,
        },
        select: {
          id: true,
          status: true,
        },
      }),
    ])

    // Fetch activities for opportunities to calculate days since last activity
    const opportunityActivities = await prisma.salesActivity.findMany({
      where: {
        tenantId,
        opportunityId: { in: opportunities.map((o: any) => o.id) },
      },
      select: {
        opportunityId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Group activities by opportunity (get most recent per opportunity)
    const activitiesByOpportunity = opportunityActivities.reduce((acc: any, activity: any) => {
      if (activity.opportunityId && (!acc[activity.opportunityId] || new Date(activity.createdAt) > new Date(acc[activity.opportunityId].createdAt))) {
        acc[activity.opportunityId] = activity
      }
      return acc
    }, {})

    // Calculate today's top priorities (ranked by revenue impact + urgency)
    const topPriorities = opportunities
      .map((opp: any) => {
        const amount = Number(opp.amount || 0)
        const daysUntilClose = opp.expectedCloseDate
          ? Math.ceil((new Date(opp.expectedCloseDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          : 999
        const urgencyScore = Math.max(0, 100 - daysUntilClose) // Higher urgency as deadline approaches
        const revenueScore = Math.min(100, (amount / 100000) * 100) // Normalize to 0-100
        const priorityScore = (revenueScore * 0.6) + (urgencyScore * 0.4) // 60% revenue, 40% urgency

        // Get last activity date
        const lastActivity = activitiesByOpportunity[opp.id]
        const daysSinceLastActivity = lastActivity
          ? Math.ceil((new Date().getTime() - new Date(lastActivity.createdAt).getTime()) / (1000 * 60 * 60 * 24))
          : 999

        return {
          id: opp.id,
          name: opp.name,
          account: opp.account?.name || 'No Account',
          amount,
          expectedCloseDate: opp.expectedCloseDate,
          daysUntilClose,
          priorityScore,
          daysSinceLastActivity,
          stage: opp.stage,
        }
      })
      .sort((a: any, b: any) => b.priorityScore - a.priorityScore)
      .slice(0, 10)

    // Deal Risk Radar (red/yellow/green)
    const dealRiskRadar = opportunities.map((opp: any) => {
      const amount = Number(opp.amount || 0)
      const lastActivity = activitiesByOpportunity[opp.id]
      const daysSinceLastActivity = lastActivity
        ? Math.ceil((new Date().getTime() - new Date(lastActivity.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        : 999
      const daysUntilClose = opp.expectedCloseDate
        ? Math.ceil((new Date(opp.expectedCloseDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : 999

      // Calculate risk level
      let riskLevel: 'low' | 'medium' | 'high' = 'low'
      let riskReasons: string[] = []

      // High risk factors
      if (daysSinceLastActivity > 14) {
        riskLevel = 'high'
        riskReasons.push(`Ghosting risk high: no response in ${daysSinceLastActivity} days`)
      }
      if (daysUntilClose < 7 && opp.stage !== 'CLOSED_WON') {
        riskLevel = 'high'
        riskReasons.push(`Closing in ${daysUntilClose} days - urgent follow-up needed`)
      }
      if (opp.stage === 'CLOSED_LOST' || opp.status === 'LOST') {
        riskLevel = 'high'
        riskReasons.push('Deal lost')
      }

      // Medium risk factors
      if (riskLevel === 'low') {
        if (daysSinceLastActivity > 7) {
          riskLevel = 'medium'
          riskReasons.push(`No activity in ${daysSinceLastActivity} days`)
        }
        if (daysUntilClose < 30 && opp.stage !== 'CLOSED_WON') {
          riskLevel = 'medium'
          riskReasons.push(`Closing soon (${daysUntilClose} days)`)
        }
      }

      return {
        id: opp.id,
        name: opp.name,
        account: opp.account?.name || 'No Account',
        amount,
        riskLevel,
        riskReasons,
        stage: opp.stage,
        expectedCloseDate: opp.expectedCloseDate,
        daysSinceLastActivity,
      }
    })

    // Next Best Actions (calls, emails, proposals, etc.)
    const nextBestActions: any[] = []
    
    // Add activities for today
    activities.forEach((activity: any) => {
      nextBestActions.push({
        type: activity.type,
        id: activity.id,
        subject: activity.subject,
        relatedTo: activity.opportunity?.name || activity.lead?.firstName + ' ' + activity.lead?.lastName || activity.contact?.firstName + ' ' + activity.contact?.lastName || 'Unknown',
        relatedToId: activity.opportunityId || activity.leadId || activity.contactId,
        relatedToType: activity.opportunityId ? 'opportunity' : activity.leadId ? 'lead' : 'contact',
        dueDate: activity.dueDate,
        priority: activity.priority,
        actionLabel: activity.type === 'CALL' ? 'Call' : activity.type === 'EMAIL' ? 'Email' : activity.type === 'MEETING' ? 'Meeting' : activity.type === 'TASK' ? 'Task' : 'Note',
      })
    })

      // Add high-priority opportunities without recent activities
      opportunities
        .filter((opp: any) => {
          const lastActivity = activitiesByOpportunity[opp.id]
          if (!lastActivity) return true
          const daysSince = Math.ceil((new Date().getTime() - new Date(lastActivity.createdAt).getTime()) / (1000 * 60 * 60 * 24))
          return daysSince > 7
        })
        .slice(0, 5)
        .forEach((opp: any) => {
          const amount = Number(opp.amount || 0)
          if (amount > 10000) {
            nextBestActions.push({
              type: 'PROPOSAL',
              id: `opp-${opp.id}`,
              subject: `Follow up on ${opp.name}`,
              relatedTo: opp.name,
              relatedToId: opp.id,
              relatedToType: 'opportunity',
              priority: 'HIGH',
              actionLabel: 'Proposal',
            })
          }
        })

    // Sort by priority
    const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 }
    nextBestActions.sort((a: any, b: any) => (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - (priorityOrder[a.priority as keyof typeof priorityOrder] || 0))

    // Fetch activities for leads
    const leadActivities = await prisma.salesActivity.findMany({
      where: {
        tenantId,
        leadId: { in: leads.map((l: any) => l.id) },
      },
      select: {
        leadId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Group activities by lead (get most recent per lead)
    const activitiesByLead = leadActivities.reduce((acc: any, activity: any) => {
      if (activity.leadId && (!acc[activity.leadId] || new Date(activity.createdAt) > new Date(acc[activity.leadId].createdAt))) {
        acc[activity.leadId] = activity
      }
      return acc
    }, {})

    // SLA Timers (how long leads have been waiting)
    const slaTimers = leads.map((lead: any) => {
      const createdAt = new Date(lead.createdAt)
      const now = new Date()
      const hoursSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60))
      const daysSinceCreation = Math.floor(hoursSinceCreation / 24)

      // SLA: First response should be within 24 hours
      const slaStatus = hoursSinceCreation <= 24 ? 'green' : hoursSinceCreation <= 48 ? 'yellow' : 'red'
      
      const lastActivity = activitiesByLead[lead.id]
      const hasResponse = lastActivity && new Date(lastActivity.createdAt) > createdAt

      return {
        id: lead.id,
        name: `${lead.firstName} ${lead.lastName}`,
        email: lead.email,
        createdAt: lead.createdAt,
        hoursSinceCreation,
        daysSinceCreation,
        slaStatus,
        hasResponse,
        lastActivityDate: lastActivity?.createdAt || null,
      }
    }).sort((a: any, b: any) => b.hoursSinceCreation - a.hoursSinceCreation)

    // Personal Scoreboard
    const wonOpps = await prisma.salesOpportunity.findMany({
      where: {
        tenantId,
        ownerId: userId,
        status: 'WON',
      },
    })

    const lostOpps = await prisma.salesOpportunity.findMany({
      where: {
        tenantId,
        ownerId: userId,
        status: 'LOST',
      },
    })

    const totalClosed = wonOpps.length + lostOpps.length
    const conversionRate = totalClosed > 0 ? (wonOpps.length / totalClosed) * 100 : 0
    
    const pipelineValue = opportunities.reduce((sum: number, opp: any) => sum + Number(opp.amount || 0), 0)
    
    // Count meetings (MEETING activities)
    const meetings = await prisma.salesActivity.count({
      where: {
        tenantId,
        assignedToId: userId,
        type: 'MEETING',
        status: 'COMPLETED',
        completedDate: {
          gte: new Date(new Date().setDate(new Date().getDate() - 30)), // Last 30 days
        },
      },
    })

    const personalScoreboard = {
      pipelineCoverage: pipelineValue,
      meetingsSet: meetings,
      conversionRate: conversionRate.toFixed(1),
      openDeals: opportunities.length,
      wonDeals: wonOpps.length,
      totalRevenue: wonOpps.reduce((sum: number, opp: any) => sum + Number(opp.amount || 0), 0),
    }

    // AI Task Triage: Top 5 things to do today
    const aiTaskTriage = [
      ...topPriorities.slice(0, 3).map((opp: any, idx: number) => ({
        rank: idx + 1,
        type: 'opportunity' as const,
        title: `Follow up: ${opp.name}`,
        description: `$${opp.amount.toLocaleString()} opportunity, ${opp.daysUntilClose} days to close`,
        action: `View Opportunity`,
        actionUrl: `/sales-dashboard/opportunities/${opp.id}`,
        priority: 'high' as const,
      })),
      ...slaTimers
        .filter((lead: any) => lead.slaStatus === 'red' && !lead.hasResponse)
        .slice(0, 2)
        .map((lead: any, idx: number) => ({
          rank: topPriorities.length + idx + 1,
          type: 'lead' as const,
          title: `Respond to ${lead.name}`,
          description: `SLA breached: ${lead.daysSinceCreation} days without response`,
          action: `Contact Lead`,
          actionUrl: `/sales-dashboard/leads/${lead.id}`,
          priority: 'high' as const,
        })),
    ].slice(0, 5)

    return NextResponse.json({
      topPriorities,
      dealRiskRadar,
      nextBestActions: nextBestActions.slice(0, 20),
      slaTimers,
      personalScoreboard,
      aiTaskTriage,
    })
  } catch (error: any) {
    console.error('Error fetching overview data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch overview data', details: error.message },
      { status: 500 }
    )
  }
}

