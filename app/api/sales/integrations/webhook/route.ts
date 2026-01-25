import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { LeadSource } from '@prisma/client'
// Webhook secret verification (can use crypto if needed)

/**
 * Website Webhook Integration
 * Captures leads from website "Show Demo" or "Contact Us" buttons
 * 
 * Usage:
 * 1. Generate webhook URL in settings: /api/sales/integrations/webhook?tenantId=xxx&secret=xxx
 * 2. Add webhook URL to website buttons
 * 3. Website sends POST request with lead data
 */

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const secret = searchParams.get('secret')

    if (!tenantId || !secret) {
      return NextResponse.json(
        { error: 'Missing tenantId or secret' },
        { status: 400 }
      )
    }

    // Verify tenant exists and secret matches
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    })

    if (!tenant) {
      return NextResponse.json(
        { error: 'Invalid tenant' },
        { status: 401 }
      )
    }

    // Verify webhook secret (in production, store this securely)
    const expectedSecret = process.env.WEBHOOK_SECRET_PREFIX + tenantId
    if (secret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Invalid secret' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      firstName,
      lastName,
      email,
      phone,
      company,
      source, // 'WEBSITE_DEMO', 'WEBSITE_CONTACT', 'LINKEDIN_FORM', 'EVENT'
      campaign,
      pageUrl,
      referrer,
      metadata,
    } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check for duplicate lead
    const existingLead = await prisma.salesLead.findUnique({
      where: {
        tenantId_email: {
          tenantId,
          email,
        },
      },
    })

    if (existingLead) {
      // Update existing lead if new information
      const updatedLead = await prisma.salesLead.update({
        where: { id: existingLead.id },
        data: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(phone && { phone }),
          ...(company && { company }),
          ...(source && { leadSource: mapSourceToLeadSource(source) }),
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Lead updated',
        leadId: updatedLead.id,
      })
    }

    // Calculate lead score
    let score = 0
    if (company) score += 10
    if (phone) score += 5
    if (source === 'WEBSITE_DEMO') score += 15 // Demo requests are high intent
    if (source === 'WEBSITE_CONTACT') score += 10
    if (campaign) score += 5

    // Auto-assign based on rules (can be enhanced)
    const users = await prisma.user.findMany({
      where: {
        tenantId,
        role: {
          in: ['ORG_ADMIN', 'PROJECT_MANAGER', 'TEAM_MEMBER'],
        },
      },
    })

    // Simple round-robin assignment (can be enhanced with rules)
    const assignedToId = users.length > 0 
      ? users[Math.floor(Math.random() * users.length)].id
      : null

    // Create lead
    const lead = await prisma.salesLead.create({
      data: {
        tenantId,
        firstName: firstName || 'Unknown',
        lastName: lastName || '',
        email,
        phone: phone || null,
        company: company || null,
        leadSource: mapSourceToLeadSource(source || 'WEB_FORM'),
        status: 'NEW',
        rating: score >= 20 ? 'HOT' : score >= 10 ? 'WARM' : 'COLD',
        score,
        assignedToId,
        ownerId: assignedToId || users[0]?.id || '',
        description: metadata ? JSON.stringify(metadata) : null,
      },
    })

    // Trigger automation if enabled
    const { SalesAutomationEngine } = await import('@/lib/sales/automation-engine')
    await SalesAutomationEngine.trigger({
      tenantId,
      triggerType: 'LEAD_CREATED',
      data: { leadId: lead.id, lead },
    })

    return NextResponse.json({
      success: true,
      message: 'Lead created',
      leadId: lead.id,
    })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook', details: error.message },
      { status: 500 }
    )
  }
}

function mapSourceToLeadSource(source: string): LeadSource {
  const mapping: Record<string, LeadSource> = {
    WEBSITE_DEMO: LeadSource.WEB_FORM,
    WEBSITE_CONTACT: LeadSource.WEB_FORM,
    LINKEDIN_FORM: LeadSource.LINKEDIN,
    EVENT: LeadSource.EVENT,
    EMAIL: LeadSource.EMAIL,
  }
  return mapping[source] || LeadSource.OTHER
}

async function triggerAutomation(tenantId: string, triggerType: string, data: any) {
  try {
    const rules = await prisma.salesAutomationRule.findMany({
      where: {
        tenantId,
        triggerType: triggerType as any,
        isActive: true,
      },
      orderBy: {
        priority: 'desc',
      },
    })

    for (const rule of rules) {
      // Check trigger conditions
      const conditions = rule.triggerConditions as any
      if (evaluateConditions(conditions, data)) {
        await executeAutomationAction(rule, data)
      }
    }
  } catch (error) {
    console.error('Automation trigger error:', error)
  }
}

function evaluateConditions(conditions: any, data: any): boolean {
  // Simple condition evaluation (can be enhanced)
  if (!conditions || Object.keys(conditions).length === 0) {
    return true
  }
  // Add more sophisticated condition evaluation logic here
  return true
}

async function executeAutomationAction(rule: any, data: any) {
  const actionConfig = rule.actionConfig as any

  switch (rule.actionType) {
    case 'ASSIGN_LEAD':
      if (actionConfig.userId && data.leadId) {
        await prisma.salesLead.update({
          where: { id: data.leadId },
          data: { assignedToId: actionConfig.userId },
        })
      }
      break
    case 'CREATE_TASK':
      if (data.leadId) {
        await prisma.salesActivity.create({
          data: {
            tenantId: rule.tenantId,
            type: 'TASK',
            subject: actionConfig.subject || 'Follow up with lead',
            description: actionConfig.description || null,
            status: 'PLANNED',
            priority: actionConfig.priority || 'MEDIUM',
            leadId: data.leadId,
            assignedToId: actionConfig.assignedToId || rule.createdById,
            createdById: rule.createdById,
          },
        })
      }
      break
    case 'SEND_EMAIL':
      // Email sending will be implemented separately
      console.log('Email automation triggered:', actionConfig)
      break
    // Add more action types
  }
}

// GET endpoint to generate webhook URL
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.user.tenantId!
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const secret = process.env.WEBHOOK_SECRET_PREFIX + tenantId

    const webhookUrl = `${baseUrl}/api/sales/integrations/webhook?tenantId=${tenantId}&secret=${secret}`

    return NextResponse.json({
      webhookUrl,
      instructions: {
        step1: 'Copy the webhook URL above',
        step2: 'Add it to your website buttons (Show Demo, Contact Us)',
        step3: 'Send POST request with lead data: { firstName, lastName, email, phone, company, source, campaign }',
        example: {
          method: 'POST',
          url: webhookUrl,
          body: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: '+1234567890',
            company: 'Acme Corp',
            source: 'WEBSITE_DEMO',
            campaign: 'Q1-2024',
          },
        },
      },
    })
  } catch (error: any) {
    console.error('Error generating webhook URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate webhook URL', details: error.message },
      { status: 500 }
    )
  }
}

