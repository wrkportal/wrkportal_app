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

const createTrainingSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['MANDATORY', 'OPTIONAL']),
  description: z.string().optional(),
  duration: z.number().int().positive().optional(),
})

const enrollSchema = z.object({
  employeeId: z.string().min(1),
})

// GET - List trainings
export async function GET(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'READ' },
    async (request, userInfo) => {
      try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const type = searchParams.get('type')
        const includeEnrollments = searchParams.get('includeEnrollments') === 'true'

        const where: any = {
          tenantId: userInfo.tenantId,
        }

        if (status) {
          where.status = status
        }
        if (type) {
          where.type = type
        }

        const operationsTraining = getOperationsTraining()
        const operationsTrainingEnrollment = getOperationsTrainingEnrollment()
        if (!operationsTraining || !operationsTrainingEnrollment) {
          return NextResponse.json(
            { error: 'Operations training models not available' },
            { status: 503 }
          )
        }

        const trainings = await operationsTraining.findMany({
          where,
          include: {
            enrollments: includeEnrollments ? {
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
            } : false,
          },
          orderBy: {
            createdAt: 'desc',
          },
        })

        // Calculate stats for each training
        const trainingsWithStats = await Promise.all(
          trainings.map(async (training: any) => {
            const enrollments = await operationsTrainingEnrollment.findMany({
              where: {
                trainingId: training.id,
                tenantId: userInfo.tenantId,
              },
            })

            return {
              ...training,
              enrolled: enrollments.length,
              completed: enrollments.filter((e: any) => e.status === 'COMPLETED').length,
              employees: includeEnrollments && training.enrollments
                ? training.enrollments.length
                : enrollments.length,
            }
          })
        )

        // Calculate overall stats
        const stats = {
          total: trainings.length,
          active: trainings.filter((t: any) => t.status === 'ONGOING').length,
          completed: trainings.filter((t: any) => t.status === 'COMPLETED').length,
          totalEnrolled: await operationsTrainingEnrollment.count({
            where: { tenantId: userInfo.tenantId },
          }),
        }

        return NextResponse.json({
          trainings: trainingsWithStats,
          stats,
        })
      } catch (error) {
        console.error('Error fetching trainings:', error)
        return NextResponse.json(
          { error: 'Failed to fetch trainings' },
          { status: 500 }
        )
      }
    }
  )
}

// POST - Create training
export async function POST(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'CREATE' },
    async (request, userInfo) => {
      try {
        const body = await request.json()
        const validatedData = createTrainingSchema.parse(body)

        const operationsTraining = getOperationsTraining()
        if (!operationsTraining) {
          return NextResponse.json(
            { error: 'Operations training model not available' },
            { status: 503 }
          )
        }

        const training = await operationsTraining.create({
          data: {
            name: validatedData.name,
            type: validatedData.type,
            description: validatedData.description,
            duration: validatedData.duration,
            status: 'PENDING',
            tenantId: userInfo.tenantId,
          },
        })

        return NextResponse.json(training, { status: 201 })
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Invalid input', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error creating training:', error)
        return NextResponse.json(
          { error: 'Failed to create training' },
          { status: 500 }
        )
      }
    }
  )
}

