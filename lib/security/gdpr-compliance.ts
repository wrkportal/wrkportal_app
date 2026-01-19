/**
 * GDPR Compliance Service
 * 
 * Implements GDPR requirements:
 * - Right to access (data export)
 * - Right to deletion (data erasure)
 * - Right to data portability
 * - Consent management
 */

import { prisma } from '@/lib/prisma'
import { AuditAction } from '@prisma/client'

export interface GDPRRequest {
  type: 'access' | 'deletion' | 'portability'
  email: string
  tenantId: string
  requestedBy?: string // User ID who made the request
  verified?: boolean
}

export interface DataExport {
  contacts: any[]
  leads: any[]
  opportunities: any[]
  accounts: any[]
  activities: any[]
  quotes: any[]
  orders: any[]
  invoices: any[]
}

/**
 * Export all personal data for a contact/lead (GDPR Right to Access)
 */
export async function exportPersonalData(
  email: string,
  tenantId: string
): Promise<DataExport> {
  // Find all records associated with this email
  const contacts = await prisma.salesContact.findMany({
    where: {
      tenantId,
      OR: [
        { email },
        { personalEmail: email }
      ]
    },
    include: {
      account: true,
      activities: true,
      opportunities: true
    }
  })
  
  const leads = await prisma.salesLead.findMany({
    where: {
      tenantId,
      email
    },
    include: {
      activities: true
    }
  })
  
  // Get related opportunities
  const contactIds = contacts.map(c => c.id)
  const opportunities = await prisma.salesOpportunity.findMany({
    where: {
      tenantId,
      OR: [
        { contacts: { some: { contactId: { in: contactIds } } } },
        { account: { contacts: { some: { id: { in: contactIds } } } } }
      ]
    },
    include: {
      account: true,
      contacts: {
        include: {
          contact: true
        }
      },
      activities: true,
      quotes: true,
      orders: true
    }
  })
  
  // Get accounts
  const accountIds = contacts.map(c => c.accountId).filter(Boolean) as string[]
  const accounts = await prisma.salesAccount.findMany({
    where: {
      tenantId,
      id: { in: accountIds }
    },
    include: {
      contacts: true,
      opportunities: true
    }
  })
  
  // Get all activities
  const activityIds = [
    ...contacts.flatMap(c => c.activities.map(a => a.id)),
    ...leads.flatMap(l => l.activities.map(a => a.id)),
    ...opportunities.flatMap(o => o.activities.map(a => a.id))
  ]
  const activities = await prisma.salesActivity.findMany({
    where: {
      tenantId,
      id: { in: activityIds }
    }
  })
  
  // Get quotes and orders
  const opportunityIds = opportunities.map(o => o.id)
  const quotes = await prisma.salesQuote.findMany({
    where: {
      tenantId,
      opportunityId: { in: opportunityIds }
    }
  })
  
  const orders = await prisma.salesOrder.findMany({
    where: {
      tenantId,
      opportunityId: { in: opportunityIds }
    }
  })
  
  // Get invoices
  const orderIds = orders.map(o => o.id)
  const invoices = await prisma.invoice.findMany({
    where: {
      tenantId,
      orderId: { in: orderIds }
    }
  })
  
  return {
    contacts,
    leads,
    opportunities,
    accounts,
    activities,
    quotes,
    orders,
    invoices
  }
}

/**
 * Delete all personal data for a contact/lead (GDPR Right to Deletion)
 */
export async function deletePersonalData(
  email: string,
  tenantId: string
): Promise<{ deleted: number; errors: string[] }> {
  const errors: string[] = []
  let deleted = 0
  
  try {
    // Find contacts
    const contacts = await prisma.salesContact.findMany({
      where: {
        tenantId,
        OR: [
          { email },
          { personalEmail: email }
        ]
      }
    })
    
    // Find leads
    const leads = await prisma.salesLead.findMany({
      where: {
        tenantId,
        email
      }
    })
    
    // Delete activities first (foreign key constraints)
    const contactIds = contacts.map(c => c.id)
    const leadIds = leads.map(l => l.id)
    
    const activities = await prisma.salesActivity.deleteMany({
      where: {
        tenantId,
        OR: [
          { contactId: { in: contactIds } },
          { leadId: { in: leadIds } }
        ]
      }
    })
    deleted += activities.count
    
    // Delete contact-opportunity relationships
    await prisma.salesOpportunityContact.deleteMany({
      where: {
        contactId: { in: contactIds }
      }
    })
    
    // Delete contacts
    const deletedContacts = await prisma.salesContact.deleteMany({
      where: {
        id: { in: contactIds }
      }
    })
    deleted += deletedContacts.count
    
    // Delete leads
    const deletedLeads = await prisma.salesLead.deleteMany({
      where: {
        id: { in: leadIds }
      }
    })
    deleted += deletedLeads.count
    
    // Log deletion
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: 'system',
        action: AuditAction.DELETE,
        entity: 'GDPR_DELETION',
        entityName: `GDPR deletion request for ${email}`,
        changes: JSON.stringify({
          email,
          contactsDeleted: deletedContacts.count,
          leadsDeleted: deletedLeads.count,
          activitiesDeleted: activities.count
        })
      }
    })
    
  } catch (error: any) {
    errors.push(error.message || 'Unknown error during deletion')
  }
  
  return { deleted, errors }
}

/**
 * Create GDPR request record
 */
export async function createGDPRRequest(
  request: GDPRRequest
): Promise<string> {
  // Store request in audit log
  const auditLog = await prisma.auditLog.create({
    data: {
      tenantId: request.tenantId,
      userId: request.requestedBy || 'system',
      action: AuditAction.CREATE,
      entity: 'GDPR_REQUEST',
      entityName: `GDPR ${request.type} request for ${request.email}`,
      changes: JSON.stringify({
        type: request.type,
        email: request.email,
        verified: request.verified || false,
        requestedAt: new Date().toISOString()
      })
    }
  })
  
  return auditLog.id
}

/**
 * Verify GDPR request (e.g., via email verification)
 */
export async function verifyGDPRRequest(
  requestId: string,
  tenantId: string
): Promise<void> {
  const auditLog = await prisma.auditLog.findUnique({
    where: { id: requestId }
  })
  
  if (!auditLog || auditLog.tenantId !== tenantId) {
    throw new Error('Request not found')
  }
  
  const changes = JSON.parse(auditLog.changes as string || '{}')
  changes.verified = true
  changes.verifiedAt = new Date().toISOString()
  
  await prisma.auditLog.update({
    where: { id: requestId },
    data: {
      changes: JSON.stringify(changes)
    }
  })
}

/**
 * Get consent status for a contact
 */
export async function getConsentStatus(
  contactId: string,
  tenantId: string
): Promise<{
  marketing: boolean
  communications: boolean
  dataProcessing: boolean
  lastUpdated?: Date
}> {
  const contact = await prisma.salesContact.findUnique({
    where: { id: contactId },
    select: { customFields: true }
  })
  
  if (!contact) {
    throw new Error('Contact not found')
  }
  
  const customFields = (contact.customFields as any) || {}
  const consent = customFields.consent || {}
  
  return {
    marketing: consent.marketing || false,
    communications: consent.communications || false,
    dataProcessing: consent.dataProcessing || false,
    lastUpdated: consent.lastUpdated ? new Date(consent.lastUpdated) : undefined
  }
}

/**
 * Update consent status for a contact
 */
export async function updateConsent(
  contactId: string,
  tenantId: string,
  consent: {
    marketing?: boolean
    communications?: boolean
    dataProcessing?: boolean
  }
): Promise<void> {
  const contact = await prisma.salesContact.findUnique({
    where: { id: contactId },
    select: { customFields: true }
  })
  
  if (!contact) {
    throw new Error('Contact not found')
  }
  
  const customFields = (contact.customFields as any) || {}
  customFields.consent = {
    ...(customFields.consent || {}),
    ...consent,
    lastUpdated: new Date().toISOString()
  }
  
  await prisma.salesContact.update({
    where: { id: contactId },
    data: { customFields }
  })
  
  // Log consent update
  await prisma.auditLog.create({
    data: {
      tenantId,
      userId: 'system',
      action: AuditAction.UPDATE,
      entity: 'CONSENT',
      entityId: contactId,
      entityName: `Consent updated for contact ${contactId}`,
      changes: JSON.stringify(consent)
    }
  })
}

