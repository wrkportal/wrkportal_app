/**
 * Phase 4.4: Data Quality API
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'
import { evaluateDataQuality, getQualityMetrics, getQualitySummary } from '@/lib/governance/data-quality'

// GET /api/governance/quality - Get quality metrics
export async function GET(request: NextRequest) {
  return withPermissionCheck(
    request,
    { resource: 'governance', action: 'READ' },
    async (req, userInfo) => {
      try {
        const { searchParams } = new URL(req.url)
        const resourceType = searchParams.get('resourceType')
        const resourceId = searchParams.get('resourceId')
        const summary = searchParams.get('summary') === 'true'

        if (!resourceType || !resourceId) {
          return NextResponse.json(
            { error: 'resourceType and resourceId are required' },
            { status: 400 }
          )
        }

        if (summary) {
          const summaryData = await getQualitySummary(
            resourceType,
            resourceId,
            userInfo.tenantId
          )
          return NextResponse.json({ summary: summaryData })
        } else {
          const metrics = await getQualityMetrics(
            resourceType,
            resourceId,
            userInfo.tenantId
          )
          return NextResponse.json({ metrics })
        }
      } catch (error: any) {
        console.error('Error fetching quality metrics:', error)
        return NextResponse.json(
          { error: 'Failed to fetch quality metrics', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

// POST /api/governance/quality/evaluate - Evaluate data quality
export async function POST(request: NextRequest) {
  return withPermissionCheck(
    request,
    { resource: 'governance', action: 'CREATE' },
    async (req, userInfo) => {
      try {
        const body = await request.json()
        const { resourceType, resourceId, data, schema } = body

        if (!resourceType || !resourceId || !data) {
          return NextResponse.json(
            { error: 'resourceType, resourceId, and data are required' },
            { status: 400 }
          )
        }

        const results = await evaluateDataQuality({
          tenantId: userInfo.tenantId,
          resourceType,
          resourceId,
          data,
          schema,
        })

        return NextResponse.json({ results }, { status: 201 })
      } catch (error: any) {
        console.error('Error evaluating quality:', error)
        return NextResponse.json(
          { error: 'Failed to evaluate quality', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

