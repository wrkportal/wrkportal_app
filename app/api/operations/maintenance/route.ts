import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

const createMaintenanceSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['PREVENTIVE', 'CORRECTIVE', 'EMERGENCY', 'INSPECTION']),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DEFERRED']).optional(),
  assetId: z.string().optional().nullable(),
  vendorId: z.string().optional().nullable(),
  scheduledDate: z.string(),
  technicianId: z.string().optional().nullable(),
  technicianName: z.string().optional(),
  cost: z.number().optional(),
  frequency: z.string().optional(),
  nextScheduledDate: z.string().optional(),
  notes: z.string().optional(),
})

// GET - List maintenance records
export async function GET(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'READ' },
    async (request, userInfo) => {
      try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const type = searchParams.get('type')
        const assetId = searchParams.get('assetId')
        const vendorId = searchParams.get('vendorId')
        const technicianId = searchParams.get('technicianId')
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
        if (type) {
          where.type = type
        }
        if (assetId) {
          where.assetId = assetId
        }
        if (vendorId) {
          where.vendorId = vendorId
        }
        if (technicianId) {
          where.technicianId = technicianId
        }
        if (search) {
          where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { maintenanceNumber: { contains: search, mode: 'insensitive' } },
          ]
        }

        const [maintenance, total] = await Promise.all([
          prisma.operationsMaintenance.findMany({
            where,
            include: {
              asset: {
                select: {
                  id: true,
                  name: true,
                  serialNumber: true,
                },
              },
              vendor: {
                select: {
                  id: true,
                  name: true,
                },
              },
              technician: {
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
                  email: true,
                },
              },
            },
            orderBy: {
              scheduledDate: 'desc',
            },
            skip,
            take: limit,
          }),
          prisma.operationsMaintenance.count({ where }),
        ])

        return NextResponse.json({
          maintenance,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        })
      } catch (error) {
        console.error('Error fetching maintenance:', error)
        return NextResponse.json(
          { error: 'Failed to fetch maintenance records' },
          { status: 500 }
        )
      }
    }
  )
}

// POST - Create maintenance record
export async function POST(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'CREATE' },
    async (request, userInfo) => {
      try {
        const body = await request.json()
        const validatedData = createMaintenanceSchema.parse(body)

        // Generate maintenance number
        const count = await prisma.operationsMaintenance.count({
          where: { tenantId: userInfo.tenantId },
        })
        const maintenanceNumber = `MNT-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`

        const maintenance = await prisma.operationsMaintenance.create({
          data: {
            ...validatedData,
            tenantId: userInfo.tenantId,
            maintenanceNumber,
            createdById: userInfo.userId,
            assetId: validatedData.assetId || null,
            vendorId: validatedData.vendorId || null,
            technicianId: validatedData.technicianId || null,
            scheduledDate: new Date(validatedData.scheduledDate),
            nextScheduledDate: validatedData.nextScheduledDate
              ? new Date(validatedData.nextScheduledDate)
              : undefined,
            cost: validatedData.cost ? validatedData.cost : undefined,
          },
          include: {
            asset: {
              select: {
                id: true,
                name: true,
                serialNumber: true,
              },
            },
            vendor: {
              select: {
                id: true,
                name: true,
              },
            },
            technician: {
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
                email: true,
              },
            },
          },
        })

        return NextResponse.json({ maintenance }, { status: 201 })
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Invalid input', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error creating maintenance:', error)
        return NextResponse.json(
          { error: 'Failed to create maintenance record', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

