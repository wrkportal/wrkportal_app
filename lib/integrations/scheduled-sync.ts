/**
 * Scheduled Sync Service
 * 
 * Handles automatic syncing of integrations based on their sync frequency
 */

import { prisma } from '@/lib/prisma'
import { IntegrationManager } from './integration-manager'

export interface ScheduledSyncResult {
  integrationId: string
  integrationName: string
  success: boolean
  recordsProcessed: number
  errors: string[]
  duration: number
}

/**
 * Process scheduled syncs for all integrations that need syncing
 */
export async function processScheduledSyncs(): Promise<ScheduledSyncResult[]> {
  const results: ScheduledSyncResult[] = []
  const now = new Date()

  // Get all integrations that are connected and have scheduled sync enabled
  const integrations = await prisma.integration.findMany({
    where: {
      status: 'ACTIVE',
      isActive: true,
    },
  })

  for (const integration of integrations) {
    const startTime = Date.now()
    let success = false
    let recordsProcessed = 0
    const errors: string[] = []

    try {
      // Get sync frequency from configuration
      const config = (integration.configuration as any) || {}
      const syncFrequency = config.syncFrequency || 'MANUAL'
      
      // Check if sync is due based on frequency
      if (!shouldSync(syncFrequency, integration.lastSyncAt)) {
        continue
      }

      // Perform sync
      const syncDirection = config.syncDirection || 'BIDIRECTIONAL'
      await IntegrationManager.syncIntegration(
        integration.id,
        syncDirection as any
      )

      // Get the latest sync job to get records synced count
      const latestJob = await prisma.integrationSyncJob.findFirst({
        where: { integrationId: integration.id },
        orderBy: { startedAt: 'desc' },
      })

      success = latestJob?.status === 'COMPLETED' || false
      recordsProcessed = latestJob?.recordsProcessed || 0
      
      if (latestJob?.errorMessage) {
        errors.push(latestJob.errorMessage)
      }

      results.push({
        integrationId: integration.id,
        integrationName: integration.name,
        success,
        recordsProcessed,
        errors,
        duration: Date.now() - startTime,
      })
    } catch (error) {
      errors.push((error as Error).message)
      
      results.push({
        integrationId: integration.id,
        integrationName: integration.name,
        success: false,
        recordsProcessed: 0,
        errors,
        duration: Date.now() - startTime,
      })

      // Update integration status to ERROR if sync fails
      await prisma.integration.update({
        where: { id: integration.id },
        data: {
          status: 'ERROR',
          lastError: (error as Error).message,
        },
      })
    }
  }

  return results
}

/**
 * Check if an integration should be synced based on its frequency and last sync time
 */
function shouldSync(frequency: string, lastSyncAt: Date | null): boolean {
  if (!lastSyncAt) {
    return true // Never synced, sync now
  }

  const now = new Date()
  const timeSinceLastSync = now.getTime() - lastSyncAt.getTime()

  switch (frequency) {
    case 'REAL_TIME':
      // For real-time, sync if last sync was more than 5 minutes ago
      return timeSinceLastSync > 5 * 60 * 1000

    case 'HOURLY':
      // Sync if last sync was more than 1 hour ago
      return timeSinceLastSync > 60 * 60 * 1000

    case 'DAILY':
      // Sync if last sync was more than 24 hours ago
      return timeSinceLastSync > 24 * 60 * 60 * 1000

    case 'WEEKLY':
      // Sync if last sync was more than 7 days ago
      return timeSinceLastSync > 7 * 24 * 60 * 60 * 1000

    case 'MANUAL':
    default:
      return false
  }
}

/**
 * Process syncs for a specific integration (used for real-time syncs)
 */
export async function processIntegrationSync(integrationId: string): Promise<ScheduledSyncResult> {
  const startTime = Date.now()
  let success = false
  let recordsProcessed = 0
  const errors: string[] = []

  try {
    const integration = await prisma.integration.findUnique({
      where: { id: integrationId },
    })

    if (!integration) {
      throw new Error('Integration not found')
    }

    if (integration.status !== 'ACTIVE') {
      throw new Error('Integration is not active')
    }

    // Get sync direction from configuration
    const config = (integration.configuration as any) || {}
    const syncDirection = config.syncDirection || 'BIDIRECTIONAL'

    // Perform sync
    await IntegrationManager.syncIntegration(
      integration.id,
      syncDirection as any
    )

    // Get the latest sync job
    const latestJob = await prisma.integrationSyncJob.findFirst({
      where: { integrationId: integration.id },
      orderBy: { startedAt: 'desc' },
    })

    success = latestJob?.status === 'COMPLETED' || false
    recordsProcessed = latestJob?.recordsProcessed || 0
    
    if (latestJob?.errorMessage) {
      errors.push(latestJob.errorMessage)
    }

    return {
      integrationId: integration.id,
      integrationName: integration.name,
      success,
      recordsProcessed,
      errors,
      duration: Date.now() - startTime,
    }
  } catch (error) {
    errors.push((error as Error).message)
    
    return {
      integrationId,
      integrationName: 'Unknown',
      success: false,
      recordsProcessed: 0,
      errors,
      duration: Date.now() - startTime,
    }
  }
}

/**
 * Get sync statistics for monitoring
 */
export async function getSyncStatistics(tenantId?: string) {
  const where = tenantId ? { tenantId } : {}

  const integrations = await prisma.integration.findMany({
    where: {
      ...where,
      status: 'ACTIVE',
    },
    include: {
      syncJobs: {
        orderBy: { startedAt: 'desc' },
        take: 1,
      },
    },
  })

  const stats = {
    totalIntegrations: integrations.length,
    syncingIntegrations: integrations.filter((i: any) => {
      const config = (i.configuration as any) || {}
      return config.syncFrequency !== 'MANUAL'
    }).length,
    last24Hours: {
      successful: 0,
      failed: 0,
      totalRecords: 0,
    },
    nextSyncs: [] as Array<{ integrationId: string; name: string; nextSyncAt: Date }>,
  }

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

  for (const integration of integrations) {
    const latestJob = integration.syncJobs[0]
    
    if (latestJob && latestJob.startedAt >= oneDayAgo) {
      if (latestJob.status === 'COMPLETED') {
        stats.last24Hours.successful++
      } else {
        stats.last24Hours.failed++
      }
      stats.last24Hours.totalRecords += latestJob.recordsProcessed || 0
    }

    // Calculate next sync time
    const config = (integration.configuration as any) || {}
    const syncFrequency = config.syncFrequency || 'MANUAL'
    if (syncFrequency !== 'MANUAL' && integration.lastSyncAt) {
      const nextSyncAt = calculateNextSyncTime(
        syncFrequency,
        integration.lastSyncAt
      )
      stats.nextSyncs.push({
        integrationId: integration.id,
        name: integration.name,
        nextSyncAt,
      })
    }
  }

  return stats
}

/**
 * Calculate next sync time based on frequency
 */
function calculateNextSyncTime(frequency: string, lastSyncAt: Date): Date {
  const nextSync = new Date(lastSyncAt)

  switch (frequency) {
    case 'REAL_TIME':
      nextSync.setMinutes(nextSync.getMinutes() + 5)
      break
    case 'HOURLY':
      nextSync.setHours(nextSync.getHours() + 1)
      break
    case 'DAILY':
      nextSync.setDate(nextSync.getDate() + 1)
      break
    case 'WEEKLY':
      nextSync.setDate(nextSync.getDate() + 7)
      break
    default:
      nextSync.setDate(nextSync.getDate() + 1)
  }

  return nextSync
}

