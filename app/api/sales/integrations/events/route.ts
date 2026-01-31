import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { SalesAutomationEngine } from '@/lib/sales/automation-engine'

/**
 * Event Registration Sync Integration
 * Captures leads from event registrations
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
      eventName,
      eventDate,
      eventLocation,
      registrationDate,
      ticketType,
      metadata,
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
      // Update existing lead
      const updatedLead = await prisma.salesLead.update({
        where: { id: existingLead.id },
        data: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(phone && { phone }),
          ...(company && { company }),
          ...(jobTitle && { title: jobTitle }),
        },
      })

      // Create activity for event registration
      await prisma.salesActivity.create({
        data: {
          tenantId,
          type: 'EVENT',
          subject: `Registered for ${eventName || 'Event'}`,
          description: `Event: ${eventName}\nDate: ${eventDate}\nLocation: ${eventLocation}\nTicket Type: ${ticketType || 'Standard'}`,
          status: 'COMPLETED',
          completedDate: registrationDate ? new Date(registrationDate) : new Date(),
          leadId: existingLead.id,
          assignedToId: existingLead.assignedToId || existingLead.ownerId,
          createdById: existingLead.ownerId,
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Lead updated with event registration',
        leadId: updatedLead.id,
      })
    }

    // Calculate lead score
    let score = 15 // Base score for event registrations (high intent)
    if (company) score += 10
    if (phone) score += 5
    if (jobTitle) score += 5
    if (ticketType === 'VIP' || ticketType === 'Premium') score += 10

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
        leadSource: 'EVENT',
        status: 'NEW',
        rating: score >= 25 ? 'HOT' : score >= 15 ? 'WARM' : 'COLD',
        score,
        assignedToId,
        ownerId: assignedToId || users[0]?.id || '',
        description: `Event registration: ${eventName || 'Unknown Event'}${eventDate ? ` on ${eventDate}` : ''}`,
      },
    })

    // Create activity for event registration
    await prisma.salesActivity.create({
      data: {
        tenantId,
        type: 'EVENT',
        subject: `Registered for ${eventName || 'Event'}`,
        description: `Event: ${eventName}\nDate: ${eventDate}\nLocation: ${eventLocation}\nTicket Type: ${ticketType || 'Standard'}`,
        status: 'COMPLETED',
        completedDate: registrationDate ? new Date(registrationDate) : new Date(),
        leadId: lead.id,
        assignedToId: assignedToId || users[0]?.id || lead.ownerId,
        createdById: assignedToId || users[0]?.id || lead.ownerId,
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
      message: 'Lead created from event registration',
      leadId: lead.id,
    })
  } catch (error: any) {
    console.error('Event integration error:', error)
    return NextResponse.json(
      { error: 'Failed to process event registration', details: error.message },
      { status: 500 }
    )
  }
}

// GET endpoint to get event webhook URL
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.user.tenantId!
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const secret = process.env.WEBHOOK_SECRET_PREFIX + tenantId

    const webhookUrl = `${baseUrl}/api/sales/integrations/events?tenantId=${tenantId}&secret=${secret}`

    return NextResponse.json({
      webhookUrl,
      instructions: {
        step1: 'Copy the webhook URL above',
        step2: 'Configure your event platform (Eventbrite, Zoom, etc.) to send POST requests',
        step3: 'Send registration data: { firstName, lastName, email, phone, company, jobTitle, eventName, eventDate, eventLocation, registrationDate, ticketType }',
      },
    })
  } catch (error: any) {
    console.error('Error generating event webhook URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate webhook URL', details: error.message },
      { status: 500 }
    )
  }
}

