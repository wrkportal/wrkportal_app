import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

// Helper function to safely access operationsTraining model
function getOperationsTraining() {
  return (prisma as any).operationsTraining as any
}

// Helper function to safely access operationsTrainingEnrollment model
function getOperationsTrainingEnrollment() {
  return (prisma as any).operationsTrainingEnrollment as any
}

const enrollSchema = z.object({
  employeeId: z.string().min(1),
})

// POST - Enroll employee in training
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'CREATE' },
    async (request, userInfo) => {
      try {
        const body = await request.json()
        const validatedData = enrollSchema.parse(body)

        const operationsTraining = getOperationsTraining()
        const operationsTrainingEnrollment = getOperationsTrainingEnrollment()
        if (!operationsTraining || !operationsTrainingEnrollment) {
          return NextResponse.json(
            { error: 'Operations training models not available' },
            { status: 503 }
          )
        }

        // Verify training exists
        const training = await operationsTraining.findFirst({
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

        // Verify employee exists
        const employee = await prisma.user.findFirst({
          where: {
            id: validatedData.employeeId,
            tenantId: userInfo.tenantId,
          },
        })

        if (!employee) {
          return NextResponse.json(
            { error: 'Employee not found' },
            { status: 404 }
          )
        }

        // Check if already enrolled
        const existing = await operationsTrainingEnrollment.findFirst({
          where: {
            trainingId: params.id,
            employeeId: validatedData.employeeId,
            tenantId: userInfo.tenantId,
          },
        })

        if (existing) {
          return NextResponse.json(
            { error: 'Employee already enrolled in this training' },
            { status: 400 }
          )
        }

        const enrollment = await operationsTrainingEnrollment.create({
          data: {
            trainingId: params.id,
            employeeId: validatedData.employeeId,
            status: 'PENDING',
            progress: 0,
            tenantId: userInfo.tenantId,
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
            training: true,
          },
        })

        return NextResponse.json(enrollment, { status: 201 })
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Invalid input', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error enrolling in training:', error)
        return NextResponse.json(
          { error: 'Failed to enroll in training' },
          { status: 500 }
        )
      }
    }
  )
}

