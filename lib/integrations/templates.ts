/**
 * Phase 5.2: Integration Templates
 * 
 * Pre-configured templates for common integration use cases
 */

import { prisma } from '@/lib/prisma'
import { IntegrationType } from '@prisma/client'

// Fallback IntegrationType enum if Prisma client doesn't have it yet
const IntegrationTypeFallback = {
  SALESFORCE: 'SALESFORCE',
  HUBSPOT: 'HUBSPOT',
  QUICKBOOKS: 'QUICKBOOKS',
  STRIPE: 'STRIPE',
  GOOGLE_ANALYTICS: 'GOOGLE_ANALYTICS',
  ZENDESK: 'ZENDESK',
  JIRA: 'JIRA',
  MAILCHIMP: 'MAILCHIMP',
  SHOPIFY: 'SHOPIFY',
  SLACK: 'SLACK',
  MICROSOFT_TEAMS: 'MICROSOFT_TEAMS',
  CUSTOM: 'CUSTOM',
} as const

// Use fallback if IntegrationType enum is not available
const IntegrationTypeEnum = (IntegrationType || IntegrationTypeFallback) as typeof IntegrationTypeFallback

export interface TemplateConfiguration {
  name: string
  description: string
  category: string
  integrationType: typeof IntegrationTypeEnum[keyof typeof IntegrationTypeEnum]
  configuration: Record<string, any>
  fieldMappings?: Record<string, any>
  syncConfig?: Record<string, any>
}

/**
 * Initialize default integration templates
 */
export async function initializeDefaultTemplates() {
  const templates: TemplateConfiguration[] = [
    {
      name: 'Salesforce Contacts Sync',
      description: 'Sync Salesforce contacts to your CRM with standard field mappings',
      category: 'CRM',
      integrationType: IntegrationTypeEnum.SALESFORCE as any,
      configuration: {
        syncResources: ['Contact', 'Account'],
      },
      fieldMappings: {
        Contact: {
          firstName: 'FirstName',
          lastName: 'LastName',
          email: 'Email',
          phone: 'Phone',
          company: 'Account.Name',
        },
      },
      syncConfig: {
        direction: 'pull',
        schedule: '0 */6 * * *', // Every 6 hours
      },
    },
    {
      name: 'HubSpot Marketing Sync',
      description: 'Sync HubSpot contacts and marketing campaign data',
      category: 'Marketing',
      integrationType: IntegrationTypeEnum.HUBSPOT as any,
      configuration: {
        syncResources: ['contacts', 'deals', 'companies'],
      },
      fieldMappings: {
        contacts: {
          email: 'email',
          firstName: 'firstname',
          lastName: 'lastname',
          company: 'company',
        },
      },
      syncConfig: {
        direction: 'pull',
        schedule: '0 */4 * * *', // Every 4 hours
      },
    },
    {
      name: 'QuickBooks Financial Sync',
      description: 'Sync invoices, customers, and financial transactions',
      category: 'Finance',
      integrationType: IntegrationTypeEnum.QUICKBOOKS as any,
      configuration: {
        syncResources: ['Invoice', 'Customer', 'Payment'],
      },
      fieldMappings: {
        Invoice: {
          number: 'DocNumber',
          amount: 'TotalAmt',
          date: 'TxnDate',
          customer: 'CustomerRef.value',
        },
      },
      syncConfig: {
        direction: 'pull',
        schedule: '0 2 * * *', // Daily at 2 AM
      },
    },
    {
      name: 'Stripe Payments Sync',
      description: 'Sync Stripe payments, customers, and subscription data',
      category: 'Finance',
      integrationType: IntegrationTypeEnum.STRIPE as any,
      configuration: {
        syncResources: ['payment_intent', 'customer', 'subscription'],
      },
      fieldMappings: {
        payment_intent: {
          amount: 'amount',
          currency: 'currency',
          status: 'status',
          customer: 'customer',
        },
      },
      syncConfig: {
        direction: 'pull',
        schedule: '*/30 * * * *', // Every 30 minutes
      },
    },
    {
      name: 'Google Analytics Traffic Data',
      description: 'Import website traffic and analytics data',
      category: 'Analytics',
      integrationType: IntegrationTypeEnum.GOOGLE_ANALYTICS as any,
      configuration: {
        metrics: ['sessions', 'users', 'pageviews', 'bounceRate'],
        dimensions: ['date', 'country', 'device'],
      },
      syncConfig: {
        direction: 'pull',
        schedule: '0 3 * * *', // Daily at 3 AM
      },
    },
    {
      name: 'Zendesk Support Tickets',
      description: 'Sync Zendesk tickets and customer support metrics',
      category: 'Support',
      integrationType: IntegrationTypeEnum.ZENDESK as any,
      configuration: {
        syncResources: ['ticket', 'user'],
      },
      fieldMappings: {
        ticket: {
          subject: 'subject',
          status: 'status',
          priority: 'priority',
          requester: 'requester_id',
        },
      },
      syncConfig: {
        direction: 'pull',
        schedule: '*/15 * * * *', // Every 15 minutes
      },
    },
    {
      name: 'Jira Issues Sync',
      description: 'Sync Jira issues, projects, and work items',
      category: 'Project Management',
      integrationType: IntegrationTypeEnum.JIRA as any,
      configuration: {
        syncResources: ['issue', 'project'],
      },
      fieldMappings: {
        issue: {
          summary: 'fields.summary',
          status: 'fields.status.name',
          assignee: 'fields.assignee.emailAddress',
        },
      },
      syncConfig: {
        direction: 'pull',
        schedule: '*/20 * * * *', // Every 20 minutes
      },
    },
    {
      name: 'Mailchimp Campaign Sync',
      description: 'Sync Mailchimp email campaigns and subscriber lists',
      category: 'Marketing',
      integrationType: IntegrationTypeEnum.MAILCHIMP as any,
      configuration: {
        syncResources: ['campaign', 'list', 'member'],
      },
      fieldMappings: {
        member: {
          email: 'email_address',
          firstName: 'merge_fields.FNAME',
          lastName: 'merge_fields.LNAME',
        },
      },
      syncConfig: {
        direction: 'pull',
        schedule: '0 */6 * * *', // Every 6 hours
      },
    },
  ]

  try {
    // Check if IntegrationTemplate model exists
    if (!prisma.integrationTemplate) {
      throw new Error('IntegrationTemplate model not available. Please run database migrations.')
    }

    for (const template of templates) {
      // Check if template exists
      const existing = await prisma.integrationTemplate.findFirst({
        where: {
          integrationType: template.integrationType,
          name: template.name,
        },
      })

      if (existing) {
        await prisma.integrationTemplate.update({
          where: { id: existing.id },
          data: {
            description: template.description,
            category: template.category,
            configuration: template.configuration,
            fieldMappings: template.fieldMappings || {},
            syncConfig: template.syncConfig || {},
          },
        })
      } else {
        await prisma.integrationTemplate.create({
          data: {
            integrationType: template.integrationType,
            name: template.name,
            description: template.description,
            category: template.category,
            tags: [template.category.toLowerCase(), template.integrationType.toLowerCase()],
            configuration: template.configuration,
            fieldMappings: template.fieldMappings || {},
            syncConfig: template.syncConfig || {},
            isFeatured: true,
            isActive: true,
          },
        })
      }
    }
  } catch (error: any) {
    // Handle case where table doesn't exist
    if (error.code === 'P2001' || error.message?.includes('does not exist') || error.message?.includes('Unknown model')) {
      throw new Error('IntegrationTemplate table not found. Please run database migrations: npx prisma migrate dev')
    }
    throw error
  }
}

/**
 * Get all templates
 */
export async function getTemplates(filters?: {
  category?: string
  integrationType?: typeof IntegrationTypeEnum[keyof typeof IntegrationTypeEnum]
  featured?: boolean
  search?: string
}) {
  const where: any = { isActive: true }

  if (filters?.category) {
    where.category = filters.category
  }

  if (filters?.integrationType) {
    where.integrationType = filters.integrationType
  }

  if (filters?.featured) {
    where.isFeatured = true
  }

  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
      { tags: { has: filters.search.toLowerCase() } },
    ]
  }

  try {
    // Check if IntegrationTemplate model exists
    if (!prisma.integrationTemplate) {
      return []
    }

    return await prisma.integrationTemplate.findMany({
      where,
      include: {
        _count: {
          select: {
            installations: true,
            reviews: true,
          },
        },
      },
      orderBy: [
        { isFeatured: 'desc' },
        { usageCount: 'desc' },
        { rating: 'desc' },
      ],
    })
  } catch (error: any) {
    // Handle case where table doesn't exist
    if (error.code === 'P2001' || error.message?.includes('does not exist') || error.message?.includes('Unknown model')) {
      console.warn('IntegrationTemplate table not found, returning empty array')
      return []
    }
    throw error
  }
}

/**
 * Get template by ID
 */
export async function getTemplate(templateId: string) {
  return prisma.integrationTemplate.findUnique({
    where: { id: templateId },
    include: {
      reviews: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      _count: {
        select: {
          installations: true,
          reviews: true,
        },
      },
    },
  })
}

/**
 * Install template (create integration from template)
 */
export async function installTemplate(
  templateId: string,
  tenantId: string,
  userId: string,
  customName?: string
) {
  // Check if required models exist
  if (!prisma.integration || !prisma.integrationTemplate) {
    throw new Error('Integration models not available. Please run database migrations: npx prisma migrate dev')
  }

  const template = await getTemplate(templateId)
  if (!template) {
    throw new Error('Template not found')
  }

  try {
    // Create integration from template
    const integration = await prisma.integration.create({
      data: {
        tenantId,
        type: template.integrationType,
        name: customName || `${template.name} - ${new Date().toLocaleDateString()}`,
        description: template.description,
        configuration: template.configuration,
        isActive: false,
        status: 'INACTIVE',
        createdById: userId,
      },
    })

    // Record installation if model exists
    if (prisma.integrationTemplateInstall) {
      try {
        await prisma.integrationTemplateInstall.create({
          data: {
            templateId,
            integrationId: integration.id,
            tenantId,
          },
        })
      } catch (error: any) {
        // Silently fail if model doesn't exist
        if (!error.code || (error.code !== 'P2001' && !error.message?.includes('does not exist'))) {
          throw error
        }
      }
    }

    // Update template usage count
    try {
      await prisma.integrationTemplate.update({
        where: { id: templateId },
        data: {
          usageCount: {
            increment: 1,
          },
        },
      })
    } catch (error: any) {
      // Silently fail if update fails
      if (error.code !== 'P2001' && !error.message?.includes('does not exist')) {
        console.warn('Failed to update template usage count:', error)
      }
    }

    // Create field mappings if provided
    if (template.fieldMappings && Object.keys(template.fieldMappings).length > 0 && prisma.integrationFieldMapping) {
      try {
        for (const [resourceType, mappings] of Object.entries(template.fieldMappings as Record<string, any>)) {
          for (const [targetField, sourceField] of Object.entries(mappings)) {
            try {
              await prisma.integrationFieldMapping.create({
                data: {
                  integrationId: integration.id,
                  tenantId,
                  sourceField: String(sourceField),
                  targetField,
                  mappingType: 'DIRECT',
                },
              })
            } catch (error: any) {
              // Silently fail individual field mappings
              if (error.code !== 'P2001' && !error.message?.includes('does not exist')) {
                console.warn(`Failed to create field mapping for ${targetField}:`, error)
              }
            }
          }
        }
      } catch (error: any) {
        // Silently fail if model doesn't exist
        if (error.code !== 'P2001' && !error.message?.includes('does not exist')) {
          console.warn('Failed to create field mappings:', error)
        }
      }
    }

    return integration
  } catch (error: any) {
    // Handle case where Integration model doesn't exist
    if (error.code === 'P2001' || error.message?.includes('does not exist') || error.message?.includes('Unknown model')) {
      throw new Error('Integration model not found. Please run database migrations: npx prisma migrate dev')
    }
    throw error
  }
}

/**
 * Add template review
 */
export async function addTemplateReview(
  templateId: string,
  userId: string,
  tenantId: string,
  rating: number,
  comment?: string
) {
  // Check if review exists
  const existing = await prisma.integrationTemplateReview.findFirst({
    where: {
      templateId,
      userId,
      tenantId,
    },
  })

  const review = existing
    ? await prisma.integrationTemplateReview.update({
        where: { id: existing.id },
        data: {
          rating,
          comment: comment || null,
        },
      })
    : await prisma.integrationTemplateReview.create({
        data: {
          templateId,
          userId,
          tenantId,
          rating,
          comment: comment || null,
        },
      })

  // Update template rating
  const reviews = await prisma.integrationTemplateReview.findMany({
    where: { templateId },
    select: { rating: true },
  })

  const avgRating = reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length

  await prisma.integrationTemplate.update({
    where: { id: templateId },
    data: {
      rating: avgRating,
    },
  })

  return review
}

