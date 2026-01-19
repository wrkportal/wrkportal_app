import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

const updateVendorSchema = z.object({
  name: z.string().min(1).optional(),
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

// GET - Get vendor by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'READ' },
    async (request, userInfo) => {
      try {
        const vendor = await prisma.operationsVendor.findFirst({
          where: {
            id: params.id,
            tenantId: userInfo.tenantId,
          },
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
            serviceRequests: {
              take: 10,
              orderBy: { createdAt: 'desc' },
            },
            maintenanceRecords: {
              take: 10,
              orderBy: { createdAt: 'desc' },
            },
          },
        })

        if (!vendor) {
          return NextResponse.json(
            { error: 'Vendor not found' },
            { status: 404 }
          )
        }

        return NextResponse.json({ vendor })
      } catch (error) {
        console.error('Error fetching vendor:', error)
        return NextResponse.json(
          { error: 'Failed to fetch vendor' },
          { status: 500 }
        )
      }
    }
  )
}

// PATCH - Update vendor
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
        const validatedData = updateVendorSchema.parse(body)

        const vendor = await prisma.operationsVendor.findFirst({
          where: {
            id: params.id,
            tenantId: userInfo.tenantId,
          },
        })

        if (!vendor) {
          return NextResponse.json(
            { error: 'Vendor not found' },
            { status: 404 }
          )
        }

        const updatedVendor = await prisma.operationsVendor.update({
          where: { id: params.id },
          data: {
            ...validatedData,
            updatedById: userInfo.userId,
            contractValue: validatedData.contractValue !== undefined
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
            updatedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        })

        return NextResponse.json({ vendor: updatedVendor })
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Invalid input', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error updating vendor:', error)
        return NextResponse.json(
          { error: 'Failed to update vendor', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

// DELETE - Delete vendor
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'DELETE' },
    async (request, userInfo) => {
      try {
        const vendor = await prisma.operationsVendor.findFirst({
          where: {
            id: params.id,
            tenantId: userInfo.tenantId,
          },
        })

        if (!vendor) {
          return NextResponse.json(
            { error: 'Vendor not found' },
            { status: 404 }
          )
        }

        await prisma.operationsVendor.delete({
          where: { id: params.id },
        })

        return NextResponse.json({ message: 'Vendor deleted successfully' })
      } catch (error) {
        console.error('Error deleting vendor:', error)
        return NextResponse.json(
          { error: 'Failed to delete vendor' },
          { status: 500 }
        )
      }
    }
  )
}

