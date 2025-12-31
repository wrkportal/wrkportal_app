/**
 * Phase 4.4: Data Lineage API
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'
import { createLineage, getUpstreamLineage, getDownstreamLineage, getFullLineage } from '@/lib/governance/data-lineage'
import { LineageRelationshipType } from '@prisma/client'

const createLineageSchema = z.object({
  sourceType: z.string(),
  sourceId: z.string(),
  targetType: z.string(),
  targetId: z.string(),
  relationshipType: z.nativeEnum(LineageRelationshipType),
  metadata: z.record(z.any()).optional(),
})

// GET /api/governance/lineage - Get lineage for a resource
export async function GET(request: NextRequest) {
  return withPermissionCheck(
    request,
    { resource: 'governance', action: 'READ' },
    async (req, userInfo) => {
      try {
        const { searchParams } = new URL(req.url)
        const resourceType = searchParams.get('resourceType')
        const resourceId = searchParams.get('resourceId')
        const direction = searchParams.get('direction') || 'both' // 'upstream', 'downstream', 'both', 'full'
        const depth = parseInt(searchParams.get('depth') || '5')

        if (!resourceType || !resourceId) {
          return NextResponse.json(
            { error: 'resourceType and resourceId are required' },
            { status: 400 }
          )
        }

        let lineage

        if (direction === 'full') {
          lineage = await getFullLineage(resourceType, resourceId, userInfo.tenantId, depth)
        } else if (direction === 'upstream') {
          lineage = await getUpstreamLineage(resourceType, resourceId, userInfo.tenantId)
        } else if (direction === 'downstream') {
          lineage = await getDownstreamLineage(resourceType, resourceId, userInfo.tenantId)
        } else {
          // Both
          const [upstream, downstream] = await Promise.all([
            getUpstreamLineage(resourceType, resourceId, userInfo.tenantId),
            getDownstreamLineage(resourceType, resourceId, userInfo.tenantId),
          ])
          lineage = { upstream, downstream }
        }

        return NextResponse.json({ lineage })
      } catch (error: any) {
        console.error('Error fetching lineage:', error)
        return NextResponse.json(
          { error: 'Failed to fetch lineage', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

// POST /api/governance/lineage - Create lineage relationship
export async function POST(request: NextRequest) {
  return withPermissionCheck(
    request,
    { resource: 'governance', action: 'CREATE' },
    async (req, userInfo) => {
      try {
        const body = await request.json()
        const data = createLineageSchema.parse(body)

        const lineage = await createLineage({
          tenantId: userInfo.tenantId,
          ...data,
        })

        return NextResponse.json({ lineage }, { status: 201 })
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Validation error', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error creating lineage:', error)
        return NextResponse.json(
          { error: 'Failed to create lineage', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

