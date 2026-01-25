import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

// Helper function to safely access operationsInventoryItem model
function getOperationsInventoryItem() {
  return (prisma as any).operationsInventoryItem as any
}

// Helper function to safely access operationsInventoryDistribution model
function getOperationsInventoryDistribution() {
  return (prisma as any).operationsInventoryDistribution as any
}

const distributeSchema = z.object({
  itemId: z.string().min(1),
  fromLocation: z.string().min(1),
  toLocation: z.string().min(1),
  quantity: z.number().int().min(1),
  workOrderId: z.string().optional(),
  notes: z.string().optional(),
})

// POST - Distribute inventory
export async function POST(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'UPDATE' },
    async (request, userInfo) => {
      try {
        const body = await request.json()
        const validatedData = distributeSchema.parse(body)

        const operationsInventoryItem = getOperationsInventoryItem()
        const operationsInventoryDistribution = getOperationsInventoryDistribution()
        if (!operationsInventoryItem || !operationsInventoryDistribution) {
          return NextResponse.json(
            { error: 'Operations inventory models not available' },
            { status: 503 }
          )
        }

        // Get the inventory item
        const item = await operationsInventoryItem.findFirst({
          where: {
            id: validatedData.itemId,
            tenantId: userInfo.tenantId,
          },
        })

        if (!item) {
          return NextResponse.json(
            { error: 'Inventory item not found' },
            { status: 404 }
          )
        }

        // Check if sufficient quantity available
        if (item.quantity < validatedData.quantity) {
          return NextResponse.json(
            { error: `Insufficient quantity. Available: ${item.quantity}` },
            { status: 400 }
          )
        }

        // Verify from location matches
        if (item.location !== validatedData.fromLocation) {
          return NextResponse.json(
            { error: `Item is not at location: ${validatedData.fromLocation}` },
            { status: 400 }
          )
        }

        // Create distribution record
        const distribution = await operationsInventoryDistribution.create({
          data: {
            itemId: validatedData.itemId,
            fromLocation: validatedData.fromLocation,
            toLocation: validatedData.toLocation,
            quantity: validatedData.quantity,
            date: new Date(),
            workOrderId: validatedData.workOrderId,
            notes: validatedData.notes,
            status: 'PENDING',
            tenantId: userInfo.tenantId,
          },
        })

        // Update inventory item quantity
        const newQuantity = item.quantity - validatedData.quantity
        let newStatus = item.status
        if (newQuantity <= 0) {
          newStatus = 'OUT_OF_STOCK'
        } else if (newQuantity <= item.reorderLevel) {
          newStatus = 'LOW_STOCK'
        }

        const updatedItem = await operationsInventoryItem.update({
          where: { id: validatedData.itemId },
          data: {
            quantity: newQuantity,
            status: newStatus,
            totalValue: item.unitCost ? newQuantity * item.unitCost : null,
          },
        })

        // If distributing to a different location, create or update item at destination
        if (validatedData.toLocation !== validatedData.fromLocation) {
          const existingAtDestination = await operationsInventoryItem.findFirst({
            where: {
              itemName: item.itemName,
              location: validatedData.toLocation,
              tenantId: userInfo.tenantId,
            },
          })

          if (existingAtDestination) {
            // Update existing item at destination
            await operationsInventoryItem.update({
              where: { id: existingAtDestination.id },
              data: {
                quantity: existingAtDestination.quantity + validatedData.quantity,
                totalValue: existingAtDestination.unitCost
                  ? (existingAtDestination.quantity + validatedData.quantity) * existingAtDestination.unitCost
                  : null,
              },
            })
          } else {
            // Create new item at destination
            await operationsInventoryItem.create({
              data: {
                itemName: item.itemName,
                category: item.category,
                quantity: validatedData.quantity,
                location: validatedData.toLocation,
                status: 'IN_STOCK',
                reorderLevel: item.reorderLevel,
                unitCost: item.unitCost,
                totalValue: item.unitCost ? validatedData.quantity * item.unitCost : null,
                notes: `Distributed from ${validatedData.fromLocation}`,
                tenantId: userInfo.tenantId,
              },
            })
          }
        }

        // Update distribution status to completed
        const completedDistribution = await operationsInventoryDistribution.update({
          where: { id: distribution.id },
          data: { status: 'COMPLETED' },
          include: {
            item: true,
            workOrder: {
              select: {
                id: true,
                workOrderNumber: true,
                title: true,
              },
            },
          },
        })

        return NextResponse.json(completedDistribution, { status: 201 })
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Invalid input', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error distributing inventory:', error)
        return NextResponse.json(
          { error: 'Failed to distribute inventory' },
          { status: 500 }
        )
      }
    }
  )
}

