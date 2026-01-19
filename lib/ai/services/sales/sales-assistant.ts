/**
 * Sales AI Assistant Service
 * 
 * Conversational AI assistant specifically for sales data and operations
 */

import { generateChatCompletion, ChatTool } from '@/lib/ai/ai-service'
import { convertOpenAIMessages } from '@/lib/ai/compat'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'

const SALES_ASSISTANT_SYSTEM_PROMPT = `You are a helpful Sales AI Assistant specialized in helping sales professionals manage their pipeline, leads, opportunities, and accounts. You have access to real-time sales data and can help with:

- Pipeline analysis and forecasting
- Lead and opportunity management
- Deal scoring and risk assessment
- Next best actions recommendations
- Account and contact information
- Performance metrics and analytics

Always provide actionable, data-driven insights. Be concise but thorough. When scoring deals or assessing risk, explain your reasoning.`

/**
 * Sales-specific function definitions for OpenAI function calling
 */
export const SALES_FUNCTIONS: ChatTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_my_opportunities',
      description: 'Get opportunities assigned to the current user. Can filter by stage, amount, or date range.',
      parameters: {
        type: 'object',
        properties: {
          stage: {
            type: 'string',
            description: 'Filter by opportunity stage (PROSPECTING, QUALIFICATION, PROPOSAL, NEGOTIATION, WON, LOST)',
            enum: ['PROSPECTING', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'],
          },
          minAmount: {
            type: 'number',
            description: 'Minimum opportunity amount',
          },
          maxAmount: {
            type: 'number',
            description: 'Maximum opportunity amount',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of opportunities to return (default: 20)',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_opportunity_details',
      description: 'Get detailed information about a specific opportunity including activities, notes, and timeline.',
      parameters: {
        type: 'object',
        properties: {
          opportunityId: {
            type: 'string',
            description: 'The ID of the opportunity',
          },
        },
        required: ['opportunityId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_pipeline_summary',
      description: 'Get pipeline summary including total value, stage distribution, and forecast.',
      parameters: {
        type: 'object',
        properties: {
          includeForecast: {
            type: 'boolean',
            description: 'Include forecast calculations (default: true)',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_my_leads',
      description: 'Get leads assigned to the current user. Can filter by status, source, or rating.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            description: 'Filter by lead status',
            enum: ['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'NURTURING', 'CONVERTED'],
          },
          source: {
            type: 'string',
            description: 'Filter by lead source',
          },
          rating: {
            type: 'string',
            description: 'Filter by lead rating',
            enum: ['HOT', 'WARM', 'COLD'],
          },
          limit: {
            type: 'number',
            description: 'Maximum number of leads to return (default: 20)',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_account_details',
      description: 'Get detailed information about an account including contacts, opportunities, and activities.',
      parameters: {
        type: 'object',
        properties: {
          accountId: {
            type: 'string',
            description: 'The ID of the account',
          },
        },
        required: ['accountId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'score_opportunity',
      description: 'Score a specific opportunity based on multiple factors including stage, amount, probability, and activity.',
      parameters: {
        type: 'object',
        properties: {
          opportunityId: {
            type: 'string',
            description: 'The ID of the opportunity to score',
          },
        },
        required: ['opportunityId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_next_best_actions',
      description: 'Get recommended next best actions for opportunities, leads, or accounts.',
      parameters: {
        type: 'object',
        properties: {
          entityType: {
            type: 'string',
            description: 'Type of entity (opportunity, lead, account)',
            enum: ['opportunity', 'lead', 'account'],
          },
          entityId: {
            type: 'string',
            description: 'ID of the specific entity (optional)',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of actions to return (default: 5)',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_deal_risk',
      description: 'Assess deal risk for an opportunity based on stage, activity, timeline, and other factors.',
      parameters: {
        type: 'object',
        properties: {
          opportunityId: {
            type: 'string',
            description: 'The ID of the opportunity',
          },
        },
        required: ['opportunityId'],
      },
    },
  },
]

/**
 * Chat with Sales AI Assistant
 */
export async function chatWithSalesAssistant(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  userId: string,
  tenantId: string,
  availableFunctions?: Record<string, Function>
): Promise<{ message: string; functionCalls?: any[] }> {
  try {
    // Add system message if not present
    const messagesWithSystem: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: SALES_ASSISTANT_SYSTEM_PROMPT,
      },
      ...messages,
    ]

    const completion = await generateChatCompletion(messagesWithSystem, {
      temperature: 0.7,
      maxTokens: 1000,
      tools: SALES_FUNCTIONS,
    })

    const responseMessage = completion.choices[0]?.message

    // Handle function calls
    if (responseMessage?.tool_calls && responseMessage.tool_calls.length > 0) {
      const functionCalls: any[] = []
      const functionResults: OpenAI.Chat.ChatCompletionMessageParam[] = []

      for (const toolCall of responseMessage.tool_calls) {
        const functionName = toolCall.function.name
        const functionArgs = JSON.parse(toolCall.function.arguments || '{}')

        if (availableFunctions && availableFunctions[functionName]) {
          try {
            const result = await availableFunctions[functionName](functionArgs, userId, tenantId)
            functionCalls.push({
              name: functionName,
              args: functionArgs,
              result,
            })

            functionResults.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(result),
            })
          } catch (error) {
            functionResults.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify({
                error: (error as Error).message,
              }),
            })
          }
        }
      }

      // Get final response with function results
      const finalMessages = [
        ...messagesWithSystem,
        responseMessage,
        ...functionResults,
      ]

      const finalCompletion = await generateChatCompletion(finalMessages, {
        temperature: 0.7,
        maxTokens: 1000,
      })

      return {
        message: finalCompletion.choices[0].message.content || 'I apologize, but I could not generate a response.',
        functionCalls,
      }
    }

    return {
      message: responseMessage.content || 'I apologize, but I could not generate a response.',
    }
  } catch (error) {
    console.error('Sales Assistant error:', error)
    throw error
  }
}

/**
 * Create function implementations for sales data
 */
export function createSalesFunctionImplementations(userId: string, tenantId: string) {
  return {
    get_my_opportunities: async (args: any) => {
      const where: any = {
        tenantId,
        ownerId: userId,
      }

      if (args.stage) where.stage = args.stage
      if (args.minAmount) where.amount = { gte: args.minAmount }
      if (args.maxAmount) {
        where.amount = { ...where.amount, lte: args.maxAmount }
      }

      const opportunities = await prisma.salesOpportunity.findMany({
        where,
        take: args.limit || 20,
        orderBy: { amount: 'desc' },
        include: {
          account: {
            select: { name: true },
          },
          owner: {
            select: { name: true, email: true },
          },
        },
      })

      return {
        count: opportunities.length,
        opportunities: opportunities.map(opp => ({
          id: opp.id,
          name: opp.name,
          amount: opp.amount,
          stage: opp.stage,
          probability: opp.probability,
          closeDate: opp.closeDate,
          account: opp.account?.name,
          owner: opp.owner?.name,
        })),
      }
    },

    get_opportunity_details: async (args: any) => {
      const opportunity = await prisma.salesOpportunity.findUnique({
        where: {
          id: args.opportunityId,
          tenantId,
        },
        include: {
          account: true,
          owner: {
            select: { name: true, email: true },
          },
          activities: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      })

      if (!opportunity) {
        return { error: 'Opportunity not found' }
      }

      return {
        id: opportunity.id,
        name: opportunity.name,
        amount: opportunity.amount,
        stage: opportunity.stage,
        probability: opportunity.probability,
        closeDate: opportunity.closeDate,
        account: opportunity.account,
        owner: opportunity.owner,
        recentActivities: opportunity.activities,
        createdAt: opportunity.createdAt,
        updatedAt: opportunity.updatedAt,
      }
    },

    get_pipeline_summary: async (args: any) => {
      const opportunities = await prisma.salesOpportunity.findMany({
        where: {
          tenantId,
          ownerId: userId,
          stage: { notIn: ['WON', 'LOST'] },
        },
      })

      const totalValue = opportunities.reduce((sum, opp) => sum + (opp.amount || 0), 0)
      const weightedForecast = opportunities.reduce(
        (sum, opp) => sum + (opp.amount || 0) * ((opp.probability || 0) / 100),
        0
      )

      const stageDistribution = opportunities.reduce((acc, opp) => {
        acc[opp.stage] = (acc[opp.stage] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      return {
        totalOpportunities: opportunities.length,
        totalValue,
        weightedForecast: args.includeForecast !== false ? weightedForecast : undefined,
        stageDistribution,
        averageDealSize: opportunities.length > 0 ? totalValue / opportunities.length : 0,
      }
    },

    get_my_leads: async (args: any) => {
      const where: any = {
        tenantId,
        ownerId: userId,
      }

      if (args.status) where.status = args.status
      if (args.source) where.leadSource = args.source
      if (args.rating) where.rating = args.rating

      const leads = await prisma.salesLead.findMany({
        where,
        take: args.limit || 20,
        orderBy: { createdAt: 'desc' },
      })

      return {
        count: leads.length,
        leads: leads.map(lead => ({
          id: lead.id,
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          company: lead.company,
          status: lead.status,
          rating: lead.rating,
          score: lead.score,
        })),
      }
    },

    get_account_details: async (args: any) => {
      const account = await prisma.salesAccount.findUnique({
        where: {
          id: args.accountId,
          tenantId,
        },
        include: {
          contacts: {
            take: 10,
          },
          opportunities: {
            take: 10,
            orderBy: { amount: 'desc' },
          },
          activities: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      })

      if (!account) {
        return { error: 'Account not found' }
      }

      return {
        id: account.id,
        name: account.name,
        industry: account.industry,
        website: account.website,
        contacts: account.contacts,
        opportunities: account.opportunities,
        recentActivities: account.activities,
      }
    },

    score_opportunity: async (args: any) => {
      const opportunity = await prisma.salesOpportunity.findUnique({
        where: {
          id: args.opportunityId,
          tenantId,
        },
        include: {
          activities: {
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
        },
      })

      if (!opportunity) {
        return { error: 'Opportunity not found' }
      }

      // Calculate score based on multiple factors
      let score = 0
      const factors: string[] = []

      // Stage factor (0-30 points)
      const stageScores: Record<string, number> = {
        PROSPECTING: 5,
        QUALIFICATION: 10,
        PROPOSAL: 20,
        NEGOTIATION: 25,
        WON: 30,
        LOST: 0,
      }
      score += stageScores[opportunity.stage] || 0
      factors.push(`Stage (${opportunity.stage}): ${stageScores[opportunity.stage] || 0} points`)

      // Amount factor (0-30 points)
      if (opportunity.amount) {
        const amountScore = Math.min(30, Math.floor(opportunity.amount / 10000))
        score += amountScore
        factors.push(`Amount ($${opportunity.amount.toLocaleString()}): ${amountScore} points`)
      }

      // Probability factor (0-20 points)
      if (opportunity.probability) {
        const probScore = Math.floor(opportunity.probability / 5)
        score += probScore
        factors.push(`Probability (${opportunity.probability}%): ${probScore} points`)
      }

      // Activity factor (0-20 points)
      const recentActivityCount = opportunity.activities.filter(
        act => act.createdAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ).length
      const activityScore = Math.min(20, recentActivityCount * 2)
      score += activityScore
      factors.push(`Recent Activity (${recentActivityCount} activities): ${activityScore} points`)

      return {
        opportunityId: opportunity.id,
        opportunityName: opportunity.name,
        score: Math.min(100, score),
        maxScore: 100,
        factors,
        recommendation: score >= 70 ? 'HIGH_PRIORITY' : score >= 40 ? 'MEDIUM_PRIORITY' : 'LOW_PRIORITY',
      }
    },

    get_next_best_actions: async (args: any) => {
      const actions: any[] = []

      if (args.entityType === 'opportunity' && args.entityId) {
        const opportunity = await prisma.salesOpportunity.findUnique({
          where: {
            id: args.entityId,
            tenantId,
          },
          include: {
            activities: {
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
          },
        })

        if (opportunity) {
          const daysSinceLastActivity = opportunity.activities[0]
            ? Math.floor((Date.now() - opportunity.activities[0].createdAt.getTime()) / (1000 * 60 * 60 * 24))
            : 999

          if (daysSinceLastActivity > 7) {
            actions.push({
              type: 'FOLLOW_UP',
              priority: 'HIGH',
              description: `Follow up on ${opportunity.name} - no activity in ${daysSinceLastActivity} days`,
              entityId: opportunity.id,
              entityType: 'opportunity',
            })
          }

          if (opportunity.stage === 'PROPOSAL' && opportunity.closeDate) {
            const daysUntilClose = Math.floor((opportunity.closeDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            if (daysUntilClose < 7) {
              actions.push({
                type: 'CLOSE_DEAL',
                priority: 'HIGH',
                description: `Close ${opportunity.name} - closing in ${daysUntilClose} days`,
                entityId: opportunity.id,
                entityType: 'opportunity',
              })
            }
          }
        }
      }

      // Get general recommendations
      const staleOpportunities = await prisma.salesOpportunity.findMany({
        where: {
          tenantId,
          ownerId: userId,
          stage: { notIn: ['WON', 'LOST'] },
          updatedAt: {
            lt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          },
        },
        take: args.limit || 5,
      })

      staleOpportunities.forEach(opp => {
        actions.push({
          type: 'FOLLOW_UP',
          priority: 'MEDIUM',
          description: `Follow up on ${opp.name} - no updates in 14+ days`,
          entityId: opp.id,
          entityType: 'opportunity',
        })
      })

      return {
        actions: actions.slice(0, args.limit || 5),
        count: actions.length,
      }
    },

    get_deal_risk: async (args: any) => {
      const opportunity = await prisma.salesOpportunity.findUnique({
        where: {
          id: args.opportunityId,
          tenantId,
        },
        include: {
          activities: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      })

      if (!opportunity) {
        return { error: 'Opportunity not found' }
      }

      const risks: string[] = []
      let riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW'

      // Check for no recent activity
      const lastActivity = opportunity.activities[0]
      if (lastActivity) {
        const daysSinceActivity = Math.floor((Date.now() - lastActivity.createdAt.getTime()) / (1000 * 60 * 60 * 24))
        if (daysSinceActivity > 14) {
          risks.push(`No activity in ${daysSinceActivity} days`)
          riskLevel = 'HIGH'
        } else if (daysSinceActivity > 7) {
          risks.push(`No activity in ${daysSinceActivity} days`)
          riskLevel = 'MEDIUM'
        }
      } else {
        risks.push('No activities recorded')
        riskLevel = 'MEDIUM'
      }

      // Check close date
      if (opportunity.closeDate) {
        const daysUntilClose = Math.floor((opportunity.closeDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        if (daysUntilClose < 0) {
          risks.push('Close date has passed')
          riskLevel = 'HIGH'
        } else if (daysUntilClose < 7) {
          risks.push(`Closing in ${daysUntilClose} days`)
          if (riskLevel === 'LOW') riskLevel = 'MEDIUM'
        }
      }

      // Check probability
      if (opportunity.probability && opportunity.probability < 30) {
        risks.push(`Low probability (${opportunity.probability}%)`)
        if (riskLevel === 'LOW') riskLevel = 'MEDIUM'
      }

      // Check stage progression
      if (opportunity.stage === 'PROSPECTING' && opportunity.createdAt) {
        const daysInStage = Math.floor((Date.now() - opportunity.createdAt.getTime()) / (1000 * 60 * 60 * 24))
        if (daysInStage > 30) {
          risks.push(`Stuck in ${opportunity.stage} stage for ${daysInStage} days`)
          if (riskLevel === 'LOW') riskLevel = 'MEDIUM'
        }
      }

      return {
        opportunityId: opportunity.id,
        opportunityName: opportunity.name,
        riskLevel,
        risks,
        recommendation: riskLevel === 'HIGH' 
          ? 'Immediate action required'
          : riskLevel === 'MEDIUM'
          ? 'Monitor closely'
          : 'Low risk, continue normal process',
      }
    },
  }
}

