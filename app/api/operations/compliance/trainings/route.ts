import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

const assignTrainingSchema = z.object({
  employeeId: z.string().min(1),
  trainingName: z.string().min(1),
  dueDate: z.string(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
})

// GET - Get compliance trainings
export async function GET(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'READ' },
    async (request, userInfo) => {
      try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const priority = searchParams.get('priority')
        const overdue = searchParams.get('overdue') === 'true'
        const employeeId = searchParams.get('employeeId')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')
        const skip = (page - 1) * limit

        const where: any = {
          tenantId: userInfo.tenantId,
        }

        if (status) {
          where.status = status
        }
        if (priority) {
          where.priority = priority
        }
        if (employeeId) {
          where.employeeId = employeeId
        }
        if (overdue) {
          where.AND = [
            { status: 'PENDING' },
            { dueDate: { lt: new Date() } },
          ]
        }

        const [trainings, total] = await Promise.all([
          prisma.operationsComplianceTraining.findMany({
            where,
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
            orderBy: [
              { dueDate: 'asc' },
              { priority: 'desc' },
            ],
            skip,
            take: limit,
          }),
          prisma.operationsComplianceTraining.count({ where }),
        ])

        // Calculate stats
        const stats = {
          total: await prisma.operationsComplianceTraining.count({
            where: { tenantId: userInfo.tenantId },
          }),
          pending: await prisma.operationsComplianceTraining.count({
            where: {
              tenantId: userInfo.tenantId,
              status: 'PENDING',
            },
          }),
          overdue: await prisma.operationsComplianceTraining.count({
            where: {
              tenantId: userInfo.tenantId,
              status: 'PENDING',
              dueDate: { lt: new Date() },
            },
          }),
          completed: await prisma.operationsComplianceTraining.count({
            where: {
              tenantId: userInfo.tenantId,
              status: 'COMPLETED',
            },
          }),
        }

        return NextResponse.json({
          trainings,
          stats,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        })
      } catch (error) {
        console.error('Error fetching compliance trainings:', error)
        return NextResponse.json(
          { error: 'Failed to fetch compliance trainings' },
          { status: 500 }
        )
      }
    }
  )
}

// POST - Assign compliance training
export async function POST(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'CREATE' },
    async (request, userInfo) => {
      try {
        const body = await request.json()
        const validatedData = assignTrainingSchema.parse(body)

        const training = await prisma.operationsComplianceTraining.create({
          data: {
            employeeId: validatedData.employeeId,
            trainingName: validatedData.trainingName,
            dueDate: new Date(validatedData.dueDate),
            priority: validatedData.priority || 'MEDIUM',
            status: 'PENDING',
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
        console.error('Error assigning compliance training:', error)
        return NextResponse.json(
          { error: 'Failed to assign compliance training' },
          { status: 500 }
        )
      }
    }
  )
}

