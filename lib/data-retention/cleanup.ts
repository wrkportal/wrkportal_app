import { prisma } from '@/lib/prisma'

export interface CleanupResult {
  tenantId: string
  tenantName: string
  deletedNotifications: number
  deletedTasks: number
  deletedProjects: number
  errors: string[]
}

/**
 * Clean up old data for a specific tenant based on their retention settings
 */
export async function cleanupTenantData(tenantId: string): Promise<CleanupResult> {
  const result: CleanupResult = {
    tenantId,
    tenantName: '',
    deletedNotifications: 0,
    deletedTasks: 0,
    deletedProjects: 0,
    errors: [],
  }

  try {
    // Get tenant with retention settings
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        auditLogRetentionDays: true,
        taskRetentionDays: true,
        notificationRetentionDays: true,
        projectRetentionDays: true,
      },
    })

    if (!tenant) {
      result.errors.push('Tenant not found')
      return result
    }

    result.tenantName = tenant.name

    // 1. Clean up old notifications
    if (tenant.notificationRetentionDays > 0) {
      try {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - tenant.notificationRetentionDays)

        const deletedNotifications = await prisma.notification.deleteMany({
          where: {
            tenantId: tenant.id,
            createdAt: { lt: cutoffDate },
            read: true, // Only delete read notifications
          },
        })

        result.deletedNotifications = deletedNotifications.count
      } catch (error) {
        result.errors.push(`Notification cleanup failed: ${error}`)
      }
    }

    // 2. Clean up old completed tasks
    if (tenant.taskRetentionDays > 0) {
      try {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - tenant.taskRetentionDays)

        const deletedTasks = await prisma.task.deleteMany({
          where: {
            tenantId: tenant.id,
            updatedAt: { lt: cutoffDate },
            status: 'COMPLETED', // Only delete completed tasks
          },
        })

        result.deletedTasks = deletedTasks.count
      } catch (error) {
        result.errors.push(`Task cleanup failed: ${error}`)
      }
    }

    // 3. Clean up old archived projects
    if (tenant.projectRetentionDays > 0) {
      try {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - tenant.projectRetentionDays)

        const deletedProjects = await prisma.project.deleteMany({
          where: {
            tenantId: tenant.id,
            updatedAt: { lt: cutoffDate },
            status: 'ARCHIVED', // Only delete archived projects
          },
        })

        result.deletedProjects = deletedProjects.count
      } catch (error) {
        result.errors.push(`Project cleanup failed: ${error}`)
      }
    }

    return result
  } catch (error) {
    result.errors.push(`General cleanup error: ${error}`)
    return result
  }
}

/**
 * Clean up old data for all tenants
 */
export async function cleanupAllTenantsData(): Promise<CleanupResult[]> {
  const results: CleanupResult[] = []

  try {
    // Get all active tenants
    const tenants = await prisma.tenant.findMany({
      where: { status: 'active' },
      select: { id: true },
    })

    // Clean up data for each tenant
    for (const tenant of tenants) {
      const result = await cleanupTenantData(tenant.id)
      results.push(result)
    }

    return results
  } catch (error) {
    console.error('Error cleaning up all tenants data:', error)
    return results
  }
}

/**
 * Get retention statistics for a tenant
 */
export async function getRetentionStats(tenantId: string) {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        notificationRetentionDays: true,
        taskRetentionDays: true,
        projectRetentionDays: true,
      },
    })

    if (!tenant) {
      return null
    }

    // Calculate cutoff dates
    const now = new Date()
    const notificationCutoff = new Date(now)
    notificationCutoff.setDate(notificationCutoff.getDate() - tenant.notificationRetentionDays)

    const taskCutoff = new Date(now)
    taskCutoff.setDate(taskCutoff.getDate() - tenant.taskRetentionDays)

    const projectCutoff = new Date(now)
    projectCutoff.setDate(projectCutoff.getDate() - tenant.projectRetentionDays)

    // Count items eligible for deletion
    const [notificationsToDelete, tasksToDelete, projectsToDelete] = await Promise.all([
      tenant.notificationRetentionDays > 0
        ? prisma.notification.count({
            where: {
              tenantId,
              createdAt: { lt: notificationCutoff },
              read: true,
            },
          })
        : 0,
      tenant.taskRetentionDays > 0
        ? prisma.task.count({
            where: {
              tenantId,
              updatedAt: { lt: taskCutoff },
              status: 'COMPLETED',
            },
          })
        : 0,
      tenant.projectRetentionDays > 0
        ? prisma.project.count({
            where: {
              tenantId,
              updatedAt: { lt: projectCutoff },
              status: 'ARCHIVED',
            },
          })
        : 0,
    ])

    return {
      notificationsToDelete,
      tasksToDelete,
      projectsToDelete,
      totalItemsToDelete: notificationsToDelete + tasksToDelete + projectsToDelete,
    }
  } catch (error) {
    console.error('Error getting retention stats:', error)
    return null
  }
}

