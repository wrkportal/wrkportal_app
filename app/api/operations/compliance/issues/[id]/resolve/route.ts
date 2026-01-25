import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

// Helper function to safely access operationsComplianceIssue model
function getOperationsComplianceIssue() {
  return (prisma as any).operationsComplianceIssue as any
}

const resolveIssueSchema = z.object({
  resolution: z.string().min(1),
})

// POST - Resolve compliance issue
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'UPDATE' },
    async (request, userInfo) => {
      try {
        const body = await request.json()
        const validatedData = resolveIssueSchema.parse(body)

        const operationsComplianceIssue = getOperationsComplianceIssue()
        if (!operationsComplianceIssue) {
          return NextResponse.json(
            { error: 'Operations compliance issue model not available' },
            { status: 503 }
          )
        }

        const issue = await (operationsComplianceIssue as any).findFirst({
          where: {
            id: params.id,
            tenantId: userInfo.tenantId,
          },
        })

        if (!issue) {
          return NextResponse.json(
            { error: 'Compliance issue not found' },
            { status: 404 }
          )
        }

        if (issue.status === 'RESOLVED' || issue.status === 'CLOSED') {
          return NextResponse.json(
            { error: 'Issue already resolved' },
            { status: 400 }
          )
        }

        const updated = await (operationsComplianceIssue as any).update({
          where: { id: params.id },
          data: {
            status: 'RESOLVED',
            resolvedDate: new Date(),
            resolution: validatedData.resolution,
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

        return NextResponse.json(updated)
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Invalid input', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error resolving compliance issue:', error)
        return NextResponse.json(
          { error: 'Failed to resolve compliance issue' },
          { status: 500 }
        )
      }
    }
  )
}

