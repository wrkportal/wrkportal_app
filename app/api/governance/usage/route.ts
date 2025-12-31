/**
 * Phase 4.4: Usage Analytics API
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'
import { trackUsage, getResourceUsageStats, getUsageTrends, getMostUsedResources } from '@/lib/governance/usage-analytics'
import { UsageAction } from '@prisma/client'

// GET /api/governance/usage - Get usage statistics
export async function GET(request: NextRequest) {
  return withPermissionCheck(
    request,
    { resource: 'governance', action: 'READ' },
    async (req, userInfo) => {
      try {
        const { searchParams } = new URL(req.url)
        const resourceType = searchParams.get('resourceType')
        const resourceId = searchParams.get('resourceId')
        const type = searchParams.get('type') // 'stats', 'trends', 'popular'
        const period = searchParams.get('period') as 'day' | 'week' | 'month' || 'day'
        const days = parseInt(searchParams.get('days') || '30')

        if (type === 'popular') {
          // Get most used resources
          const popular = await getMostUsedResources(
            userInfo.tenantId,
            resourceType || undefined,
            10,
            days
          )
          return NextResponse.json({ resources: popular })
        }

        if (type === 'trends') {
          // Get usage trends
          if (!resourceType || !resourceId) {
            return NextResponse.json(
              { error: 'resourceType and resourceId are required for trends' },
              { status: 400 }
            )
          }

          const trends = await getUsageTrends(
            resourceType,
            resourceId,
            userInfo.tenantId,
            period,
            days
          )
          return NextResponse.json({ trends })
        }

        // Default: Get usage stats
        if (!resourceType || !resourceId) {
          return NextResponse.json(
            { error: 'resourceType and resourceId are required' },
            { status: 400 }
          )
        }

        const startDate = searchParams.get('startDate')
          ? new Date(searchParams.get('startDate')!)
          : undefined
        const endDate = searchParams.get('endDate')
          ? new Date(searchParams.get('endDate')!)
          : undefined

        const stats = await getResourceUsageStats(
          resourceType,
          resourceId,
          userInfo.tenantId,
          startDate,
          endDate
        )

        return NextResponse.json({ stats })
      } catch (error: any) {
        console.error('Error fetching usage stats:', error)
        return NextResponse.json(
          { error: 'Failed to fetch usage stats', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

// POST /api/governance/usage - Track usage
export async function POST(request: NextRequest) {
  return withPermissionCheck(
    request,
    { resource: 'governance', action: 'CREATE' },
    async (req, userInfo) => {
      try {
        const body = await request.json()
        const { resourceType, resourceId, action, metadata, duration } = body

        if (!resourceType || !resourceId || !action) {
          return NextResponse.json(
            { error: 'resourceType, resourceId, and action are required' },
            { status: 400 }
          )
        }

        const usage = await trackUsage({
          tenantId: userInfo.tenantId,
          resourceType,
          resourceId,
          userId: userInfo.userId,
          action: action as UsageAction,
          metadata,
          duration,
        })

        return NextResponse.json({ usage }, { status: 201 })
      } catch (error: any) {
        console.error('Error tracking usage:', error)
        return NextResponse.json(
          { error: 'Failed to track usage', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

