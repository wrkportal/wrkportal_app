import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { SalesAutomationEngine } from '@/lib/sales/automation-engine'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const assignedToId = searchParams.get('assignedToId')
    const leadSource = searchParams.get('leadSource')
    const search = searchParams.get('search')

    const where: any = {
      tenantId: session.user.tenantId!,
    }

    if (status) {
      where.status = status
    }
    if (assignedToId) {
      where.assignedToId = assignedToId
    }
    if (leadSource) {
      where.leadSource = leadSource
    }
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ]
    }

    const leads = await prisma.salesLead.findMany({
      where,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(leads)
  } catch (error: any) {
    console.error('Error fetching leads:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leads', details: error.message },
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
    const {
      firstName,
      lastName,
      email,
      company,
      phone,
      mobile,
      title,
      industry,
      leadSource,
      description,
      assignedToId,
      status,
      rating,
      expectedRevenue,
      location,
    } = body

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'First name, last name, and email are required' },
        { status: 400 }
      )
    }

    // Check for duplicate email
    const existingLead = await prisma.salesLead.findUnique({
      where: {
        tenantId_email: {
          tenantId: session.user.tenantId!,
          email,
        },
      },
    })

    if (existingLead) {
      return NextResponse.json(
        { error: 'Lead with this email already exists' },
        { status: 400 }
      )
    }

    // Calculate initial lead score
    let score = 0
    if (company) score += 10
    if (phone || mobile) score += 5
    if (title) score += 5
    if (industry) score += 5
    if (expectedRevenue) score += 10 // Higher score for leads with expected revenue
    
    // Append location and expected revenue to description if provided (since they're not in schema)
    let finalDescription = description || ''
    if (location || expectedRevenue) {
      const additionalInfo = []
      if (location) additionalInfo.push(`Location: ${location}`)
      if (expectedRevenue) additionalInfo.push(`Expected Revenue: ${expectedRevenue}`)
      finalDescription = finalDescription 
        ? `${finalDescription}\n\n${additionalInfo.join('\n')}`
        : additionalInfo.join('\n')
    }

    // Auto-assign based on rules (can be enhanced with automation rules)
    const finalAssignedToId = assignedToId || session.user.id

    // Use provided status/rating or calculate defaults
    const finalStatus = status || 'NEW'
    const finalRating = rating || (score >= 20 ? 'HOT' : score >= 10 ? 'WARM' : 'COLD')

    // Create lead
    const lead = await prisma.salesLead.create({
      data: {
        tenantId: session.user.tenantId!,
        firstName,
        lastName,
        email,
        company,
        phone,
        mobile,
        title,
        industry,
        leadSource: leadSource || 'OTHER',
        description: finalDescription,
        assignedToId: finalAssignedToId,
        ownerId: session.user.id,
        score,
        status: finalStatus,
        rating: finalRating,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Trigger automation
    await SalesAutomationEngine.trigger({
      tenantId: session.user.tenantId!,
      triggerType: 'LEAD_CREATED',
      data: { leadId: lead.id, lead },
    })

    return NextResponse.json(lead, { status: 201 })
  } catch (error: any) {
    console.error('Error creating lead:', error)
    return NextResponse.json(
      { error: 'Failed to create lead', details: error.message },
      { status: 500 }
    )
  }
}

