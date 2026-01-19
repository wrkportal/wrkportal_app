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
  recordsSynced: number
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
  const integrations = await prisma.salesIntegration.findMany({
    where: {
      status: 'CONNECTED',
      syncFrequency: {
        in: ['HOURLY', 'DAILY', 'WEEKLY', 'REAL_TIME'],
      },
    },
  })

  for (const integration of integrations) {
    const startTime = Date.now()
    let success = false
    let recordsSynced = 0
    const errors: string[] = []

    try {
      // Check if sync is due based on frequency
      if (!shouldSync(integration.syncFrequency as string, integration.lastSyncAt)) {
        continue
      }

      // Perform sync
      await IntegrationManager.syncIntegration(
        integration.id,
        integration.syncDirection as any
      )

      // Get the latest sync log to get records synced count
      const latestLog = await prisma.salesIntegrationSyncLog.findFirst({
        where: { integrationId: integration.id },
        orderBy: { startedAt: 'desc' },
      })

      success = latestLog?.status === 'SUCCESS'
      recordsSynced = latestLog?.recordsSynced || 0
      
      if (latestLog?.errors && Array.isArray(latestLog.errors)) {
        errors.push(...(latestLog.errors as string[]))
      }

      results.push({
        integrationId: integration.id,
        integrationName: integration.name,
        success,
        recordsSynced,
        errors,
        duration: Date.now() - startTime,
      })
    } catch (error) {
      errors.push((error as Error).message)
      
      results.push({
        integrationId: integration.id,
        integrationName: integration.name,
        success: false,
        recordsSynced: 0,
        errors,
        duration: Date.now() - startTime,
      })

      // Update integration status to ERROR if sync fails
      await prisma.salesIntegration.update({
        where: { id: integration.id },
        data: {
          status: 'ERROR',
          errorMessage: (error as Error).message,
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
  let recordsSynced = 0
  const errors: string[] = []

  try {
    const integration = await prisma.salesIntegration.findUnique({
      where: { id: integrationId },
    })

    if (!integration) {
      throw new Error('Integration not found')
    }

    if (integration.status !== 'CONNECTED') {
      throw new Error('Integration is not connected')
    }

    // Perform sync
    await IntegrationManager.syncIntegration(
      integration.id,
      integration.syncDirection as any
    )

    // Get the latest sync log
    const latestLog = await prisma.salesIntegrationSyncLog.findFirst({
      where: { integrationId: integration.id },
      orderBy: { startedAt: 'desc' },
    })

    success = latestLog?.status === 'SUCCESS' || false
    recordsSynced = latestLog?.recordsSynced || 0
    
    if (latestLog?.errors && Array.isArray(latestLog.errors)) {
      errors.push(...(latestLog.errors as string[]))
    }

    return {
      integrationId: integration.id,
      integrationName: integration.name,
      success,
      recordsSynced,
      errors,
      duration: Date.now() - startTime,
    }
  } catch (error) {
    errors.push((error as Error).message)
    
    return {
      integrationId,
      integrationName: 'Unknown',
      success: false,
      recordsSynced: 0,
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

  const integrations = await prisma.salesIntegration.findMany({
    where: {
      ...where,
      status: 'CONNECTED',
    },
    include: {
      syncLogs: {
        orderBy: { startedAt: 'desc' },
        take: 1,
      },
    },
  })

  const stats = {
    totalIntegrations: integrations.length,
    syncingIntegrations: integrations.filter(i => 
      i.syncFrequency !== 'MANUAL'
    ).length,
    last24Hours: {
      successful: 0,
      failed: 0,
      totalRecords: 0,
    },
    nextSyncs: [] as Array<{ integrationId: string; name: string; nextSyncAt: Date }>,
  }

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

  for (const integration of integrations) {
    const latestLog = integration.syncLogs[0]
    
    if (latestLog && latestLog.startedAt >= oneDayAgo) {
      if (latestLog.status === 'SUCCESS') {
        stats.last24Hours.successful++
      } else {
        stats.last24Hours.failed++
      }
      stats.last24Hours.totalRecords += latestLog.recordsSynced || 0
    }

    // Calculate next sync time
    if (integration.syncFrequency !== 'MANUAL' && integration.lastSyncAt) {
      const nextSyncAt = calculateNextSyncTime(
        integration.syncFrequency as string,
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

