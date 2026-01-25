import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

// Helper function to safely access operationsInventoryDistribution model
function getOperationsInventoryDistribution() {
  return (prisma as any).operationsInventoryDistribution as any
}

// GET - Get distribution history
export async function GET(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'READ' },
    async (request, userInfo) => {
      try {
        const { searchParams } = new URL(request.url)
        const itemId = searchParams.get('itemId')
        const workOrderId = searchParams.get('workOrderId')
        const status = searchParams.get('status')
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')
        const skip = (page - 1) * limit

        const where: any = {
          tenantId: userInfo.tenantId,
        }

        if (itemId) {
          where.itemId = itemId
        }
        if (workOrderId) {
          where.workOrderId = workOrderId
        }
        if (status) {
          where.status = status
        }
        if (startDate || endDate) {
          where.date = {}
          if (startDate) {
            where.date.gte = new Date(startDate)
          }
          if (endDate) {
            where.date.lte = new Date(endDate)
          }
        }

        const operationsInventoryDistribution = getOperationsInventoryDistribution()
        if (!operationsInventoryDistribution) {
          return NextResponse.json(
            { error: 'Operations inventory distribution model not available' },
            { status: 503 }
          )
        }

        const [distributions, total] = await Promise.all([
          operationsInventoryDistribution.findMany({
            where,
            include: {
              item: {
                select: {
                  id: true,
                  itemName: true,
                  category: true,
                },
              },
              workOrder: {
                select: {
                  id: true,
                  workOrderNumber: true,
                  title: true,
                },
              },
            },
            orderBy: {
              date: 'desc',
            },
            skip,
            take: limit,
          }),
          operationsInventoryDistribution.count({ where }),
        ])

        return NextResponse.json({
          distributions,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        })
      } catch (error) {
        console.error('Error fetching distribution history:', error)
        return NextResponse.json(
          { error: 'Failed to fetch distribution history' },
          { status: 500 }
        )
      }
    }
  )
}

