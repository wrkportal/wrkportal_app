import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

// POST - Approve incentive
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'UPDATE' },
    async (request, userInfo) => {
      try {
        const incentive = await prisma.operationsIncentive.findFirst({
          where: {
            id: params.id,
            tenantId: userInfo.tenantId,
          },
        })

        if (!incentive) {
          return NextResponse.json(
            { error: 'Incentive not found' },
            { status: 404 }
          )
        }

        if (incentive.status === 'APPROVED') {
          return NextResponse.json(
            { error: 'Incentive already approved' },
            { status: 400 }
          )
        }

        const updated = await prisma.operationsIncentive.update({
          where: { id: params.id },
          data: {
            status: 'APPROVED',
            approvedById: userInfo.userId,
            approvedAt: new Date(),
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
            approvedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        })

        return NextResponse.json(updated)
      } catch (error) {
        console.error('Error approving incentive:', error)
        return NextResponse.json(
          { error: 'Failed to approve incentive' },
          { status: 500 }
        )
      }
    }
  )
}

