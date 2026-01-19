import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

const createVendorSchema = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  contactPerson: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  zipCode: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  taxId: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  contractValue: z.number().optional(),
  contractStartDate: z.string().optional(),
  contractEndDate: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  notes: z.string().optional(),
})

// GET - List vendors
export async function GET(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'READ' },
    async (request, userInfo) => {
      try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
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
        if (category) {
          where.category = category
        }
        if (search) {
          where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { contactPerson: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ]
        }

        const [vendors, total] = await Promise.all([
          prisma.operationsVendor.findMany({
            where,
            include: {
              createdBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              updatedBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
            skip,
            take: limit,
          }),
          prisma.operationsVendor.count({ where }),
        ])

        return NextResponse.json({
          vendors,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        })
      } catch (error) {
        console.error('Error fetching vendors:', error)
        return NextResponse.json(
          { error: 'Failed to fetch vendors' },
          { status: 500 }
        )
      }
    }
  )
}

// POST - Create vendor
export async function POST(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'CREATE' },
    async (request, userInfo) => {
      try {
        const body = await request.json()
        const validatedData = createVendorSchema.parse(body)

        // Generate request number
        const count = await prisma.operationsVendor.count({
          where: { tenantId: userInfo.tenantId },
        })
        const vendorNumber = `VND-${String(count + 1).padStart(6, '0')}`

        const vendor = await prisma.operationsVendor.create({
          data: {
            ...validatedData,
            tenantId: userInfo.tenantId,
            createdById: userInfo.userId,
            contractValue: validatedData.contractValue
              ? validatedData.contractValue
              : undefined,
            contractStartDate: validatedData.contractStartDate
              ? new Date(validatedData.contractStartDate)
              : undefined,
            contractEndDate: validatedData.contractEndDate
              ? new Date(validatedData.contractEndDate)
              : undefined,
            email: validatedData.email === '' ? null : validatedData.email,
            website: validatedData.website === '' ? null : validatedData.website,
          },
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        })

        return NextResponse.json({ vendor }, { status: 201 })
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Invalid input', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error creating vendor:', error)
        return NextResponse.json(
          { error: 'Failed to create vendor', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

