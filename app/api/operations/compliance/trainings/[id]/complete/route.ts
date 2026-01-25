import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

// Helper function to safely access operationsComplianceTraining model
function getOperationsComplianceTraining() {
  return (prisma as any).operationsComplianceTraining as any
}

// POST - Mark training as complete
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'UPDATE' },
    async (request, userInfo) => {
      try {
        const operationsComplianceTraining = getOperationsComplianceTraining()
        if (!operationsComplianceTraining) {
          return NextResponse.json(
            { error: 'Operations compliance training model not available' },
            { status: 503 }
          )
        }

        const training = await (operationsComplianceTraining as any).findFirst({
          where: {
            id: params.id,
            tenantId: userInfo.tenantId,
          },
        })

        if (!training) {
          return NextResponse.json(
            { error: 'Training not found' },
            { status: 404 }
          )
        }

        if (training.status === 'COMPLETED') {
          return NextResponse.json(
            { error: 'Training already completed' },
            { status: 400 }
          )
        }

        const updated = await (operationsComplianceTraining as any).update({
          where: { id: params.id },
          data: {
            status: 'COMPLETED',
            completedDate: new Date(),
          },
          include: {
            employee: {
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
        console.error('Error completing training:', error)
        return NextResponse.json(
          { error: 'Failed to complete training' },
          { status: 500 }
        )
      }
    }
  )
}

