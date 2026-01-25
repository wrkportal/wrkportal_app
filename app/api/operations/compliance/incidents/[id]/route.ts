import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

// Helper function to safely access operationsIncident model
function getOperationsIncident() {
  return (prisma as any).operationsIncident as any
}

const updateIncidentSchema = z.object({
  status: z.enum(['OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED']).optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  resolution: z.string().optional(),
})

// GET - Get incident by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'READ' },
    async (request, userInfo) => {
      try {
        const operationsIncident = getOperationsIncident()
        if (!operationsIncident) {
          return NextResponse.json(
            { error: 'Operations incident model not available' },
            { status: 503 }
          )
        }

        const incident = await (operationsIncident as any).findFirst({
          where: {
            id: params.id,
            tenantId: userInfo.tenantId,
          },
          include: {
            reportedBy: {
              select: {
                id: true,
                name: true,
                email: true,
                department: true,
              },
            },
          },
        })

        if (!incident) {
          return NextResponse.json(
            { error: 'Incident not found' },
            { status: 404 }
          )
        }

        return NextResponse.json(incident)
      } catch (error) {
        console.error('Error fetching incident:', error)
        return NextResponse.json(
          { error: 'Failed to fetch incident' },
          { status: 500 }
        )
      }
    }
  )
}

// PATCH - Update incident
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
        const validatedData = updateIncidentSchema.parse(body)

        const operationsIncident = getOperationsIncident()
        if (!operationsIncident) {
          return NextResponse.json(
            { error: 'Operations incident model not available' },
            { status: 503 }
          )
        }

        const incident = await (operationsIncident as any).findFirst({
          where: {
            id: params.id,
            tenantId: userInfo.tenantId,
          },
        })

        if (!incident) {
          return NextResponse.json(
            { error: 'Incident not found' },
            { status: 404 }
          )
        }

        const updateData: any = {}
        if (validatedData.status !== undefined) {
          updateData.status = validatedData.status
          if (validatedData.status === 'RESOLVED' || validatedData.status === 'CLOSED') {
            updateData.resolvedDate = new Date()
          }
        }
        if (validatedData.severity !== undefined) {
          updateData.severity = validatedData.severity
        }
        if (validatedData.resolution !== undefined) {
          updateData.resolution = validatedData.resolution
        }

        const updated = await (operationsIncident as any).update({
          where: { id: params.id },
          data: updateData,
          include: {
            reportedBy: {
              select: {
                id: true,
                name: true,
                email: true,
                department: true,
              },
            },
          },
        })

        return NextResponse.json(updated)
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Invalid input', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error updating incident:', error)
        return NextResponse.json(
          { error: 'Failed to update incident' },
          { status: 500 }
        )
      }
    }
  )
}

