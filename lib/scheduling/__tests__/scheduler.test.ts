/**
 * Unit Tests for Scheduler
 */

import {
  calculateNextRun,
  shouldRunNow,
  ScheduleStatus,
} from '@/lib/scheduling/scheduler'

describe('Scheduler', () => {
  describe('calculateNextRun', () => {
    it('should calculate next daily run', () => {
      const result = calculateNextRun('DAILY', null, null)
      expect(result.isValid).toBe(true)
      expect(result.nextRunAt).toBeInstanceOf(Date)
    })

    it('should calculate next weekly run', () => {
      const result = calculateNextRun('WEEKLY', null, null)
      expect(result.isValid).toBe(true)
      expect(result.nextRunAt).toBeInstanceOf(Date)
    })

    it('should calculate next monthly run', () => {
      const result = calculateNextRun('MONTHLY', null, null)
      expect(result.isValid).toBe(true)
      expect(result.nextRunAt).toBeInstanceOf(Date)
    })

    it('should handle ONCE frequency', () => {
      const result = calculateNextRun('ONCE', null, null)
      expect(result.isValid).toBe(true)
    })

    it('should invalidate ONCE if already run', () => {
      const lastRunAt = new Date()
      const result = calculateNextRun('ONCE', null, lastRunAt)
      expect(result.isValid).toBe(false)
    })

    it('should require cron expression for CUSTOM frequency', () => {
      const result = calculateNextRun('CUSTOM', null, null)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Cron expression')
    })

    it('should accept cron expression for CUSTOM frequency', () => {
      const result = calculateNextRun('CUSTOM', '0 9 * * *', null)
      expect(result.isValid).toBe(true)
    })
  })

  describe('shouldRunNow', () => {
    const baseSchedule = {
      nextRunAt: new Date(Date.now() - 1000), // 1 second ago
      isActive: true,
      status: 'ACTIVE' as ScheduleStatus,
      startDate: null,
      endDate: null,
    }

    it('should return true for schedule due to run', () => {
      const result = shouldRunNow(baseSchedule)
      expect(result).toBe(true)
    })

    it('should return false if schedule is not active', () => {
      const result = shouldRunNow({ ...baseSchedule, isActive: false })
      expect(result).toBe(false)
    })

    it('should return false if status is not ACTIVE', () => {
      const result = shouldRunNow({ ...baseSchedule, status: 'PAUSED' })
      expect(result).toBe(false)
    })

    it('should return false if nextRunAt is null', () => {
      const result = shouldRunNow({ ...baseSchedule, nextRunAt: null })
      expect(result).toBe(false)
    })

    it('should return false if nextRunAt is in the future', () => {
      const futureDate = new Date(Date.now() + 60000) // 1 minute from now
      const result = shouldRunNow({ ...baseSchedule, nextRunAt: futureDate })
      expect(result).toBe(false)
    })

    it('should return false if before startDate', () => {
      const startDate = new Date(Date.now() + 60000)
      const result = shouldRunNow({ ...baseSchedule, startDate })
      expect(result).toBe(false)
    })

    it('should return false if after endDate', () => {
      const endDate = new Date(Date.now() - 60000)
      const result = shouldRunNow({ ...baseSchedule, endDate })
      expect(result).toBe(false)
    })
  })
})

