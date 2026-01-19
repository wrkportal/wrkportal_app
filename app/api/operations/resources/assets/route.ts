import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

const createAssetSchema = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  serialNumber: z.string().optional(),
  assignedToId: z.string().optional().nullable(),
  status: z.enum(['AVAILABLE', 'ASSIGNED', 'MAINTENANCE', 'RETIRED']).optional(),
  location: z.string().optional(),
  purchaseDate: z.string().optional(),
  purchaseCost: z.number().optional(),
  warrantyExpiry: z.string().optional(),
  notes: z.string().optional(),
})

// GET - List assets
export async function GET(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'READ' },
    async (request, userInfo) => {
      try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const assignedToId = searchParams.get('assignedToId')
        const category = searchParams.get('category')
        const search = searchParams.get('search')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')
        const skip = (page - 1) * limit

        const where: any = {
          tenantId: userInfo.tenantId,
        }

        if (status) {
          where.status = status
        }
        if (assignedToId) {
          where.assignedToId = assignedToId
        }
        if (category) {
          where.category = category
        }
        if (search) {
          where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { serialNumber: { contains: search, mode: 'insensitive' } },
          ]
        }

        const [assets, total] = await Promise.all([
          prisma.operationsAsset.findMany({
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
            },
            orderBy: {
              createdAt: 'desc',
            },
            skip,
            take: limit,
          }),
          prisma.operationsAsset.count({ where }),
        ])

        // Calculate stats
        const stats = {
          total: await prisma.operationsAsset.count({
            where: { tenantId: userInfo.tenantId },
          }),
          assigned: await prisma.operationsAsset.count({
            where: {
              tenantId: userInfo.tenantId,
              status: 'ASSIGNED',
            },
          }),
          available: await prisma.operationsAsset.count({
            where: {
              tenantId: userInfo.tenantId,
              status: 'AVAILABLE',
            },
          }),
          maintenance: await prisma.operationsAsset.count({
            where: {
              tenantId: userInfo.tenantId,
              status: 'MAINTENANCE',
            },
          }),
        }

        return NextResponse.json({
          assets,
          stats,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        })
      } catch (error) {
        console.error('Error fetching assets:', error)
        return NextResponse.json(
          { error: 'Failed to fetch assets' },
          { status: 500 }
        )
      }
    }
  )
}

// POST - Create asset
export async function POST(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'CREATE' },
    async (request, userInfo) => {
      try {
        const body = await request.json()
        const validatedData = createAssetSchema.parse(body)

        const asset = await prisma.operationsAsset.create({
          data: {
            name: validatedData.name,
            category: validatedData.category,
            serialNumber: validatedData.serialNumber,
            assignedToId: validatedData.assignedToId,
            status: validatedData.status || (validatedData.assignedToId ? 'ASSIGNED' : 'AVAILABLE'),
            location: validatedData.location,
            purchaseDate: validatedData.purchaseDate ? new Date(validatedData.purchaseDate) : null,
            purchaseCost: validatedData.purchaseCost,
            warrantyExpiry: validatedData.warrantyExpiry ? new Date(validatedData.warrantyExpiry) : null,
            notes: validatedData.notes,
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
          },
        })

        return NextResponse.json(asset, { status: 201 })
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Invalid input', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error creating asset:', error)
        return NextResponse.json(
          { error: 'Failed to create asset' },
          { status: 500 }
        )
      }
    }
  )
}

