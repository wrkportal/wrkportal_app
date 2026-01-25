import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

// Helper function to safely access operationsRisk model
function getOperationsRisk() {
  return (prisma as any).operationsRisk as any
}

const updateMitigationSchema = z.object({
  mitigation: z.string().optional(),
  mitigationStatus: z.enum(['NOT_STARTED', 'PLANNED', 'IN_PROGRESS', 'MITIGATED', 'ACCEPTED']).optional(),
})

// PATCH - Update risk mitigation
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
        const validatedData = updateMitigationSchema.parse(body)

        const operationsRisk = getOperationsRisk()
        if (!operationsRisk) {
          return NextResponse.json(
            { error: 'Operations risk model not available' },
            { status: 503 }
          )
        }

        const risk = await (operationsRisk as any).findFirst({
          where: {
            id: params.id,
            tenantId: userInfo.tenantId,
          },
        })

        if (!risk) {
          return NextResponse.json(
            { error: 'Risk not found' },
            { status: 404 }
          )
        }

        const updateData: any = {}
        if (validatedData.mitigation !== undefined) {
          updateData.mitigation = validatedData.mitigation
        }
        if (validatedData.mitigationStatus !== undefined) {
          updateData.mitigationStatus = validatedData.mitigationStatus
        }

        const updated = await (operationsRisk as any).update({
          where: { id: params.id },
          data: updateData,
        })

        return NextResponse.json(updated)
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Invalid input', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error updating risk mitigation:', error)
        return NextResponse.json(
          { error: 'Failed to update risk mitigation' },
          { status: 500 }
        )
      }
    }
  )
}

