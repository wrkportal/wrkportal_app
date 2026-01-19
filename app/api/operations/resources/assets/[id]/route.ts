import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

const updateAssetSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().optional().nullable(),
  serialNumber: z.string().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
  status: z.enum(['AVAILABLE', 'ASSIGNED', 'MAINTENANCE', 'RETIRED']).optional(),
  location: z.string().optional().nullable(),
  purchaseDate: z.string().optional().nullable(),
  purchaseCost: z.number().optional().nullable(),
  warrantyExpiry: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

// GET - Get asset by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'READ' },
    async (request, userInfo) => {
      try {
        const asset = await prisma.operationsAsset.findFirst({
          where: {
            id: params.id,
            tenantId: userInfo.tenantId,
          },
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true,
                department: true,
              },
            },
            workOrders: {
              select: {
                id: true,
                workOrderNumber: true,
                title: true,
                status: true,
                scheduledDate: true,
                completedDate: true,
              },
              orderBy: {
                createdAt: 'desc',
              },
              take: 10,
            },
          },
        })

        if (!asset) {
          return NextResponse.json(
            { error: 'Asset not found' },
            { status: 404 }
          )
        }

        return NextResponse.json(asset)
      } catch (error) {
        console.error('Error fetching asset:', error)
        return NextResponse.json(
          { error: 'Failed to fetch asset' },
          { status: 500 }
        )
      }
    }
  )
}

// PATCH - Update asset
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
        const validatedData = updateAssetSchema.parse(body)

        const existing = await prisma.operationsAsset.findFirst({
          where: {
            id: params.id,
            tenantId: userInfo.tenantId,
          },
        })

        if (!existing) {
          return NextResponse.json(
            { error: 'Asset not found' },
            { status: 404 }
          )
        }

        const updateData: any = {}
        if (validatedData.name !== undefined) updateData.name = validatedData.name
        if (validatedData.category !== undefined) updateData.category = validatedData.category
        if (validatedData.serialNumber !== undefined) updateData.serialNumber = validatedData.serialNumber
        if (validatedData.assignedToId !== undefined) {
          updateData.assignedToId = validatedData.assignedToId
          // Auto-update status based on assignment
          if (validatedData.assignedToId && !validatedData.status) {
            updateData.status = 'ASSIGNED'
          } else if (!validatedData.assignedToId && !validatedData.status) {
            updateData.status = 'AVAILABLE'
          }
        }
        if (validatedData.status !== undefined) updateData.status = validatedData.status
        if (validatedData.location !== undefined) updateData.location = validatedData.location
        if (validatedData.purchaseDate !== undefined) {
          updateData.purchaseDate = validatedData.purchaseDate ? new Date(validatedData.purchaseDate) : null
        }
        if (validatedData.purchaseCost !== undefined) updateData.purchaseCost = validatedData.purchaseCost
        if (validatedData.warrantyExpiry !== undefined) {
          updateData.warrantyExpiry = validatedData.warrantyExpiry ? new Date(validatedData.warrantyExpiry) : null
        }
        if (validatedData.notes !== undefined) updateData.notes = validatedData.notes

        const asset = await prisma.operationsAsset.update({
          where: { id: params.id },
          data: updateData,
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true,
                department: true,
              },
            },
          },
        })

        return NextResponse.json(asset)
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Invalid input', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error updating asset:', error)
        return NextResponse.json(
          { error: 'Failed to update asset' },
          { status: 500 }
        )
      }
    }
  )
}

// DELETE - Delete asset
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'DELETE' },
    async (request, userInfo) => {
      try {
        const asset = await prisma.operationsAsset.findFirst({
          where: {
            id: params.id,
            tenantId: userInfo.tenantId,
          },
        })

        if (!asset) {
          return NextResponse.json(
            { error: 'Asset not found' },
            { status: 404 }
          )
        }

        await prisma.operationsAsset.delete({
          where: { id: params.id },
        })

        return NextResponse.json({ message: 'Asset deleted successfully' })
      } catch (error) {
        console.error('Error deleting asset:', error)
        return NextResponse.json(
          { error: 'Failed to delete asset' },
          { status: 500 }
        )
      }
    }
  )
}

