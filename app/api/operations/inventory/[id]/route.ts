import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

const updateInventoryItemSchema = z.object({
  itemName: z.string().min(1).optional(),
  category: z.enum(['SUPPLIES', 'EQUIPMENT', 'SAFETY', 'TOOLS', 'IT_EQUIPMENT', 'OFFICE_SUPPLIES', 'OTHER']).optional(),
  quantity: z.number().int().min(0).optional(),
  location: z.string().min(1).optional(),
  reorderLevel: z.number().int().min(0).optional(),
  unitCost: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  serialNumber: z.string().optional().nullable(),
})

// GET - Get inventory item by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'READ' },
    async (request, userInfo) => {
      try {
        const item = await prisma.operationsInventoryItem.findFirst({
          where: {
            id: params.id,
            tenantId: userInfo.tenantId,
          },
          include: {
            distributions: {
              include: {
                workOrder: {
                  select: {
                    id: true,
                    workOrderNumber: true,
                    title: true,
                  },
                },
              },
              orderBy: {
                date: 'desc',
              },
              take: 10,
            },
          },
        })

        if (!item) {
          return NextResponse.json(
            { error: 'Inventory item not found' },
            { status: 404 }
          )
        }

        // Update status based on quantity
        let status = item.status
        if (item.quantity <= 0) {
          status = 'OUT_OF_STOCK'
        } else if (item.quantity <= item.reorderLevel) {
          status = 'LOW_STOCK'
        } else if (status === 'OUT_OF_STOCK' && item.quantity > 0) {
          status = 'IN_STOCK'
        }

        return NextResponse.json({ ...item, status })
      } catch (error) {
        console.error('Error fetching inventory item:', error)
        return NextResponse.json(
          { error: 'Failed to fetch inventory item' },
          { status: 500 }
        )
      }
    }
  )
}

// PATCH - Update inventory item
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'UPDATE' },
    async (request, userInfo) => {
      try {
        const body = await request.json()
        const validatedData = updateInventoryItemSchema.parse(body)

        const existing = await prisma.operationsInventoryItem.findFirst({
          where: {
            id: params.id,
            tenantId: userInfo.tenantId,
          },
        })

        if (!existing) {
          return NextResponse.json(
            { error: 'Inventory item not found' },
            { status: 404 }
          )
        }

        const updateData: any = {}
        if (validatedData.itemName !== undefined) updateData.itemName = validatedData.itemName
        if (validatedData.category !== undefined) updateData.category = validatedData.category
        if (validatedData.quantity !== undefined) updateData.quantity = validatedData.quantity
        if (validatedData.location !== undefined) updateData.location = validatedData.location
        if (validatedData.reorderLevel !== undefined) updateData.reorderLevel = validatedData.reorderLevel
        if (validatedData.unitCost !== undefined) updateData.unitCost = validatedData.unitCost
        if (validatedData.notes !== undefined) updateData.notes = validatedData.notes
        if (validatedData.barcode !== undefined) updateData.barcode = validatedData.barcode
        if (validatedData.serialNumber !== undefined) updateData.serialNumber = validatedData.serialNumber

        // Update status based on quantity
        const quantity = validatedData.quantity !== undefined ? validatedData.quantity : existing.quantity
        const reorderLevel = validatedData.reorderLevel !== undefined ? validatedData.reorderLevel : existing.reorderLevel
        
        if (quantity <= 0) {
          updateData.status = 'OUT_OF_STOCK'
        } else if (quantity <= reorderLevel) {
          updateData.status = 'LOW_STOCK'
        } else {
          updateData.status = 'IN_STOCK'
        }

        // Update total value
        const unitCost = validatedData.unitCost !== undefined ? validatedData.unitCost : existing.unitCost
        if (unitCost) {
          updateData.totalValue = quantity * unitCost
        }

        const item = await prisma.operationsInventoryItem.update({
          where: { id: params.id },
          data: updateData,
        })

        return NextResponse.json(item)
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Invalid input', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error updating inventory item:', error)
        return NextResponse.json(
          { error: 'Failed to update inventory item' },
          { status: 500 }
        )
      }
    }
  )
}

// DELETE - Delete inventory item
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'DELETE' },
    async (request, userInfo) => {
      try {
        const item = await prisma.operationsInventoryItem.findFirst({
          where: {
            id: params.id,
            tenantId: userInfo.tenantId,
          },
        })

        if (!item) {
          return NextResponse.json(
            { error: 'Inventory item not found' },
            { status: 404 }
          )
        }

        await prisma.operationsInventoryItem.delete({
          where: { id: params.id },
        })

        return NextResponse.json({ message: 'Inventory item deleted successfully' })
      } catch (error) {
        console.error('Error deleting inventory item:', error)
        return NextResponse.json(
          { error: 'Failed to delete inventory item' },
          { status: 500 }
        )
      }
    }
  )
}

