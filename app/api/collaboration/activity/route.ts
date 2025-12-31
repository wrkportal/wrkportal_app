/**
 * Phase 4.3: Activity Feed API
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'
import { getActivityFeed, getResourceActivity, markActivitiesAsRead } from '@/lib/collaboration/activity-feed'

// GET /api/collaboration/activity - Get activity feed
export async function GET(request: NextRequest) {
  return withPermissionCheck(
    request,
    { resource: 'collaboration', action: 'READ' },
    async (req, userInfo) => {
      try {
        const { searchParams } = new URL(req.url)
        const resourceType = searchParams.get('resourceType')
        const resourceId = searchParams.get('resourceId')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
        const skip = (page - 1) * limit

        let result

        if (resourceType && resourceId) {
          // Get activity for specific resource
          const activities = await getResourceActivity(
            resourceType,
            resourceId,
            userInfo.tenantId,
            limit
          )
          result = { activities, total: activities.length }
        } else {
          // Get user's activity feed
          result = await getActivityFeed(userInfo.userId, userInfo.tenantId, {
            resourceType: resourceType || undefined,
            resourceId: resourceId || undefined,
            limit,
            skip,
          })
        }

        return NextResponse.json({
          activities: result.activities,
          pagination: {
            page,
            limit,
            total: result.total,
            pages: Math.ceil(result.total / limit),
          },
        })
      } catch (error: any) {
        console.error('Error fetching activity feed:', error)
        return NextResponse.json(
          { error: 'Failed to fetch activity feed', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

// POST /api/collaboration/activity/mark-read - Mark activities as read
export async function POST(request: NextRequest) {
  return withPermissionCheck(
    request,
    { resource: 'collaboration', action: 'UPDATE' },
    async (req, userInfo) => {
      try {
        const body = await request.json()
        const { activityIds } = body

        if (!Array.isArray(activityIds) || activityIds.length === 0) {
          return NextResponse.json(
            { error: 'activityIds array is required' },
            { status: 400 }
          )
        }

        await markActivitiesAsRead(activityIds)

        return NextResponse.json({ success: true })
      } catch (error: any) {
        console.error('Error marking activities as read:', error)
        return NextResponse.json(
          { error: 'Failed to mark activities as read', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

