import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

// Helper function to safely access operationsInventoryItem model
function getOperationsInventoryItem() {
  return (prisma as any).operationsInventoryItem as any
}

type OperationsInventoryItem = {
  itemName: string
  quantity: number
  reorderLevel: number
  status: string
}

// Helper to safely query Prisma models that might not exist
const safeQuery = async <T>(
  queryFn: () => Promise<T>,
  defaultValue: T
): Promise<T> => {
  try {
    return await queryFn()
  } catch (error: any) {
    // Check if it's a Prisma error about missing model or TypeError from undefined
    if (
      error?.code === 'P2001' ||
      error?.message?.includes('does not exist') ||
      error?.message?.includes('Unknown model') ||
      error?.message?.includes('model does not exist')
    ) {
      console.warn('Prisma model not found, using default value:', error.message)
      return defaultValue
    }
    // Catch TypeError from accessing undefined properties
    if (
      error instanceof TypeError &&
      (error.message?.includes('Cannot read properties of undefined') ||
        error.message?.includes('undefined'))
    ) {
      console.warn('Prisma model not found (TypeError), using default value:', error.message)
      return defaultValue
    }
    throw error
  }
}

const createInventoryItemSchema = z.object({
  itemName: z.string().min(1),
  category: z.enum(['SUPPLIES', 'EQUIPMENT', 'SAFETY', 'TOOLS', 'IT_EQUIPMENT', 'OFFICE_SUPPLIES', 'OTHER']),
  quantity: z.number().int().min(0),
  location: z.string().min(1),
  reorderLevel: z.number().int().min(0),
  unitCost: z.number().optional(),
  notes: z.string().optional(),
  barcode: z.string().optional(),
  serialNumber: z.string().optional(),
})

// GET - List inventory items
export async function GET(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'READ' },
    async (request, userInfo) => {
      try {
        const { searchParams } = new URL(request.url)
        const category = searchParams.get('category')
        const status = searchParams.get('status')
        const location = searchParams.get('location')
        const search = searchParams.get('search')
        const lowStock = searchParams.get('lowStock') === 'true'
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')
        const skip = (page - 1) * limit

        const where: any = {
          tenantId: userInfo.tenantId,
        }

        if (category) {
          where.category = category
        }
        if (status) {
          where.status = status
        }
        if (location) {
          where.location = location
        }
        if (search) {
          where.OR = [
            { itemName: { contains: search, mode: 'insensitive' } },
            { barcode: { contains: search, mode: 'insensitive' } },
            { serialNumber: { contains: search, mode: 'insensitive' } },
          ]
        }
        if (lowStock) {
          // Prisma doesn't support field references; filter IN_STOCK items after fetch.
          where.OR = [
            { status: 'LOW_STOCK' },
            { status: 'IN_STOCK' },
          ]
        }

        const operationsInventoryItem = getOperationsInventoryItem()
        if (!operationsInventoryItem) {
          return NextResponse.json(
            { error: 'Operations inventory item model not available' },
            { status: 503 }
          )
        }

        const [items, total] = await Promise.all([
          safeQuery<OperationsInventoryItem[]>(
            () => operationsInventoryItem.findMany({
              where,
              orderBy: {
                itemName: 'asc',
              },
              skip,
              take: limit,
            }),
            []
          ),
          safeQuery(
            () => operationsInventoryItem.count({ where }),
            0
          ),
        ])

        // Update status based on quantity
        const itemsWithStatus = items.map((item: OperationsInventoryItem) => {
          let status = item.status
          if (item.quantity <= 0) {
            status = 'OUT_OF_STOCK'
          } else if (item.quantity <= item.reorderLevel) {
            status = 'LOW_STOCK'
          } else if (status === 'OUT_OF_STOCK' && item.quantity > 0) {
            status = 'IN_STOCK'
          }
          return { ...item, status }
        })

        const filteredItems = lowStock
          ? itemsWithStatus.filter((item: OperationsInventoryItem) =>
              item.status === 'LOW_STOCK' ||
              (item.status === 'IN_STOCK' && item.quantity <= item.reorderLevel)
            )
          : itemsWithStatus

        return NextResponse.json({
          items: filteredItems,
          pagination: {
            page,
            limit,
            total: lowStock ? filteredItems.length : total,
            totalPages: Math.ceil((lowStock ? filteredItems.length : total) / limit),
          },
        })
      } catch (error) {
        console.error('Error fetching inventory:', error)
        return NextResponse.json(
          { error: 'Failed to fetch inventory items' },
          { status: 500 }
        )
      }
    }
  )
}

// POST - Create inventory item
export async function POST(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'CREATE' },
    async (request, userInfo) => {
      try {
        const body = await request.json()
        const validatedData = createInventoryItemSchema.parse(body)

        // Determine status based on quantity
        let status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' = 'IN_STOCK'
        if (validatedData.quantity <= 0) {
          status = 'OUT_OF_STOCK'
        } else if (validatedData.quantity <= validatedData.reorderLevel) {
          status = 'LOW_STOCK'
        }

        const totalValue = validatedData.unitCost
          ? validatedData.quantity * validatedData.unitCost
          : null

        const operationsInventoryItem = getOperationsInventoryItem()
        if (!operationsInventoryItem) {
          return NextResponse.json(
            { error: 'Operations inventory item model not available' },
            { status: 503 }
          )
        }

        const item = await operationsInventoryItem.create({
          data: {
            itemName: validatedData.itemName,
            category: validatedData.category,
            quantity: validatedData.quantity,
            location: validatedData.location,
            status,
            reorderLevel: validatedData.reorderLevel,
            unitCost: validatedData.unitCost,
            totalValue,
            notes: validatedData.notes,
            barcode: validatedData.barcode,
            serialNumber: validatedData.serialNumber,
            tenantId: userInfo.tenantId,
          },
        })

        return NextResponse.json(item, { status: 201 })
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Invalid input', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error creating inventory item:', error)
        return NextResponse.json(
          { error: 'Failed to create inventory item' },
          { status: 500 }
        )
      }
    }
  )
}

