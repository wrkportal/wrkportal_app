import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

const createAssetSchema = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  assetTag: z.string().optional(),
  serialNumber: z.string().optional(),
  status: z.enum(['AVAILABLE', 'ASSIGNED', 'MAINTENANCE', 'RETIRED']).default('AVAILABLE'),
  location: z.string().optional(),
  assignedToId: z.string().nullable().optional(),
  purchaseDate: z.string().optional(),
  purchaseCost: z.number().optional(),
  warrantyExpiry: z.string().optional(),
  notes: z.string().optional(),
})

// GET - List IT assets
export async function GET(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'it', action: 'READ' },
    async (request, userInfo) => {
      try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const category = searchParams.get('category')
        const search = searchParams.get('search')

        const where: any = {
          tenantId: userInfo.tenantId,
        }

        if (status && status !== 'all') {
          where.status = status
        }

        if (category && category !== 'all') {
          where.category = category
        }

        if (search) {
          where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { assetTag: { contains: search, mode: 'insensitive' } },
            { serialNumber: { contains: search, mode: 'insensitive' } },
          ]
        }

        const assets = await prisma.operationsAsset.findMany({
          where,
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            createdBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        })

        // Calculate stats
        const stats = {
          total: assets.length,
          available: assets.filter(a => a.status === 'AVAILABLE').length,
          assigned: assets.filter(a => a.status === 'ASSIGNED').length,
          maintenance: assets.filter(a => a.status === 'MAINTENANCE').length,
          retired: assets.filter(a => a.status === 'RETIRED').length,
        }

        // Format assets for IT dashboard
        const formattedAssets = assets.map((asset) => ({
          id: asset.id,
          name: asset.name,
          type: asset.category || 'Unknown',
          category: asset.category || 'Other',
          brand: '', // Not in model, would need to add
          model: '', // Not in model, would need to add
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
        }))

        return NextResponse.json({
          assets: formattedAssets,
          stats,
        })
      } catch (error) {
        console.error('Error fetching IT assets:', error)
        return NextResponse.json(
          { error: 'Failed to fetch assets' },
          { status: 500 }
        )
      }
    }
  )
}

// POST - Create new IT asset
export async function POST(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'it', action: 'CREATE' },
    async (request, userInfo) => {
      try {
        const body = await request.json()
        const data = createAssetSchema.parse(body)

        const asset = await prisma.operationsAsset.create({
          data: {
            tenantId: userInfo.tenantId,
            name: data.name,
            category: data.category || 'IT Equipment',
            assetTag: data.assetTag,
            serialNumber: data.serialNumber,
            status: data.status,
            location: data.location,
            assignedToId: data.assignedToId,
            purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
            purchaseCost: data.purchaseCost ? data.purchaseCost : null,
            warrantyExpiry: data.warrantyExpiry ? new Date(data.warrantyExpiry) : null,
            notes: data.notes,
            createdById: userInfo.userId,
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

        return NextResponse.json({
          id: asset.id,
          name: asset.name,
          type: asset.category || 'Unknown',
          category: asset.category || 'Other',
          serialNumber: asset.serialNumber || '',
          status: asset.status,
          location: asset.location || '',
          assignedTo: asset.assignedTo?.name || null,
          purchaseDate: asset.purchaseDate ? asset.purchaseDate.toISOString().split('T')[0] : '',
          warrantyExpiry: asset.warrantyExpiry ? asset.warrantyExpiry.toISOString().split('T')[0] : '',
          cost: asset.purchaseCost ? Number(asset.purchaseCost) : 0,
          notes: asset.notes || '',
        })
      } catch (error) {
        console.error('Error creating IT asset:', error)
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Invalid request data', details: error.errors },
            { status: 400 }
          )
        }
        return NextResponse.json(
          { error: 'Failed to create asset' },
          { status: 500 }
        )
      }
    }
  )
}

