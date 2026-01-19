import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

const updateMaintenanceSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.enum(['PREVENTIVE', 'CORRECTIVE', 'EMERGENCY', 'INSPECTION']).optional(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DEFERRED']).optional(),
  assetId: z.string().optional().nullable(),
  vendorId: z.string().optional().nullable(),
  scheduledDate: z.string().optional(),
  completedDate: z.string().optional(),
  technicianId: z.string().optional().nullable(),
  technicianName: z.string().optional(),
  cost: z.number().optional(),
  frequency: z.string().optional(),
  nextScheduledDate: z.string().optional(),
  notes: z.string().optional(),
})

// GET - Get maintenance by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'READ' },
    async (request, userInfo) => {
      try {
        const maintenance = await prisma.operationsMaintenance.findFirst({
          where: {
            id: params.id,
            tenantId: userInfo.tenantId,
          },
          include: {
            asset: {
              select: {
                id: true,
                name: true,
                serialNumber: true,
                category: true,
              },
            },
            vendor: {
              select: {
                id: true,
                name: true,
                category: true,
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
            updatedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        })

        if (!maintenance) {
          return NextResponse.json(
            { error: 'Maintenance record not found' },
            { status: 404 }
          )
        }

        return NextResponse.json({ maintenance })
      } catch (error) {
        console.error('Error fetching maintenance:', error)
        return NextResponse.json(
          { error: 'Failed to fetch maintenance record' },
          { status: 500 }
        )
      }
    }
  )
}

// PATCH - Update maintenance
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
        const validatedData = updateMaintenanceSchema.parse(body)

        const maintenance = await prisma.operationsMaintenance.findFirst({
          where: {
            id: params.id,
            tenantId: userInfo.tenantId,
          },
        })

        if (!maintenance) {
          return NextResponse.json(
            { error: 'Maintenance record not found' },
            { status: 404 }
          )
        }

        const updateData: any = {
          ...validatedData,
          updatedById: userInfo.userId,
          scheduledDate: validatedData.scheduledDate
            ? new Date(validatedData.scheduledDate)
            : undefined,
          completedDate: validatedData.completedDate
            ? new Date(validatedData.completedDate)
            : undefined,
          nextScheduledDate: validatedData.nextScheduledDate
            ? new Date(validatedData.nextScheduledDate)
            : undefined,
          cost: validatedData.cost !== undefined ? validatedData.cost : undefined,
        }

        // Set completed date if status is COMPLETED
        if (validatedData.status === 'COMPLETED' && !maintenance.completedDate) {
          updateData.completedDate = new Date()
        }

        const updatedMaintenance = await prisma.operationsMaintenance.update({
          where: { id: params.id },
          data: updateData,
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
            updatedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        })

        return NextResponse.json({ maintenance: updatedMaintenance })
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Invalid input', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error updating maintenance:', error)
        return NextResponse.json(
          { error: 'Failed to update maintenance record', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

// DELETE - Delete maintenance
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'DELETE' },
    async (request, userInfo) => {
      try {
        const maintenance = await prisma.operationsMaintenance.findFirst({
          where: {
            id: params.id,
            tenantId: userInfo.tenantId,
          },
        })

        if (!maintenance) {
          return NextResponse.json(
            { error: 'Maintenance record not found' },
            { status: 404 }
          )
        }

        await prisma.operationsMaintenance.delete({
          where: { id: params.id },
        })

        return NextResponse.json({ message: 'Maintenance record deleted successfully' })
      } catch (error) {
        console.error('Error deleting maintenance:', error)
        return NextResponse.json(
          { error: 'Failed to delete maintenance record' },
          { status: 500 }
        )
      }
    }
  )
}

