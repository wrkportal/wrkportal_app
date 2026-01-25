/**
 * Sales Reports Service
 * 
 * Manages sales reports with scheduling and sharing
 */

import { prisma } from '@/lib/prisma'

// Helper to access optional Prisma models
const getSalesReport = () => {
  return (prisma as any).salesReport as {
    create: (args: { data: any }) => Promise<any>
    findFirst: (args: { where: any; include?: any }) => Promise<any>
    findMany: (args: { where: any; include?: any; orderBy?: any }) => Promise<any[]>
    update: (args: { where: { id: string }; data: any }) => Promise<any>
    delete: (args: { where: { id: string } }) => Promise<any>
  } | undefined
}

export interface ReportConfig {
  name: string
  description?: string
  type: 'ANALYTICS' | 'PERFORMANCE' | 'FORECAST' | 'CUSTOM'
  dataSource: string
  filters?: Record<string, any>
  columns?: string[]
  chartType?: 'bar' | 'line' | 'pie' | 'area' | 'table'
  groupBy?: string
  dateRange?: {
    start: string
    end: string
  }
}

export interface ReportSchedule {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY'
  dayOfWeek?: number // 0-6 for weekly
  dayOfMonth?: number // 1-31 for monthly
  time?: string // HH:mm format
  recipients: string[] // User IDs or email addresses
  format: 'PDF' | 'EXCEL' | 'CSV' | 'JSON'
}

/**
 * Create a new report
 */
export async function createReport(
  tenantId: string,
  createdById: string,
  data: {
    name: string
    description?: string
    config: ReportConfig
    schedule?: ReportSchedule
    sharedWith?: string[]
  }
) {
  const salesReportModel = getSalesReport()
  if (!salesReportModel) {
    throw new Error('Sales report model is not available')
  }
  const report = await salesReportModel.create({
    data: {
      tenantId,
      createdById,
      name: data.name,
      description: data.description,
      config: data.config,
      schedule: data.schedule || null,
      sharedWith: data.sharedWith || [],
    },
  })

  return report
}

/**
 * Get report by ID
 */
export async function getReport(
  reportId: string,
  tenantId: string,
  userId?: string
) {
  const salesReportModel = getSalesReport()
  const report = await (salesReportModel?.findFirst({
    where: {
      id: reportId,
      tenantId,
      OR: [
        { createdById: userId },
        { sharedWith: { has: userId } },
      ],
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  } as any) || Promise.resolve(null))

  return report
}

/**
 * Get all reports for a tenant/user
 */
export async function getReports(
  tenantId: string,
  userId?: string,
  type?: 'ANALYTICS' | 'PERFORMANCE' | 'FORECAST' | 'CUSTOM'
) {
  const where: any = {
    tenantId,
  }

  // Note: Type filtering would need to be done in application code
  // since Prisma doesn't support JSON path queries directly
  // For now, we'll filter after fetching

  if (userId) {
    where.OR = [
      { createdById: userId },
      { sharedWith: { has: userId } },
    ]
  }

  const salesReportModel = getSalesReport()
  let reports = await (salesReportModel?.findMany({
    where,
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  } as any) || Promise.resolve([]))

  // Filter by type if specified (since config is JSON)
  if (type) {
    reports = reports.filter((report: any) => {
      const config = report.config as ReportConfig
      return config.type === type
    })
  }

  return reports
}

/**
 * Update report
 */
export async function updateReport(
  reportId: string,
  tenantId: string,
  userId: string,
  data: {
    name?: string
    description?: string
    config?: ReportConfig
    schedule?: ReportSchedule | null
    sharedWith?: string[]
  }
) {
  const salesReportModel = getSalesReport()
  if (!salesReportModel) {
    throw new Error('Sales report model is not available')
  }
  
  const report = await salesReportModel.findFirst({
    where: {
      id: reportId,
      tenantId,
      createdById: userId,
    },
  })

  if (!report) {
    throw new Error('Report not found or access denied')
  }

  const updated = await salesReportModel.update({
    where: { id: reportId },
    data: {
      name: data.name,
      description: data.description,
      config: data.config,
      schedule: data.schedule,
      sharedWith: data.sharedWith,
    },
  })

  return updated
}

/**
 * Delete report
 */
export async function deleteReport(
  reportId: string,
  tenantId: string,
  userId: string
) {
  const salesReportModel = getSalesReport()
  if (!salesReportModel) {
    throw new Error('Sales report model is not available')
  }
  
  const report = await salesReportModel.findFirst({
    where: {
      id: reportId,
      tenantId,
      createdById: userId,
    },
  })

  if (!report) {
    throw new Error('Report not found or access denied')
  }

  await salesReportModel.delete({
    where: { id: reportId },
  })

  return { success: true }
}

/**
 * Generate report data
 */
export async function generateReportData(
  reportId: string,
  tenantId: string
): Promise<any> {
  const salesReportModel = getSalesReport()
  const report = await (salesReportModel?.findFirst({
    where: {
      id: reportId,
      tenantId,
    },
  }) || Promise.resolve(null))

  if (!report) {
    throw new Error('Report not found')
  }

  const config = report.config as ReportConfig

  // Based on dataSource, fetch appropriate data
  switch (config.dataSource) {
    case 'opportunities':
      return await generateOpportunitiesReport(config, tenantId)
    case 'leads':
      return await generateLeadsReport(config, tenantId)
    case 'activities':
      return await generateActivitiesReport(config, tenantId)
    case 'forecast':
      return await generateForecastReport(config, tenantId)
    default:
      throw new Error(`Unknown data source: ${config.dataSource}`)
  }
}

async function generateOpportunitiesReport(config: ReportConfig, tenantId: string) {
  const where: any = { tenantId }

  if (config.dateRange) {
    where.createdAt = {
      gte: new Date(config.dateRange.start),
      lte: new Date(config.dateRange.end),
    }
  }

  if (config.filters) {
    if (config.filters.stage) where.stage = config.filters.stage
    if (config.filters.ownerId) where.ownerId = config.filters.ownerId
  }

  const opportunities = await prisma.salesOpportunity.findMany({
    where,
    include: {
      account: true,
      owner: {
        select: { name: true, email: true },
      },
    },
  })

  return opportunities
}

async function generateLeadsReport(config: ReportConfig, tenantId: string) {
  const where: any = { tenantId }

  if (config.dateRange) {
    where.createdAt = {
      gte: new Date(config.dateRange.start),
      lte: new Date(config.dateRange.end),
    }
  }

  if (config.filters) {
    if (config.filters.status) where.status = config.filters.status
    if (config.filters.source) where.leadSource = config.filters.source
  }

  const leads = await prisma.salesLead.findMany({
    where,
    include: {
      assignedTo: {
        select: { name: true, email: true },
      },
    },
  })

  return leads
}

async function generateActivitiesReport(config: ReportConfig, tenantId: string) {
  const where: any = { tenantId }

  if (config.dateRange) {
    where.createdAt = {
      gte: new Date(config.dateRange.start),
      lte: new Date(config.dateRange.end),
    }
  }

  const activities = await prisma.salesActivity.findMany({
    where,
    include: {
      assignedTo: {
        select: { name: true, email: true },
      },
      lead: true,
      opportunity: true,
    },
  })

  return activities
}

async function generateForecastReport(config: ReportConfig, tenantId: string) {
  const where: any = { tenantId }

  if (config.dateRange) {
    where.period = {
      gte: config.dateRange.start,
      lte: config.dateRange.end,
    }
  }

  const forecasts = await prisma.salesForecast.findMany({
    where,
    include: {
      user: {
        select: { name: true, email: true },
      },
      account: true,
    },
  })

  return forecasts
}

