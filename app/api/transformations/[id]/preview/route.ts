/**
 * Phase 5.4: Data Transformation Builder API - Preview
 * 
 * Executes transformation pipeline and returns preview data
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'
import { executeTransformation } from '@/lib/transformations/transformation-engine'

// POST /api/transformations/[id]/preview - Preview transformation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  return withPermissionCheck(
    request,
    { resource: 'transformations', action: 'READ' },
    async (req, userInfo) => {
      try {
        const resolvedParams = 'then' in params ? await params : params
        const body = await req.json()
        const stepId = body.stepId // Optional: preview specific step
        const rowCount = body.rowCount || 100

        if (!prisma.reportingTransformation) {
          return NextResponse.json(
            { error: 'Transformation model not available' },
            { status: 500 }
          )
        }

        // Get transformation with steps
        const transformation = await prisma.reportingTransformation.findUnique({
          where: { id: resolvedParams.id },
          include: {
            inputDataset: true,
            steps: {
              orderBy: { stepOrder: 'asc' },
              where: stepId ? { id: stepId } : {},
            },
          },
        })

        if (!transformation || transformation.tenantId !== userInfo.tenantId) {
          return NextResponse.json(
            { error: 'Transformation not found' },
            { status: 404 }
          )
        }

        // Get input data from dataset
        // In a real implementation, you'd fetch actual data from the dataset
        // For now, we'll use sample data structure
        let inputData: any[] = []
        
        if (transformation.inputDataset) {
          // TODO: Fetch actual data from dataset
          // This would involve querying the dataset's data source
          // For now, return empty array or sample data
          inputData = []
        }

        // Execute transformation steps in order
        let currentData = inputData
        const stepResults: any[] = []

        for (const step of transformation.steps) {
          if (!step.isActive) continue

          const result = executeTransformation(
            step.operator as any,
            currentData,
            step.config as any
          )

          if (result.error) {
            return NextResponse.json(
              {
                error: `Error in step ${step.stepOrder}: ${result.error}`,
                stepId: step.id,
                stepOrder: step.stepOrder,
              },
              { status: 400 }
            )
          }

          // Limit preview data
          result.data = result.data.slice(0, rowCount)
          stepResults.push({
            stepId: step.id,
            stepOrder: step.stepOrder,
            operator: step.operator,
            result,
          })

          currentData = result.data
        }

        return NextResponse.json({
          preview: {
            inputRowCount: inputData.length,
            outputRowCount: currentData.length,
            steps: stepResults,
            finalData: currentData,
            finalSchema: stepResults.length > 0 
              ? stepResults[stepResults.length - 1].result.schema 
              : [],
          },
        })
      } catch (error: any) {
        console.error('Error previewing transformation:', error)
        return NextResponse.json(
          { error: 'Failed to preview transformation', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

