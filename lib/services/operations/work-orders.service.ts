import { prisma } from '@/lib/prisma'
import { WorkOrderStatus, WorkOrderPriority } from '@prisma/client'

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

    const [workOrders, total] = await Promise.all([
      prisma.operationsWorkOrder.findMany({
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
      }),
      prisma.operationsWorkOrder.count({ where }),
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

    const [total, pending, inProgress, completed, overdue, highPriority] =
      await Promise.all([
        prisma.operationsWorkOrder.count({ where: { tenantId } }),
        prisma.operationsWorkOrder.count({
          where: { tenantId, status: 'PENDING' },
        }),
        prisma.operationsWorkOrder.count({
          where: { tenantId, status: 'IN_PROGRESS' },
        }),
        prisma.operationsWorkOrder.count({
          where: { tenantId, status: 'COMPLETED' },
        }),
        prisma.operationsWorkOrder.count({
          where: {
            tenantId,
            status: { in: ['PENDING', 'IN_PROGRESS'] },
            scheduledDate: { lt: now },
          },
        }),
        prisma.operationsWorkOrder.count({
          where: {
            tenantId,
            priority: { in: ['HIGH', 'URGENT'] },
            status: { not: 'COMPLETED' },
          },
        }),
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
    const count = await prisma.operationsWorkOrder.count({
      where: { tenantId },
    })
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

    const [total, completed] = await Promise.all([
      prisma.operationsWorkOrder.count({ where }),
      prisma.operationsWorkOrder.count({
        where: { ...where, status: 'COMPLETED' },
      }),
    ])

    return total > 0 ? Number(((completed / total) * 100).toFixed(2)) : 0
  }
}

