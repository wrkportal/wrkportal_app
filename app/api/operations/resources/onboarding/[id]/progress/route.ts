import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

const updateProgressSchema = z.object({
  progress: z.number().int().min(0).max(100),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD']).optional(),
})

// PATCH - Update onboarding progress
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
        const validatedData = updateProgressSchema.parse(body)

        const onboarding = await prisma.operationsOnboarding.findFirst({
          where: {
            id: params.id,
            tenantId: userInfo.tenantId,
          },
        })

        if (!onboarding) {
          return NextResponse.json(
            { error: 'Onboarding record not found' },
            { status: 404 }
          )
        }

        const updateData: any = {
          progress: validatedData.progress,
        }

        // Auto-update status based on progress
        if (validatedData.status) {
          updateData.status = validatedData.status
        } else {
          if (validatedData.progress === 0) {
            updateData.status = 'NOT_STARTED'
          } else if (validatedData.progress === 100) {
            updateData.status = 'COMPLETED'
          } else {
            updateData.status = 'IN_PROGRESS'
          }
        }

        const updated = await prisma.operationsOnboarding.update({
          where: { id: params.id },
          data: updateData,
          include: {
            newHire: {
              select: {
                id: true,
                name: true,
                email: true,
                department: true,
                joinDate: true,
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
        console.error('Error updating onboarding progress:', error)
        return NextResponse.json(
          { error: 'Failed to update onboarding progress' },
          { status: 500 }
        )
      }
    }
  )
}

