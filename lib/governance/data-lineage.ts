/**
 * Phase 4.4: Data Lineage Tracking
 * 
 * Track relationships and dependencies between data resources
 */

import { prisma } from '@/lib/prisma'
import { LineageRelationshipType } from '@prisma/client'

export interface CreateLineageParams {
  tenantId: string
  sourceType: string
  sourceId: string
  targetType: string
  targetId: string
  relationshipType: LineageRelationshipType
  metadata?: Record<string, any>
}

/**
 * Create a lineage relationship
 */
export async function createLineage(params: CreateLineageParams) {
  const { tenantId, sourceType, sourceId, targetType, targetId, relationshipType, metadata } = params

  return prisma.dataLineage.create({
    data: {
      tenantId,
      sourceType,
      sourceId,
      targetType,
      targetId,
      relationshipType,
      metadata: metadata || {},
    },
  })
}

/**
 * Get lineage for a resource (what it's derived from)
 */
export async function getUpstreamLineage(
  resourceType: string,
  resourceId: string,
  tenantId: string
) {
  return prisma.dataLineage.findMany({
    where: {
      tenantId,
      targetType: resourceType,
      targetId: resourceId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

/**
 * Get lineage for a resource (what depends on it)
 */
export async function getDownstreamLineage(
  resourceType: string,
  resourceId: string,
  tenantId: string
) {
  return prisma.dataLineage.findMany({
    where: {
      tenantId,
      sourceType: resourceType,
      sourceId: resourceId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

/**
 * Get full lineage graph for a resource
 */
export async function getFullLineage(
  resourceType: string,
  resourceId: string,
  tenantId: string,
  depth: number = 5
) {
  const upstream = await getUpstreamLineage(resourceType, resourceId, tenantId)
  const downstream = await getDownstreamLineage(resourceType, resourceId, tenantId)

  // Recursively get upstream lineage
  const upstreamNodes = new Set<string>()
  const downstreamNodes = new Set<string>()

  const traverseUpstream = async (
    type: string,
    id: string,
    currentDepth: number
  ) => {
    if (currentDepth >= depth) return

    const key = `${type}:${id}`
    if (upstreamNodes.has(key)) return
    upstreamNodes.add(key)

    const lineage = await getUpstreamLineage(type, id, tenantId)
    for (const item of lineage) {
      await traverseUpstream(item.sourceType, item.sourceId, currentDepth + 1)
    }
  }

  const traverseDownstream = async (
    type: string,
    id: string,
    currentDepth: number
  ) => {
    if (currentDepth >= depth) return

    const key = `${type}:${id}`
    if (downstreamNodes.has(key)) return
    downstreamNodes.add(key)

    const lineage = await getDownstreamLineage(type, id, tenantId)
    for (const item of lineage) {
      await traverseDownstream(item.targetType, item.targetId, currentDepth + 1)
    }
  }

  await traverseUpstream(resourceType, resourceId, 0)
  await traverseDownstream(resourceType, resourceId, 0)

  // Get all lineage relationships for the nodes
  const allUpstream = await prisma.dataLineage.findMany({
    where: {
      tenantId,
      OR: Array.from(upstreamNodes).map(node => {
        const [type, id] = node.split(':')
        return { targetType: type, targetId: id }
      }),
    },
  })

  const allDownstream = await prisma.dataLineage.findMany({
    where: {
      tenantId,
      OR: Array.from(downstreamNodes).map(node => {
        const [type, id] = node.split(':')
        return { sourceType: type, sourceId: id }
      }),
    },
  })

  return {
    upstream: allUpstream,
    downstream: allDownstream,
    nodes: {
      upstream: Array.from(upstreamNodes),
      downstream: Array.from(downstreamNodes),
    },
  }
}

/**
 * Delete lineage relationship
 */
export async function deleteLineage(lineageId: string, tenantId: string) {
  return prisma.dataLineage.deleteMany({
    where: {
      id: lineageId,
      tenantId,
    },
  })
}

