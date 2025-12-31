/**
 * Phase 5.4: Data Transformation Builder API - Single Transformation
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'
import { z } from 'zod'

const updateTransformationSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  pipelineConfig: z.record(z.any()).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ERROR']).optional(),
  previewEnabled: z.boolean().optional(),
  previewRowCount: z.number().int().min(1).max(10000).optional(),
})

// GET /api/transformations/[id] - Get transformation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  return withPermissionCheck(
    request,
    { resource: 'transformations', action: 'READ' },
    async (req, userInfo) => {
      try {
        const resolvedParams = 'then' in params ? await params : params
        
        if (!prisma.reportingTransformation) {
          return NextResponse.json(
            { error: 'Transformation model not available' },
            { status: 500 }
          )
        }

        const transformation = await prisma.reportingTransformation.findUnique({
          where: { id: resolvedParams.id },
          include: {
            inputDataset: {
              select: {
                id: true,
                name: true,
                schema: true,
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
        })

        if (!transformation || transformation.tenantId !== userInfo.tenantId) {
          return NextResponse.json(
            { error: 'Transformation not found' },
            { status: 404 }
          )
        }

        return NextResponse.json({ transformation })
      } catch (error: any) {
        console.error('Error fetching transformation:', error)
        return NextResponse.json(
          { error: 'Failed to fetch transformation', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

// PATCH /api/transformations/[id] - Update transformation
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  return withPermissionCheck(
    request,
    { resource: 'transformations', action: 'UPDATE' },
    async (req, userInfo) => {
      try {
        const resolvedParams = 'then' in params ? await params : params
        const body = await req.json()
        const data = updateTransformationSchema.parse(body)

        if (!prisma.reportingTransformation) {
          return NextResponse.json(
            { error: 'Transformation model not available' },
            { status: 500 }
          )
        }

        // Verify transformation exists and belongs to tenant
        const existing = await prisma.reportingTransformation.findUnique({
          where: { id: resolvedParams.id },
        })

        if (!existing || existing.tenantId !== userInfo.tenantId) {
          return NextResponse.json(
            { error: 'Transformation not found' },
            { status: 404 }
          )
        }

        const transformation = await prisma.reportingTransformation.update({
          where: { id: resolvedParams.id },
          data: {
            ...data,
            updatedById: userInfo.userId,
          },
          include: {
            inputDataset: {
              select: {
                id: true,
                name: true,
              },
            },
            steps: {
              orderBy: {
                stepOrder: 'asc',
              },
            },
          },
        })

        return NextResponse.json({ transformation })
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Validation error', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error updating transformation:', error)
        return NextResponse.json(
          { error: 'Failed to update transformation', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

// DELETE /api/transformations/[id] - Delete transformation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  return withPermissionCheck(
    request,
    { resource: 'transformations', action: 'DELETE' },
    async (req, userInfo) => {
      try {
        const resolvedParams = 'then' in params ? await params : params
        
        if (!prisma.reportingTransformation) {
          return NextResponse.json(
            { error: 'Transformation model not available' },
            { status: 500 }
          )
        }

        // Verify transformation exists and belongs to tenant
        const existing = await prisma.reportingTransformation.findUnique({
          where: { id: resolvedParams.id },
        })

        if (!existing || existing.tenantId !== userInfo.tenantId) {
          return NextResponse.json(
            { error: 'Transformation not found' },
            { status: 404 }
          )
        }

        await prisma.reportingTransformation.delete({
          where: { id: resolvedParams.id },
        })

        return NextResponse.json({ success: true })
      } catch (error: any) {
        console.error('Error deleting transformation:', error)
        return NextResponse.json(
          { error: 'Failed to delete transformation', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

