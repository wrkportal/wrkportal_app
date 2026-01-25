import { prisma } from '@/lib/prisma'

// Type definitions for work orders
type WorkOrderStatus = 'OPEN' | 'SCHEDULED' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'ON_HOLD'
type WorkOrderPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

// Extended Prisma client type to include operations models that may not be in schema yet
type ExtendedPrismaClient = typeof prisma & {
  operationsWorkOrder?: {
    findMany: (args?: { where?: any; include?: any; orderBy?: any; skip?: number; take?: number }) => Promise<any[]>
    count: (args?: { where?: any }) => Promise<number>
  }
}

export interface WorkOrderFilters {
  status?: WorkOrderStatus
  priority?: WorkOrderPriority
  assignedToId?: string
  requestedById?: string
  search?: string
  startDate?: Date
  endDate?: Date
}

export interface WorkOrderStats {
  total: number
  pending: number
  inProgress: number
  completed: number
  overdue: number
  highPriority: number
}

export class WorkOrdersService {
  /**
   * Get work orders with filters and pagination
   */
  static async getWorkOrders(
    tenantId: string,
    filters: WorkOrderFilters = {},
    page: number = 1,
    limit: number = 50
  ) {
    const where: any = { tenantId }

    if (filters.status) where.status = filters.status
    if (filters.priority) where.priority = filters.priority
    if (filters.assignedToId) where.assignedToId = filters.assignedToId
    if (filters.requestedById) where.requestedById = filters.requestedById

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { workOrderNumber: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    if (filters.startDate || filters.endDate) {
      where.scheduledDate = {}
      if (filters.startDate) where.scheduledDate.gte = filters.startDate
      if (filters.endDate) where.scheduledDate.lte = filters.endDate
    }

    // Type assertion needed: These models may not be in Prisma schema yet
    const prismaClient = prisma as ExtendedPrismaClient
    
    const [workOrders, total] = await Promise.all([
      prismaClient.operationsWorkOrder?.findMany({
        where,
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true,
            },
          },
          requestedBy: {
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
        skip: (page - 1) * limit,
        take: limit,
      }) || Promise.resolve([]),
      prismaClient.operationsWorkOrder?.count({ where }) || Promise.resolve(0),
    ])

    return {
      workOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  /**
   * Get work order statistics
   */
  static async getWorkOrderStats(tenantId: string): Promise<WorkOrderStats> {
    const now = new Date()

    // Type assertion needed: These models may not be in Prisma schema yet
    const prismaClient = prisma as ExtendedPrismaClient
    
    const [total, pending, inProgress, completed, overdue, highPriority] =
      await Promise.all([
        prismaClient.operationsWorkOrder?.count({ where: { tenantId } }) || Promise.resolve(0),
        prismaClient.operationsWorkOrder?.count({
          where: { tenantId, status: 'PENDING' },
        }) || Promise.resolve(0),
        prismaClient.operationsWorkOrder?.count({
          where: { tenantId, status: 'IN_PROGRESS' },
        }) || Promise.resolve(0),
        prismaClient.operationsWorkOrder?.count({
          where: { tenantId, status: 'COMPLETED' },
        }) || Promise.resolve(0),
        prismaClient.operationsWorkOrder?.count({
          where: {
            tenantId,
            status: { in: ['PENDING', 'IN_PROGRESS'] },
            scheduledDate: { lt: now },
          },
        }) || Promise.resolve(0),
        prismaClient.operationsWorkOrder?.count({
          where: {
            tenantId,
            priority: { in: ['HIGH', 'URGENT'] },
            status: { not: 'COMPLETED' },
          },
        }) || Promise.resolve(0),
      ])

    return {
      total,
      pending,
      inProgress,
      completed,
      overdue,
      highPriority,
    }
  }

  /**
   * Generate next work order number
   */
  static async generateWorkOrderNumber(tenantId: string): Promise<string> {
    // Type assertion needed: These models may not be in Prisma schema yet
    const prismaClient = prisma as ExtendedPrismaClient
    
    const count = await (prismaClient.operationsWorkOrder?.count({
      where: { tenantId },
    }) || Promise.resolve(0))
    const year = new Date().getFullYear()
    const number = String(count + 1).padStart(6, '0')
    return `WO-${year}-${number}`
  }

  /**
   * Check if work order is overdue
   */
  static isOverdue(
    scheduledDate: Date | null,
    status: WorkOrderStatus
  ): boolean {
    if (!scheduledDate || status === 'COMPLETED') return false
    return new Date(scheduledDate) < new Date()
  }

  /**
   * Calculate work order completion rate
   */
  static async getCompletionRate(
    tenantId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<number> {
    const where: any = { tenantId }
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = startDate
      if (endDate) where.createdAt.lte = endDate
    }

    // Type assertion needed: These models may not be in Prisma schema yet
    const prismaClient = prisma as ExtendedPrismaClient
    
    const [total, completed] = await Promise.all([
      prismaClient.operationsWorkOrder?.count({ where }) || Promise.resolve(0),
      prismaClient.operationsWorkOrder?.count({
        where: { ...where, status: 'COMPLETED' },
      }) || Promise.resolve(0),
    ])

    return total > 0 ? Number(((completed / total) * 100).toFixed(2)) : 0
  }
}

