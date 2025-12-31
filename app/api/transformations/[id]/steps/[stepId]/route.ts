/**
 * Phase 5.4: Data Transformation Builder API - Single Step Management
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'
import { z } from 'zod'

const updateStepSchema = z.object({
  stepOrder: z.number().int().min(0).optional(),
  operator: z.string().optional(),
  config: z.record(z.any()).optional(),
  inputStepIds: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
})

// PATCH /api/transformations/[id]/steps/[stepId] - Update step
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> | { id: string; stepId: string } }
) {
  return withPermissionCheck(
    request,
    { resource: 'transformations', action: 'UPDATE' },
    async (req, userInfo) => {
      try {
        const resolvedParams = 'then' in params ? await params : params
        const body = await req.json()
        const data = updateStepSchema.parse(body)

        if (!prisma.transformationStep) {
          return NextResponse.json(
            { error: 'TransformationStep model not available' },
            { status: 500 }
          )
        }

        // Verify transformation exists and belongs to tenant
        const transformation = await prisma.reportingTransformation.findUnique({
          where: { id: resolvedParams.id },
        })

        if (!transformation || transformation.tenantId !== userInfo.tenantId) {
          return NextResponse.json(
            { error: 'Transformation not found' },
            { status: 404 }
          )
        }

        // Verify step exists and belongs to transformation
        const existingStep = await prisma.transformationStep.findUnique({
          where: { id: resolvedParams.stepId },
        })

        if (!existingStep || existingStep.transformationId !== resolvedParams.id) {
          return NextResponse.json(
            { error: 'Step not found' },
            { status: 404 }
          )
        }

        const step = await prisma.transformationStep.update({
          where: { id: resolvedParams.stepId },
          data,
        })

        return NextResponse.json({ step })
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Validation error', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error updating step:', error)
        return NextResponse.json(
          { error: 'Failed to update step', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

// DELETE /api/transformations/[id]/steps/[stepId] - Delete step
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> | { id: string; stepId: string } }
) {
  return withPermissionCheck(
    request,
    { resource: 'transformations', action: 'UPDATE' },
    async (req, userInfo) => {
      try {
        const resolvedParams = 'then' in params ? await params : params

        if (!prisma.transformationStep) {
          return NextResponse.json(
            { error: 'TransformationStep model not available' },
            { status: 500 }
          )
        }

        // Verify transformation exists and belongs to tenant
        const transformation = await prisma.reportingTransformation.findUnique({
          where: { id: resolvedParams.id },
        })

        if (!transformation || transformation.tenantId !== userInfo.tenantId) {
          return NextResponse.json(
            { error: 'Transformation not found' },
            { status: 404 }
          )
        }

        // Verify step exists and belongs to transformation
        const existingStep = await prisma.transformationStep.findUnique({
          where: { id: resolvedParams.stepId },
        })

        if (!existingStep || existingStep.transformationId !== resolvedParams.id) {
          return NextResponse.json(
            { error: 'Step not found' },
            { status: 404 }
          )
        }

        await prisma.transformationStep.delete({
          where: { id: resolvedParams.stepId },
        })

        return NextResponse.json({ success: true })
      } catch (error: any) {
        console.error('Error deleting step:', error)
        return NextResponse.json(
          { error: 'Failed to delete step', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

