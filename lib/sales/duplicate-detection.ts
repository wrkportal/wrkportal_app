/**
 * Duplicate Detection Service
 * 
 * Detects duplicate leads, contacts, and accounts
 */

import { prisma } from '@/lib/prisma'

export interface DuplicateMatch {
  entityId: string
  entityType: 'lead' | 'contact' | 'account'
  matchScore: number // 0-100
  matchedFields: string[]
  reason: string
}

export interface DuplicateDetectionResult {
  entityId: string
  entityType: 'lead' | 'contact' | 'account'
  duplicates: DuplicateMatch[]
}

/**
 * Detect duplicates for a lead
 */
export async function detectLeadDuplicates(
  leadId: string,
  tenantId: string
): Promise<DuplicateMatch[]> {
  const lead = await prisma.salesLead.findUnique({
    where: { id: leadId },
  })

  if (!lead) {
    return []
  }

  const duplicates: DuplicateMatch[] = []

  // Find leads with same email
  if (lead.email) {
    const emailMatches = await prisma.salesLead.findMany({
      where: {
        tenantId,
        email: lead.email,
        id: { not: leadId },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        company: true,
        email: true,
      },
    })

    for (const match of emailMatches) {
      duplicates.push({
        entityId: match.id,
        entityType: 'lead',
        matchScore: calculateEmailMatchScore(lead, match),
        matchedFields: ['email'],
        reason: 'Same email address',
      })
    }
  }

  // Find leads with same name and company
  if (lead.firstName && lead.lastName && lead.company) {
    const nameCompanyMatches = await prisma.salesLead.findMany({
      where: {
        tenantId,
        firstName: lead.firstName,
        lastName: lead.lastName,
        company: lead.company,
        id: { not: leadId },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        company: true,
        email: true,
      },
    })

    for (const match of nameCompanyMatches) {
      if (!duplicates.find(d => d.entityId === match.id)) {
        duplicates.push({
          entityId: match.id,
          entityType: 'lead',
          matchScore: 85,
          matchedFields: ['firstName', 'lastName', 'company'],
          reason: 'Same name and company',
        })
      }
    }
  }

  // Find leads with same phone
  if (lead.phone) {
    const phoneMatches = await prisma.salesLead.findMany({
      where: {
        tenantId,
        OR: [
          { phone: lead.phone },
          { mobile: lead.phone },
        ],
        id: { not: leadId },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        mobile: true,
      },
    })

    for (const match of phoneMatches) {
      if (!duplicates.find(d => d.entityId === match.id)) {
        duplicates.push({
          entityId: match.id,
          entityType: 'lead',
          matchScore: 75,
          matchedFields: ['phone'],
          reason: 'Same phone number',
        })
      }
    }
  }

  // Also check contacts
  if (lead.email) {
    const contactMatches = await prisma.salesContact.findMany({
      where: {
        tenantId,
        OR: [
          { email: lead.email },
          { personalEmail: lead.email } as any,
        ] as any,
      } as any,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        account: {
          select: {
            name: true,
          },
        },
      },
    })

    for (const match of contactMatches) {
      duplicates.push({
        entityId: match.id,
        entityType: 'contact',
        matchScore: 90,
        matchedFields: ['email'],
        reason: 'Contact with same email exists',
      })
    }
  }

  // Sort by match score descending
  return duplicates.sort((a, b) => b.matchScore - a.matchScore)
}

/**
 * Detect duplicates for a contact
 */
export async function detectContactDuplicates(
  contactId: string,
  tenantId: string
): Promise<DuplicateMatch[]> {
  const contact = await prisma.salesContact.findUnique({
    where: { id: contactId },
    include: {
      account: {
        select: {
          name: true,
        },
      },
    },
  })

  if (!contact) {
    return []
  }

  const duplicates: DuplicateMatch[] = []

  // Find contacts with same email
  const emails = [contact.email, (contact as any).personalEmail].filter(Boolean) as string[]
  for (const email of emails) {
    const emailMatches = await prisma.salesContact.findMany({
      where: {
        tenantId,
        OR: [
          { email },
          { personalEmail: email } as any,
        ] as any,
        id: { not: contactId },
      } as any,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        personalEmail: true,
      } as any,
    })

    for (const match of emailMatches) {
      if (!duplicates.find(d => d.entityId === match.id)) {
        duplicates.push({
          entityId: match.id,
          entityType: 'contact',
          matchScore: 95,
          matchedFields: ['email'],
          reason: 'Same email address',
        })
      }
    }
  }

  // Find contacts with same name and account
  if (contact.firstName && contact.lastName && contact.accountId) {
    const nameAccountMatches = await prisma.salesContact.findMany({
      where: {
        tenantId,
        firstName: contact.firstName,
        lastName: contact.lastName,
        accountId: contact.accountId,
        id: { not: contactId },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    })

    for (const match of nameAccountMatches) {
      if (!duplicates.find(d => d.entityId === match.id)) {
        duplicates.push({
          entityId: match.id,
          entityType: 'contact',
          matchScore: 90,
          matchedFields: ['firstName', 'lastName', 'accountId'],
          reason: 'Same name and account',
        })
      }
    }
  }

  return duplicates.sort((a, b) => b.matchScore - a.matchScore)
}

/**
 * Detect duplicates for an account
 */
export async function detectAccountDuplicates(
  accountId: string,
  tenantId: string
): Promise<DuplicateMatch[]> {
  const account = await prisma.salesAccount.findUnique({
    where: { id: accountId },
  })

  if (!account) {
    return []
  }

  const duplicates: DuplicateMatch[] = []

  // Find accounts with same name
  if (account.name) {
    const nameMatches = await prisma.salesAccount.findMany({
      where: {
        tenantId,
        name: {
          contains: account.name,
          mode: 'insensitive',
        },
        id: { not: accountId },
      },
      select: {
        id: true,
        name: true,
        website: true,
      },
    })

    for (const match of nameMatches) {
      const score = match.name.toLowerCase() === account.name.toLowerCase() ? 95 : 70
      duplicates.push({
        entityId: match.id,
        entityType: 'account',
        matchScore: score,
        matchedFields: ['name'],
        reason: score > 90 ? 'Exact name match' : 'Similar name',
      })
    }
  }

  // Find accounts with same website
  if (account.website) {
    const websiteMatches = await prisma.salesAccount.findMany({
      where: {
        tenantId,
        website: account.website,
        id: { not: accountId },
      },
      select: {
        id: true,
        name: true,
        website: true,
      },
    })

    for (const match of websiteMatches) {
      if (!duplicates.find(d => d.entityId === match.id)) {
        duplicates.push({
          entityId: match.id,
          entityType: 'account',
          matchScore: 95,
          matchedFields: ['website'],
          reason: 'Same website',
        })
      }
    }
  }

  return duplicates.sort((a, b) => b.matchScore - a.matchScore)
}

/**
 * Merge duplicate entities
 */
export async function mergeDuplicates(
  sourceId: string,
  targetId: string,
  entityType: 'lead' | 'contact' | 'account',
  tenantId: string
): Promise<void> {
  if (entityType === 'lead') {
    // Merge leads: keep target, update source's relationships to point to target
    const source = await prisma.salesLead.findUnique({
      where: { id: sourceId },
    })

    if (!source) {
      throw new Error('Source lead not found')
    }

    // Update activities to point to target
    await prisma.salesActivity.updateMany({
      where: {
        tenantId,
        leadId: sourceId,
      },
      data: {
        leadId: targetId,
      },
    })

    // Delete source lead
    await prisma.salesLead.delete({
      where: { id: sourceId },
    })
  } else if (entityType === 'contact') {
    // Similar merge logic for contacts
    await prisma.salesActivity.updateMany({
      where: {
        tenantId,
        contactId: sourceId,
      },
      data: {
        contactId: targetId,
      },
    })

    await prisma.salesContact.delete({
      where: { id: sourceId },
    })
  } else if (entityType === 'account') {
    // Merge accounts: move contacts and opportunities to target
    await prisma.salesContact.updateMany({
      where: {
        tenantId,
        accountId: sourceId,
      },
      data: {
        accountId: targetId,
      },
    })

    await prisma.salesOpportunity.updateMany({
      where: {
        tenantId,
        accountId: sourceId,
      },
      data: {
        accountId: targetId,
      },
    })

    await prisma.salesAccount.delete({
      where: { id: sourceId },
    })
  }
}

/**
 * Calculate email match score
 */
function calculateEmailMatchScore(lead1: any, lead2: any): number {
  let score = 90 // Base score for email match

  // Bonus for name match
  if (lead1.firstName === lead2.firstName && lead1.lastName === lead2.lastName) {
    score += 5
  }

  // Bonus for company match
  if (lead1.company && lead2.company && lead1.company === lead2.company) {
    score += 5
  }

  return Math.min(100, score)
}

