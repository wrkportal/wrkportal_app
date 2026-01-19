/**
 * Data Source Discovery
 * Auto-discovers Prisma models and creates data source entries
 */

import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export interface DiscoveredTable {
  name: string
  displayName: string
  functionalArea?: string
  fields: DiscoveredField[]
}

export interface DiscoveredField {
  name: string
  type: string
  nullable: boolean
  isRelation: boolean
}

/**
 * Discover all Prisma models and create data sources
 */
export async function discoverPrismaModels(tenantId: string): Promise<DiscoveredTable[]> {
  // Get all Prisma models by inspecting the Prisma client
  const models: DiscoveredTable[] = []

  // Common models to discover (based on your schema)
  const modelMap: Record<string, { displayName: string; functionalArea?: string }> = {
    // Sales
    SalesLead: { displayName: 'Sales Leads', functionalArea: 'SALES' },
    SalesOpportunity: { displayName: 'Sales Opportunities', functionalArea: 'SALES' },
    SalesAccount: { displayName: 'Sales Accounts', functionalArea: 'SALES' },
    SalesContact: { displayName: 'Sales Contacts', functionalArea: 'SALES' },
    SalesQuote: { displayName: 'Sales Quotes', functionalArea: 'SALES' },
    SalesOrder: { displayName: 'Sales Orders', functionalArea: 'SALES' },
    
    // Finance
    Invoice: { displayName: 'Invoices', functionalArea: 'FINANCE' },
    Budget: { displayName: 'Budgets', functionalArea: 'FINANCE' },
    BudgetTransfer: { displayName: 'Budget Transfers', functionalArea: 'FINANCE' },
    
    // Operations
    OperationsVendor: { displayName: 'Vendors', functionalArea: 'OPERATIONS' },
    OperationsServiceRequest: { displayName: 'Service Requests', functionalArea: 'OPERATIONS' },
    OperationsMaintenance: { displayName: 'Maintenance', functionalArea: 'OPERATIONS' },
    
    // Projects
    Project: { displayName: 'Projects', functionalArea: 'PROJECTS' },
    Task: { displayName: 'Tasks', functionalArea: 'PROJECTS' },
    Program: { displayName: 'Programs', functionalArea: 'PROJECTS' },
    
    // IT
    // Add IT models when available
    
    // Recruitment
    // Add recruitment models when available
    
    // Common
    User: { displayName: 'Users', functionalArea: 'CROSS_FUNCTIONAL' },
    Team: { displayName: 'Teams', functionalArea: 'CROSS_FUNCTIONAL' },
  }

  // Try to get field information from Prisma schema
  // This is a simplified version - in production, you'd parse the Prisma schema file
  for (const [modelName, config] of Object.entries(modelMap)) {
    try {
      // Check if model exists in Prisma client
      const prismaClient = prisma as any
      if (prismaClient[modelName.toLowerCase()]) {
        models.push({
          name: modelName,
          displayName: config.displayName,
          functionalArea: config.functionalArea,
          fields: [], // Would be populated from schema parsing
        })
      }
    } catch (error) {
      // Model doesn't exist or can't be accessed
      console.warn(`Model ${modelName} not accessible:`, error)
    }
  }

  return models
}

/**
 * Create data sources from discovered models
 */
export async function createDataSourcesFromDiscovery(
  tenantId: string,
  userId: string
): Promise<number> {
  const discovered = await discoverPrismaModels(tenantId)
  let created = 0

  for (const table of discovered) {
    try {
      // Check if data source already exists
      const existing = await prisma.dataSource.findFirst({
        where: {
          tenantId,
          name: table.displayName,
          type: 'DATABASE_TABLE',
        },
      })

      if (!existing) {
        await prisma.dataSource.create({
          data: {
            name: table.displayName,
            description: `Auto-discovered from Prisma model: ${table.name}`,
            type: 'DATABASE_TABLE',
            connection: {
              tableName: table.name,
              modelName: table.name,
            },
            schema: {
              fields: table.fields,
            },
            functionalArea: table.functionalArea || null,
            tenantId,
          },
        })

        // Grant creator access
        await prisma.dataSourceAccess.create({
          data: {
            dataSourceId: (await prisma.dataSource.findFirst({
              where: { tenantId, name: table.displayName },
            }))!.id,
            userId,
            permission: 'WRITE',
          },
        })

        created++
      }
    } catch (error) {
      console.error(`Failed to create data source for ${table.name}:`, error)
    }
  }

  return created
}

/**
 * Get schema for a specific Prisma model
 */
export async function getModelSchema(modelName: string): Promise<DiscoveredField[]> {
  // This would parse the Prisma schema file to get field information
  // For now, return empty array - will be implemented with schema parser
  return []
}
