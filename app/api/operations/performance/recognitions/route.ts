import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

const createRecognitionSchema = z.object({
  employeeId: z.string().min(1),
  achievement: z.string().min(1),
  category: z.enum(['QUALITY', 'EXCELLENCE', 'PRODUCTIVITY', 'INNOVATION', 'TEAMWORK']),
  date: z.string().optional(),
  publish: z.boolean().optional(),
})

// GET - Get recognitions
export async function GET(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'READ' },
    async (request, userInfo) => {
      try {
        const { searchParams } = new URL(request.url)
        const employeeId = searchParams.get('employeeId')
        const category = searchParams.get('category')
        const status = searchParams.get('status')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')
        const skip = (page - 1) * limit

        const where: any = {
          tenantId: userInfo.tenantId,
        }

        if (employeeId) {
          where.employeeId = employeeId
        }
        if (category) {
          where.category = category
        }
        if (status) {
          where.status = status
        }

        const [recognitions, total] = await Promise.all([
          prisma.operationsRecognition.findMany({
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
            orderBy: {
              date: 'desc',
            },
            skip,
            take: limit,
          }),
          prisma.operationsRecognition.count({ where }),
        ])

        // Calculate stats
        const thisMonth = new Date()
        thisMonth.setDate(1)
        thisMonth.setHours(0, 0, 0, 0)

        const stats = {
          total: await prisma.operationsRecognition.count({
            where: { tenantId: userInfo.tenantId },
          }),
          thisMonth: await prisma.operationsRecognition.count({
            where: {
              tenantId: userInfo.tenantId,
              date: {
                gte: thisMonth,
              },
            },
          }),
          published: await prisma.operationsRecognition.count({
            where: {
              tenantId: userInfo.tenantId,
              status: 'PUBLISHED',
            },
          }),
          draft: await prisma.operationsRecognition.count({
            where: {
              tenantId: userInfo.tenantId,
              status: 'DRAFT',
            },
          }),
          categories: await prisma.operationsRecognition.groupBy({
            by: ['category'],
            where: { tenantId: userInfo.tenantId },
            _count: true,
          }),
        }

        return NextResponse.json({
          recognitions,
          stats,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        })
      } catch (error) {
        console.error('Error fetching recognitions:', error)
        return NextResponse.json(
          { error: 'Failed to fetch recognitions' },
          { status: 500 }
        )
      }
    }
  )
}

// POST - Create recognition
export async function POST(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'CREATE' },
    async (request, userInfo) => {
      try {
        const body = await request.json()
        const validatedData = createRecognitionSchema.parse(body)

        const recognition = await prisma.operationsRecognition.create({
          data: {
            employeeId: validatedData.employeeId,
            achievement: validatedData.achievement,
            category: validatedData.category,
            date: validatedData.date ? new Date(validatedData.date) : new Date(),
            status: validatedData.publish ? 'PUBLISHED' : 'DRAFT',
            publishedAt: validatedData.publish ? new Date() : null,
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

        return NextResponse.json(recognition, { status: 201 })
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Invalid input', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error creating recognition:', error)
        return NextResponse.json(
          { error: 'Failed to create recognition' },
          { status: 500 }
        )
      }
    }
  )
}

