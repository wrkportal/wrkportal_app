/**
 * Phase 5.4: Data Transformation Builder API - Steps Management
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'
import { z } from 'zod'

const createStepSchema = z.object({
  stepOrder: z.number().int().min(0),
  operator: z.string(),
  config: z.record(z.any()),
  inputStepIds: z.array(z.string()).default([]),
})

const updateStepSchema = z.object({
  stepOrder: z.number().int().min(0).optional(),
  operator: z.string().optional(),
  config: z.record(z.any()).optional(),
  inputStepIds: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
})

// GET /api/transformations/[id]/steps - Get all steps
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
        
        if (!prisma.transformationStep) {
          return NextResponse.json({ steps: [] })
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

        const steps = await prisma.transformationStep.findMany({
          where: { transformationId: resolvedParams.id },
          orderBy: { stepOrder: 'asc' },
        })

        return NextResponse.json({ steps })
      } catch (error: any) {
        console.error('Error fetching steps:', error)
        return NextResponse.json(
          { error: 'Failed to fetch steps', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

// POST /api/transformations/[id]/steps - Create step
export async function POST(
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
        const data = createStepSchema.parse(body)

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

        const step = await prisma.transformationStep.create({
          data: {
            transformationId: resolvedParams.id,
            stepOrder: data.stepOrder,
            operator: data.operator as any,
            config: data.config,
            inputStepIds: data.inputStepIds,
          },
        })

        return NextResponse.json({ step }, { status: 201 })
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Validation error', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error creating step:', error)
        return NextResponse.json(
          { error: 'Failed to create step', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

