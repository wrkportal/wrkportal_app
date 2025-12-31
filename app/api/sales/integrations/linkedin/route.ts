import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { SalesAutomationEngine } from '@/lib/sales/automation-engine'

/**
 * LinkedIn Form Integration
 * Captures leads from LinkedIn form submissions
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

    // Verify tenant and secret
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    })

    if (!tenant) {
      return NextResponse.json(
        { error: 'Invalid tenant' },
        { status: 401 }
      )
    }

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
      jobTitle,
      campaign,
      formId,
      submissionId,
    } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check for duplicate
    const existingLead = await prisma.salesLead.findUnique({
      where: {
        tenantId_email: {
          tenantId,
          email,
        },
      },
    })

    if (existingLead) {
      return NextResponse.json({
        success: true,
        message: 'Lead already exists',
        leadId: existingLead.id,
      })
    }

    // Calculate lead score
    let score = 10 // Base score for LinkedIn leads (higher intent)
    if (company) score += 10
    if (phone) score += 5
    if (jobTitle) score += 5
    if (campaign) score += 5

    // Auto-assign
    const users = await prisma.user.findMany({
      where: {
        tenantId,
        role: {
          in: ['ORG_ADMIN', 'PROJECT_MANAGER', 'TEAM_MEMBER'],
        },
      },
    })

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
        title: jobTitle || null,
        leadSource: 'LINKEDIN',
        status: 'NEW',
        rating: score >= 20 ? 'HOT' : score >= 10 ? 'WARM' : 'COLD',
        score,
        assignedToId,
        ownerId: assignedToId || users[0]?.id || '',
        description: `LinkedIn form submission${campaign ? ` - Campaign: ${campaign}` : ''}`,
      },
    })

    // Trigger automation
    await SalesAutomationEngine.trigger({
      tenantId,
      triggerType: 'LEAD_CREATED',
      data: { leadId: lead.id, lead },
    })

    return NextResponse.json({
      success: true,
      message: 'Lead created from LinkedIn',
      leadId: lead.id,
    })
  } catch (error: any) {
    console.error('LinkedIn integration error:', error)
    return NextResponse.json(
      { error: 'Failed to process LinkedIn submission', details: error.message },
      { status: 500 }
    )
  }
}

// GET endpoint to get LinkedIn webhook URL
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.user.tenantId!
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const secret = process.env.WEBHOOK_SECRET_PREFIX + tenantId

    const webhookUrl = `${baseUrl}/api/sales/integrations/linkedin?tenantId=${tenantId}&secret=${secret}`

    return NextResponse.json({
      webhookUrl,
      instructions: {
        step1: 'Copy the webhook URL above',
        step2: 'Configure LinkedIn Lead Gen Forms to send POST requests to this URL',
        step3: 'LinkedIn will send: { firstName, lastName, email, phone, company, jobTitle, campaign, formId, submissionId }',
      },
    })
  } catch (error: any) {
    console.error('Error generating LinkedIn webhook URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate webhook URL', details: error.message },
      { status: 500 }
    )
  }
}

