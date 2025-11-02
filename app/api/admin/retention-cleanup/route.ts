import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { cleanupTenantData, getRetentionStats } from '@/lib/data-retention/cleanup'

// POST - Trigger manual cleanup
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can trigger cleanup
    const allowedRoles = ['TENANT_SUPER_ADMIN', 'ORG_ADMIN']
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Run cleanup for this tenant
    const result = await cleanupTenantData(session.user.tenantId)

    // Log the cleanup
    console.log(
      `Manual data cleanup triggered for tenant ${result.tenantId} by user ${session.user.id}`,
      result
    )

    return NextResponse.json({
      success: true,
      message: 'Data cleanup completed successfully',
      result: {
        deletedNotifications: result.deletedNotifications,
        deletedTasks: result.deletedTasks,
        deletedProjects: result.deletedProjects,
        totalDeleted:
          result.deletedNotifications + result.deletedTasks + result.deletedProjects,
        errors: result.errors,
      },
    })
  } catch (error) {
    console.error('Error triggering data cleanup:', error)
    return NextResponse.json(
      { error: 'Failed to trigger data cleanup' },
      { status: 500 }
    )
  }
}

// GET - Get retention statistics (how many items would be deleted)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can view retention stats
    const allowedRoles = ['TENANT_SUPER_ADMIN', 'ORG_ADMIN']
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get retention statistics
    const stats = await getRetentionStats(session.user.tenantId)

    if (!stats) {
      return NextResponse.json({ error: 'Failed to get retention stats' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      stats,
    })
  } catch (error) {
    console.error('Error getting retention stats:', error)
    return NextResponse.json(
      { error: 'Failed to get retention statistics' },
      { status: 500 }
    )
  }
}

