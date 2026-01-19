import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

// GET - Get low stock items
export async function GET(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'READ' },
    async (request, userInfo) => {
      try {
        const { searchParams } = new URL(request.url)
        const category = searchParams.get('category')
        const location = searchParams.get('location')

        const where: any = {
          tenantId: userInfo.tenantId,
          OR: [
            { status: 'LOW_STOCK' },
            { status: 'OUT_OF_STOCK' },
          ],
        }

        if (category) {
          where.category = category
        }
        if (location) {
          where.location = location
        }

        // Fetch all items that might be low stock
        const allItems = await prisma.operationsInventoryItem.findMany({
          where: {
            tenantId: userInfo.tenantId,
            ...(category && { category }),
            ...(location && { location }),
          },
        })

        // Filter items where quantity <= reorderLevel or status is OUT_OF_STOCK
        const lowStockItems = allItems.filter(item => 
          item.quantity === 0 || 
          item.quantity <= item.reorderLevel ||
          item.status === 'LOW_STOCK' ||
          item.status === 'OUT_OF_STOCK'
        ).sort((a, b) => {
          // Sort by quantity first, then by name
          if (a.quantity !== b.quantity) {
            return a.quantity - b.quantity
          }
          return a.itemName.localeCompare(b.itemName)
        })

        // Categorize items
        const categorized = {
          outOfStock: lowStockItems.filter(item => item.quantity === 0),
          lowStock: lowStockItems.filter(item => 
            item.quantity > 0 && item.quantity <= item.reorderLevel
          ),
          critical: lowStockItems.filter(item => 
            item.quantity > 0 && item.quantity <= item.reorderLevel * 0.5
          ),
        }

        const stats = {
          total: lowStockItems.length,
          outOfStock: categorized.outOfStock.length,
          lowStock: categorized.lowStock.length,
          critical: categorized.critical.length,
        }

        return NextResponse.json({
          items: lowStockItems,
          categorized,
          stats,
        })
      } catch (error) {
        console.error('Error fetching low stock items:', error)
        return NextResponse.json(
          { error: 'Failed to fetch low stock items' },
          { status: 500 }
        )
      }
    }
  )
}

