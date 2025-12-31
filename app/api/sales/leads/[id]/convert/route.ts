import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { AutoActivityCapture } from '@/lib/sales/auto-activity-capture'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { convertTo, accountId, opportunityData } = body

    const lead = await prisma.salesLead.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId!,
      },
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    if (lead.status === 'CONVERTED') {
      return NextResponse.json(
        { error: 'Lead already converted' },
        { status: 400 }
      )
    }

    // Convert lead to contact
    if (convertTo === 'contact' || convertTo === 'both') {
      let contact
      
      // Check if contact with same email already exists (only if email is provided)
      if (lead.email) {
        const existingContact = await prisma.salesContact.findFirst({
          where: {
            tenantId: session.user.tenantId!,
            email: lead.email,
          },
        })

        if (existingContact) {
          // Use existing contact instead of creating a new one
          console.log('Using existing contact:', { contactId: existingContact.id, email: lead.email })
          contact = existingContact
          
          // Update the existing contact to link it to this lead if not already linked
          if (!existingContact.convertedFromLeadId) {
            await prisma.salesContact.update({
              where: { id: existingContact.id },
              data: {
                convertedFromLeadId: lead.id,
              },
            })
          }
        }
      }

      // Create new contact only if one doesn't exist
      if (!contact) {
        // Validate accountId if provided
        if (accountId) {
          const account = await prisma.salesAccount.findFirst({
            where: {
              id: accountId,
              tenantId: session.user.tenantId!,
            },
          })
          if (!account) {
            return NextResponse.json(
              { error: 'Account not found' },
              { status: 404 }
            )
          }
        }

        contact = await prisma.salesContact.create({
          data: {
            tenantId: session.user.tenantId!,
            firstName: lead.firstName,
            lastName: lead.lastName,
            email: lead.email || null,
            phone: lead.phone || null,
            mobile: lead.mobile || null,
            title: lead.title || null,
            leadSource: lead.leadSource,
            ownerId: lead.assignedToId || lead.ownerId,
            accountId: accountId || null,
            convertedFromLeadId: lead.id,
            status: 'ACTIVE',
          },
        })
      }

      // Update lead status (relation is already established via convertedFromLeadId on contact)
      await prisma.salesLead.update({
        where: { id: lead.id },
        data: {
          status: 'CONVERTED',
          convertedAt: new Date(),
        },
      })

      // Auto-capture activity for lead conversion to contact (if not converting to opportunity)
      // If converting to both, we'll capture it after opportunity is created
      
      // Convert to opportunity if requested
      if (convertTo === 'both' && opportunityData) {
        const opportunity = await prisma.salesOpportunity.create({
          data: {
            tenantId: session.user.tenantId!,
            accountId: accountId || null,
            name: opportunityData.name || `${lead.firstName} ${lead.lastName} - Opportunity`,
            description: opportunityData.description,
            stage: 'PROSPECTING',
            amount: opportunityData.amount || 0,
            probability: opportunityData.probability || 10,
            expectedCloseDate: new Date(opportunityData.expectedCloseDate),
            leadSource: lead.leadSource,
            ownerId: lead.assignedToId || lead.ownerId,
            createdById: session.user.id,
            convertedFromLeadId: lead.id,
          },
        })

        // Link contact to opportunity
        await prisma.salesOpportunityContact.create({
          data: {
            opportunityId: opportunity.id,
            contactId: contact.id,
            role: 'DECISION_MAKER',
            isPrimary: true,
          },
        })

        // Relation is already established via convertedFromLeadId on opportunity
        // No need to update the lead again as status is already CONVERTED

        // Auto-capture activity for lead conversion
        await AutoActivityCapture.capture({
          tenantId: session.user.tenantId!,
          userId: session.user.id,
          type: 'LEAD_CONVERTED',
          data: {
            leadId: lead.id,
            opportunityId: opportunity.id,
            lead,
            opportunity,
          },
        })

        return NextResponse.json({
          lead,
          contact,
          opportunity,
        })
      }

      // Auto-capture activity for lead conversion to contact only
      await AutoActivityCapture.capture({
        tenantId: session.user.tenantId!,
        userId: session.user.id,
        type: 'LEAD_CONVERTED',
        data: {
          leadId: lead.id,
          contactId: contact.id,
          lead,
          contact,
        },
      })

      return NextResponse.json({
        lead,
        contact,
      })
    }

    // Convert directly to opportunity
    if (convertTo === 'opportunity' && opportunityData) {
      const opportunity = await prisma.salesOpportunity.create({
        data: {
          tenantId: session.user.tenantId!,
          accountId: accountId || null,
          name: opportunityData.name || `${lead.firstName} ${lead.lastName} - Opportunity`,
          description: opportunityData.description,
          stage: 'PROSPECTING',
          amount: opportunityData.amount || 0,
          probability: opportunityData.probability || 10,
          expectedCloseDate: new Date(opportunityData.expectedCloseDate),
          leadSource: lead.leadSource,
          ownerId: lead.assignedToId || lead.ownerId,
          createdById: session.user.id,
          convertedFromLeadId: lead.id,
        },
      })

      // Update lead status (relation is already established via convertedFromLeadId on opportunity)
      await prisma.salesLead.update({
        where: { id: lead.id },
        data: {
          status: 'CONVERTED',
          convertedAt: new Date(),
        },
      })

      // Auto-capture activity for lead conversion to opportunity
      await AutoActivityCapture.capture({
        tenantId: session.user.tenantId!,
        userId: session.user.id,
        type: 'LEAD_CONVERTED',
        data: {
          leadId: lead.id,
          opportunityId: opportunity.id,
          lead,
          opportunity,
        },
      })

      return NextResponse.json({
        lead,
        opportunity,
      })
    }

    return NextResponse.json(
      { error: 'Invalid conversion type' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Error converting lead:', error)
    
    // Provide more specific error messages
    let errorMessage = 'Failed to convert lead'
    if (error.code === 'P2002') {
      errorMessage = 'A record with this information already exists (duplicate email or unique constraint violation)'
    } else if (error.code === 'P2003') {
      errorMessage = 'Invalid reference to related record (account or user not found)'
    } else if (error.code === 'P2025') {
      errorMessage = 'Record not found'
    } else if (error.message) {
      errorMessage = error.message
    }
    
    return NextResponse.json(
      { error: errorMessage, details: error.code || 'Unknown error', fullError: process.env.NODE_ENV === 'development' ? error.stack : undefined },
      { status: 500 }
    )
  }
}

