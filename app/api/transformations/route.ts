/**
 * Phase 5.4: Data Transformation Builder API
 * 
 * CRUD operations for transformations
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TransformationStatus } from '@prisma/client'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'
import { z } from 'zod'

const createTransformationSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  inputDatasetId: z.string(),
  isVisual: z.boolean().default(false),
  pipelineConfig: z.record(z.any()).optional(),
})

// GET /api/transformations - List transformations
export async function GET(request: NextRequest) {
  return withPermissionCheck(
    request,
    { resource: 'transformations', action: 'READ' },
    async (req, userInfo) => {
      try {
        if (!prisma.reportingTransformation) {
          return NextResponse.json({ transformations: [] })
        }

        const { searchParams } = new URL(req.url)
        const isVisual = searchParams.get('visual') === 'true'
        const statusParam = searchParams.get('status')
        const isValidStatus = (value: string | null): value is TransformationStatus =>
          !!value && Object.values(TransformationStatus).includes(value as TransformationStatus)
        const status: TransformationStatus | undefined = isValidStatus(statusParam)
          ? (statusParam as TransformationStatus)
          : undefined

        const transformations = await (prisma as any).reportingTransformation.findMany({
          where: {
            tenantId: userInfo.tenantId,
            ...(isVisual !== null ? { isVisual } : {}),
            ...(status ? { status } : {}),
          },
          include: {
            inputDataset: {
              select: {
                id: true,
                name: true,
              },
            },
            outputDataset: {
              select: {
                id: true,
                name: true,
              },
            },
            createdBy: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            steps: {
              orderBy: {
                stepOrder: 'asc',
              },
            },
          },
          orderBy: {
            updatedAt: 'desc',
          },
          take: 100,
        })

        return NextResponse.json({ transformations })
      } catch (error: any) {
        console.error('Error fetching transformations:', error)
        return NextResponse.json(
          { error: 'Failed to fetch transformations', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

// POST /api/transformations - Create transformation
export async function POST(request: NextRequest) {
  return withPermissionCheck(
    request,
    { resource: 'transformations', action: 'CREATE' },
    async (req, userInfo) => {
      try {
        const body = await req.json()
        const data = createTransformationSchema.parse(body)

        if (!prisma.reportingTransformation) {
          return NextResponse.json(
            { error: 'Transformation model not available' },
            { status: 500 }
          )
        }

        // Verify input dataset exists and belongs to tenant
        const inputDataset = await prisma.reportingDataset.findUnique({
          where: { id: data.inputDatasetId },
        })

        if (!inputDataset || inputDataset.tenantId !== userInfo.tenantId) {
          return NextResponse.json(
            { error: 'Input dataset not found or access denied' },
            { status: 404 }
          )
        }

        const transformation = await (prisma as any).reportingTransformation.create({
          data: {
            tenantId: userInfo.tenantId,
            name: data.name,
            description: data.description,
            inputDatasetId: data.inputDatasetId,
            isVisual: data.isVisual,
            pipelineConfig: data.pipelineConfig || null,
            config: {}, // Legacy field
            createdById: userInfo.userId,
          },
          include: {
            inputDataset: {
              select: {
                id: true,
                name: true,
              },
            },
            steps: true,
          },
        }) as any

        return NextResponse.json({ transformation }, { status: 201 })
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Validation error', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error creating transformation:', error)
        return NextResponse.json(
          { error: 'Failed to create transformation', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

