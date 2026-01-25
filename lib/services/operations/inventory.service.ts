import { prisma } from '@/lib/prisma'

// Type definition for inventory status
type InventoryStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'RESERVED' | 'IN_TRANSIT'

// Extended Prisma client type to include operations models that may not be in schema yet
type ExtendedPrismaClient = typeof prisma & {
  operationsInventoryItem?: {
    findMany: (args?: { where?: any; include?: any }) => Promise<any[]>
  }
  operationsInventoryDistribution?: {
    findMany: (args?: { where?: any; include?: any }) => Promise<any[]>
  }
}

export interface InventoryStats {
  totalItems: number
  totalValue: number
  lowStock: number
  outOfStock: number
  byCategory: Record<string, { count: number; value: number }>
  byStatus: Record<string, number>
}

export interface LowStockItem {
  id: string
  itemName: string
  category: string
  quantity: number
  reorderLevel: number
  status: InventoryStatus
  location: string
  urgency: 'CRITICAL' | 'LOW' | 'OUT_OF_STOCK'
}

export class InventoryService {
  /**
   * Get inventory statistics
   */
  static async getInventoryStats(tenantId: string): Promise<InventoryStats> {
    // Type assertion needed: These models may not be in Prisma schema yet
    const prismaClient = prisma as ExtendedPrismaClient
    
    const items = await (prismaClient.operationsInventoryItem?.findMany({
      where: { tenantId },
    }) || Promise.resolve([]))

    const totalValue = items.reduce(
      (sum: number, item: any) => sum + (item.totalValue ? Number(item.totalValue) : 0),
      0
    )

    const lowStock = items.filter(
      (item: any) => item.quantity > 0 && item.quantity <= item.reorderLevel
    ).length

    const outOfStock = items.filter((item: any) => item.quantity === 0).length

    const byCategory: Record<string, { count: number; value: number }> = {}
    const byStatus: Record<string, number> = {}

    items.forEach((item: any) => {
      // By category
      const category = item.category
      if (!byCategory[category]) {
        byCategory[category] = { count: 0, value: 0 }
      }
      byCategory[category].count++
      byCategory[category].value += item.totalValue
        ? Number(item.totalValue)
        : 0

      // By status
      const status = item.status
      byStatus[status] = (byStatus[status] || 0) + 1
    })

    return {
      totalItems: items.length,
      totalValue: Number(totalValue.toFixed(2)),
      lowStock,
      outOfStock,
      byCategory,
      byStatus,
    }
  }

  /**
   * Get low stock items with urgency classification
   */
  static async getLowStockItems(tenantId: string): Promise<LowStockItem[]> {
    // Type assertion needed: These models may not be in Prisma schema yet
    const prismaClient = prisma as ExtendedPrismaClient
    
    // Fetch all items and filter in memory since we need to compare quantity with reorderLevel
    const allItems = await (prismaClient.operationsInventoryItem?.findMany({
      where: {
        tenantId,
        OR: [
          { status: 'LOW_STOCK' },
          { status: 'OUT_OF_STOCK' },
        ],
      },
    }) || Promise.resolve([]))

    // Also fetch items that might be low stock but status hasn't been updated
    const inStockItems = await (prismaClient.operationsInventoryItem?.findMany({
      where: {
        tenantId,
        status: 'IN_STOCK',
      },
    }) || Promise.resolve([]))

    // Filter items where quantity <= reorderLevel
    const lowStockInStock = inStockItems.filter(
      (item: any) => item.quantity <= item.reorderLevel
    )

    const items = [...allItems, ...lowStockInStock]

    return items
      .map((item: any) => {
        let urgency: 'CRITICAL' | 'LOW' | 'OUT_OF_STOCK' = 'LOW'
        if (item.quantity === 0) {
          urgency = 'OUT_OF_STOCK'
        } else if (item.quantity <= item.reorderLevel * 0.5) {
          urgency = 'CRITICAL'
        }

        return {
          id: item.id,
          itemName: item.itemName,
          category: item.category,
          quantity: item.quantity,
          reorderLevel: item.reorderLevel,
          status: item.status,
          location: item.location,
          urgency,
        }
      })
      .sort((a, b) => {
        // Sort by urgency: OUT_OF_STOCK > CRITICAL > LOW
        const urgencyOrder = { OUT_OF_STOCK: 3, CRITICAL: 2, LOW: 1 }
        if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
          return urgencyOrder[b.urgency] - urgencyOrder[a.urgency]
        }
        return a.quantity - b.quantity
      })
  }

  /**
   * Calculate inventory value
   */
  static calculateInventoryValue(
    quantity: number,
    unitCost: number | null
  ): number | null {
    if (!unitCost) return null
    return Number((quantity * unitCost).toFixed(2))
  }

  /**
   * Determine inventory status based on quantity
   */
  static determineInventoryStatus(
    quantity: number,
    reorderLevel: number
  ): InventoryStatus {
    if (quantity <= 0) return 'OUT_OF_STOCK'
    if (quantity <= reorderLevel) return 'LOW_STOCK'
    return 'IN_STOCK'
  }

  /**
   * Check if item needs reordering
   */
  static needsReorder(quantity: number, reorderLevel: number): boolean {
    return quantity <= reorderLevel
  }

  /**
   * Calculate reorder quantity
   */
  static calculateReorderQuantity(
    reorderLevel: number,
    maxStock: number,
    currentQuantity: number
  ): number {
    return Math.max(0, maxStock - currentQuantity)
  }

  /**
   * Get distribution history summary
   */
  static async getDistributionSummary(
    tenantId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    const where: any = { tenantId }
    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = startDate
      if (endDate) where.date.lte = endDate
    }

    // Type assertion needed: These models may not be in Prisma schema yet
    const prismaClient = prisma as ExtendedPrismaClient
    
    const distributions = await (prismaClient.operationsInventoryDistribution?.findMany(
      {
        where,
        include: {
          item: true,
        },
      }
    ) || Promise.resolve([]))

    const totalDistributed = distributions.reduce(
      (sum: number, d: any) => sum + d.quantity,
      0
    )

    const byLocation: Record<string, number> = {}
    distributions.forEach((d: any) => {
      byLocation[d.toLocation] =
        (byLocation[d.toLocation] || 0) + d.quantity
    })

    return {
      totalDistributions: distributions.length,
      totalQuantity: totalDistributed,
      byLocation,
    }
  }
}

