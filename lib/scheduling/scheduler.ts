/**
 * Phase 5.6: Advanced Scheduling & Delivery
 * 
 * Core scheduling engine for report/dashboard delivery
 */

import { prisma } from '@/lib/prisma'
import { ScheduleFrequency, ScheduleStatus } from '@prisma/client'

export interface NextRunCalculation {
  nextRunAt: Date
  isValid: boolean
  error?: string
}

/**
 * Calculate next run time based on frequency and cron expression
 */
export function calculateNextRun(
  frequency: ScheduleFrequency,
  cronExpression: string | null,
  lastRunAt: Date | null,
  timezone: string = 'UTC'
): NextRunCalculation {
  const now = new Date()

  switch (frequency) {
    case 'ONCE':
      // One-time schedule - no next run if already run
      if (lastRunAt) {
        return { nextRunAt: now, isValid: false, error: 'Schedule already executed' }
      }
      return { nextRunAt: now, isValid: true }

    case 'DAILY':
      const nextDaily = new Date(now)
      nextDaily.setDate(nextDaily.getDate() + 1)
      nextDaily.setHours(0, 0, 0, 0)
      return { nextRunAt: nextDaily, isValid: true }

    case 'WEEKLY':
      const nextWeekly = new Date(now)
      // Next Monday
      const daysUntilMonday = (8 - nextWeekly.getDay()) % 7 || 7
      nextWeekly.setDate(nextWeekly.getDate() + daysUntilMonday)
      nextWeekly.setHours(0, 0, 0, 0)
      return { nextRunAt: nextWeekly, isValid: true }

    case 'MONTHLY':
      const nextMonthly = new Date(now)
      nextMonthly.setMonth(nextMonthly.getMonth() + 1)
      nextMonthly.setDate(1)
      nextMonthly.setHours(0, 0, 0, 0)
      return { nextRunAt: nextMonthly, isValid: true }

    case 'QUARTERLY':
      const nextQuarterly = new Date(now)
      const currentQuarter = Math.floor(nextQuarterly.getMonth() / 3)
      const nextQuarterMonth = (currentQuarter + 1) * 3
      nextQuarterly.setMonth(nextQuarterMonth, 1)
      nextQuarterly.setHours(0, 0, 0, 0)
      return { nextRunAt: nextQuarterly, isValid: true }

    case 'YEARLY':
      const nextYearly = new Date(now)
      nextYearly.setFullYear(nextYearly.getFullYear() + 1)
      nextYearly.setMonth(0, 1)
      nextYearly.setHours(0, 0, 0, 0)
      return { nextRunAt: nextYearly, isValid: true }

    case 'CUSTOM':
      if (!cronExpression) {
        return { nextRunAt: now, isValid: false, error: 'Cron expression required for CUSTOM frequency' }
      }
      // For now, return a simple calculation. In production, use a cron parser library
      // Example: Parse cron and calculate next run
      try {
        // TODO: Implement proper cron parsing with library like 'node-cron'
        // For now, default to daily
        const nextCustom = new Date(now)
        nextCustom.setDate(nextCustom.getDate() + 1)
        return { nextRunAt: nextCustom, isValid: true }
      } catch (error: any) {
        return { nextRunAt: now, isValid: false, error: `Invalid cron expression: ${error.message}` }
      }

    default:
      return { nextRunAt: now, isValid: false, error: 'Unknown frequency' }
  }
}

/**
 * Check if schedule should run now
 */
export function shouldRunNow(schedule: {
  nextRunAt: Date | null
  isActive: boolean
  status: ScheduleStatus
  startDate: Date | null
  endDate: Date | null
}): boolean {
  if (!schedule.isActive) return false
  if (schedule.status !== 'ACTIVE') return false
  if (!schedule.nextRunAt) return false

  const now = new Date()
  if (schedule.nextRunAt > now) return false

  if (schedule.startDate && now < schedule.startDate) return false
  if (schedule.endDate && now > schedule.endDate) return false

  return true
}

/**
 * Get schedules due to run
 */
export async function getSchedulesDueToRun(): Promise<any[]> {
  if (!prisma.reportSchedule) {
    return []
  }

  const now = new Date()
  
  return await prisma.reportSchedule.findMany({
    where: {
      isActive: true,
      status: 'ACTIVE',
      nextRunAt: {
        lte: now,
      },
      OR: [
        { startDate: null },
        { startDate: { lte: now } },
      ],
      OR: [
        { endDate: null },
        { endDate: { gte: now } },
      ],
    },
    include: {
      tenant: true,
      createdBy: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })
}

/**
 * Update schedule after execution
 */
export async function updateScheduleAfterRun(
  scheduleId: string,
  success: boolean
): Promise<void> {
  if (!prisma.reportSchedule) {
    return
  }

  const schedule = await prisma.reportSchedule.findUnique({
    where: { id: scheduleId },
  })

  if (!schedule) return

  // Calculate next run
  const nextRun = calculateNextRun(
    schedule.frequency as ScheduleFrequency,
    schedule.cronExpression || null,
    new Date(),
    schedule.timezone
  )

  // Update schedule
  await prisma.reportSchedule.update({
    where: { id: scheduleId },
    data: {
      lastRunAt: new Date(),
      nextRunAt: nextRun.isValid ? nextRun.nextRunAt : null,
      runCount: { increment: 1 },
      successCount: success ? { increment: 1 } : undefined,
      failureCount: success ? undefined : { increment: 1 },
      status: schedule.frequency === 'ONCE' ? 'COMPLETED' : 'ACTIVE',
    },
  })
}

