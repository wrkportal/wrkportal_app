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
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

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
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        // Include the entire end date by setting to end of day
        const endDateTime = new Date(endDate)
        endDateTime.setHours(23, 59, 59, 999)
        where.createdAt.lte = endDateTime
      }
    }
    if (search) {
      // Search in standard fields - cast to text for better search
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { industry: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Fetch all leads matching the base criteria
    let leads = await prisma.salesLead.findMany({
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

    // Filter by custom fields if search term exists
    if (search) {
      const searchLower = search.toLowerCase()
      leads = leads.filter((lead) => {
        // Check if standard fields match (already done by Prisma, but double-check)
        const standardMatch =
          lead.firstName.toLowerCase().includes(searchLower) ||
          lead.lastName.toLowerCase().includes(searchLower) ||
          lead.email.toLowerCase().includes(searchLower) ||
          (lead.company && lead.company.toLowerCase().includes(searchLower)) ||
          (lead.phone && lead.phone.toLowerCase().includes(searchLower)) ||
          (lead.mobile && lead.mobile.toLowerCase().includes(searchLower)) ||
          (lead.title && lead.title.toLowerCase().includes(searchLower)) ||
          (lead.industry && lead.industry.toLowerCase().includes(searchLower)) ||
          (lead.description && lead.description.toLowerCase().includes(searchLower))

        // Check custom fields
        if (lead.customFields && typeof lead.customFields === 'object') {
          const customFields = lead.customFields as Record<string, any>
          const customMatch = Object.values(customFields).some((value) => {
            if (value === null || value === undefined) return false
            return String(value).toLowerCase().includes(searchLower)
          })

          if (customMatch) return true
        }

        return standardMatch
      })
    }

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

    // Import validation and duplicate detection services
    const { validateLead } = await import('@/lib/sales/data-validation')
    const { detectLeadDuplicates } = await import('@/lib/sales/duplicate-detection')

    // Validate lead data
    const validationResult = validateLead({
      firstName,
      lastName,
      email,
      phone,
      mobile,
      company,
      title,
      industry,
    })

    if (!validationResult.valid) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          errors: validationResult.errors,
          warnings: validationResult.warnings,
        },
        { status: 400 }
      )
    }

    // Use cleaned data from validation
    const cleanedData = validationResult.cleanedData || {}
    const cleanedEmail = cleanedData.email || email
    const cleanedPhone = cleanedData.phone || phone
    const cleanedMobile = cleanedData.mobile || mobile
    const cleanedFirstName = cleanedData.firstName || firstName
    const cleanedLastName = cleanedData.lastName || lastName

    // Check for duplicates before creating
    // First, create a temporary lead ID for duplicate detection
    // We'll check by email, name+company, and phone
    const potentialDuplicates: any[] = []

    // Check by email
    const existingByEmail = await prisma.salesLead.findUnique({
      where: {
        tenantId_email: {
          tenantId: session.user.tenantId!,
          email: cleanedEmail,
        },
      },
    })

    if (existingByEmail) {
      potentialDuplicates.push({
        id: existingByEmail.id,
        matchScore: 100,
        matchedFields: ['email'],
        reason: 'Lead with this email already exists',
      })
    }

    // Check by name and company
    if (cleanedFirstName && cleanedLastName && company) {
      const existingByNameCompany = await prisma.salesLead.findFirst({
        where: {
          tenantId: session.user.tenantId!,
          firstName: cleanedFirstName,
          lastName: cleanedLastName,
          company: company,
        },
      })

      if (existingByNameCompany && existingByNameCompany.id !== existingByEmail?.id) {
        potentialDuplicates.push({
          id: existingByNameCompany.id,
          matchScore: 85,
          matchedFields: ['firstName', 'lastName', 'company'],
          reason: 'Lead with same name and company exists',
        })
      }
    }

    // Check by phone
    if (cleanedPhone || cleanedMobile) {
      const phoneToCheck = cleanedPhone || cleanedMobile
      const existingByPhone = await prisma.salesLead.findFirst({
        where: {
          tenantId: session.user.tenantId!,
          OR: [
            { phone: phoneToCheck },
            { mobile: phoneToCheck },
          ],
        },
      })

      if (existingByPhone && !potentialDuplicates.find(d => d.id === existingByPhone.id)) {
        potentialDuplicates.push({
          id: existingByPhone.id,
          matchScore: 70,
          matchedFields: ['phone'],
          reason: 'Lead with same phone number exists',
        })
      }
    }

    // If duplicates found, return them (client can decide to proceed or merge)
    if (potentialDuplicates.length > 0) {
      return NextResponse.json(
        {
          error: 'Potential duplicates found',
          duplicates: potentialDuplicates,
          warnings: validationResult.warnings,
        },
        { status: 409 } // Conflict status code
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

    // Create lead with cleaned data
    const lead = await prisma.salesLead.create({
      data: {
        tenantId: session.user.tenantId!,
        firstName: cleanedFirstName,
        lastName: cleanedLastName,
        email: cleanedEmail,
        company,
        phone: cleanedPhone,
        mobile: cleanedMobile,
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

