import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

const updateAssetSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().optional(),
  assetTag: z.string().optional(),
  serialNumber: z.string().optional(),
  status: z.enum(['AVAILABLE', 'ASSIGNED', 'MAINTENANCE', 'RETIRED']).optional(),
  location: z.string().optional(),
  assignedToId: z.string().nullable().optional(),
  purchaseDate: z.string().optional(),
  purchaseCost: z.number().optional(),
  warrantyExpiry: z.string().optional(),
  notes: z.string().optional(),
})

// GET - Get single asset
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withPermissionCheck(
    req,
    { resource: 'it', action: 'READ' },
    async (request, userInfo) => {
      try {
        const { id } = await params

        const asset = await prisma.operationsAsset.findFirst({
          where: {
            id,
            tenantId: userInfo.tenantId,
          },
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        })

        if (!asset) {
          return NextResponse.json(
            { error: 'Asset not found' },
            { status: 404 }
          )
        }

        return NextResponse.json({
          id: asset.id,
          name: asset.name,
          type: asset.category || 'Unknown',
          category: asset.category || 'Other',
          serialNumber: asset.serialNumber || '',
          status: asset.status,
          location: asset.location || '',
          assignedTo: asset.assignedTo?.name || null,
          assignedToId: asset.assignedToId,
          purchaseDate: asset.purchaseDate ? asset.purchaseDate.toISOString().split('T')[0] : '',
          warrantyExpiry: asset.warrantyExpiry ? asset.warrantyExpiry.toISOString().split('T')[0] : '',
          cost: asset.purchaseCost ? Number(asset.purchaseCost) : 0,
          notes: asset.notes || '',
          assetTag: asset.assetTag || '',
        })
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

// PUT - Update asset
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withPermissionCheck(
    req,
    { resource: 'it', action: 'UPDATE' },
    async (request, userInfo) => {
      try {
        const { id } = await params
        const body = await request.json()
        const data = updateAssetSchema.parse(body)

        const updateData: any = {}
        if (data.name) updateData.name = data.name
        if (data.category) updateData.category = data.category
        if (data.assetTag !== undefined) updateData.assetTag = data.assetTag
        if (data.serialNumber !== undefined) updateData.serialNumber = data.serialNumber
        if (data.status) updateData.status = data.status
        if (data.location !== undefined) updateData.location = data.location
        if (data.assignedToId !== undefined) updateData.assignedToId = data.assignedToId
        if (data.purchaseDate) updateData.purchaseDate = new Date(data.purchaseDate)
        if (data.purchaseCost !== undefined) updateData.purchaseCost = data.purchaseCost
        if (data.warrantyExpiry) updateData.warrantyExpiry = new Date(data.warrantyExpiry)
        if (data.notes !== undefined) updateData.notes = data.notes

        const asset = await prisma.operationsAsset.update({
          where: {
            id,
            tenantId: userInfo.tenantId,
          },
          data: updateData,
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        })

        return NextResponse.json({
          id: asset.id,
          name: asset.name,
          type: asset.category || 'Unknown',
          category: asset.category || 'Other',
          serialNumber: asset.serialNumber || '',
          status: asset.status,
          location: asset.location || '',
          assignedTo: asset.assignedTo?.name || null,
          assignedToId: asset.assignedToId,
          purchaseDate: asset.purchaseDate ? asset.purchaseDate.toISOString().split('T')[0] : '',
          warrantyExpiry: asset.warrantyExpiry ? asset.warrantyExpiry.toISOString().split('T')[0] : '',
          cost: asset.purchaseCost ? Number(asset.purchaseCost) : 0,
          notes: asset.notes || '',
          assetTag: asset.assetTag || '',
        })
      } catch (error) {
        console.error('Error updating asset:', error)
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Invalid request data', details: error.errors },
            { status: 400 }
          )
        }
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
  { params }: { params: Promise<{ id: string }> }
) {
  return withPermissionCheck(
    req,
    { resource: 'it', action: 'DELETE' },
    async (request, userInfo) => {
      try {
        const { id } = await params

        // Soft delete by setting status to RETIRED
        await prisma.operationsAsset.update({
          where: {
            id,
            tenantId: userInfo.tenantId,
          },
          data: {
            status: 'RETIRED',
          },
        })

        return NextResponse.json({ success: true })
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

