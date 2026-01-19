import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

// POST - Publish recognition
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'UPDATE' },
    async (request, userInfo) => {
      try {
        const recognition = await prisma.operationsRecognition.findFirst({
          where: {
            id: params.id,
            tenantId: userInfo.tenantId,
          },
        })

        if (!recognition) {
          return NextResponse.json(
            { error: 'Recognition not found' },
            { status: 404 }
          )
        }

        if (recognition.status === 'PUBLISHED') {
          return NextResponse.json(
            { error: 'Recognition already published' },
            { status: 400 }
          )
        }

        const updated = await prisma.operationsRecognition.update({
          where: { id: params.id },
          data: {
            status: 'PUBLISHED',
            publishedAt: new Date(),
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
        console.error('Error publishing recognition:', error)
        return NextResponse.json(
          { error: 'Failed to publish recognition' },
          { status: 500 }
        )
      }
    }
  )
}

