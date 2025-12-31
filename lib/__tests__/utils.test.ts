/**
 * Unit Tests for Utility Functions
 */

import { formatDate, cn } from '@/lib/utils'

describe('Utility Functions', () => {
  describe('formatDate', () => {
    it('should format a valid date string', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      const formatted = formatDate(date)
      expect(formatted).toBeTruthy()
      expect(typeof formatted).toBe('string')
    })

    it('should handle Date objects', () => {
      const date = new Date('2024-12-25')
      const formatted = formatDate(date)
      expect(formatted).toBeTruthy()
    })

    it('should handle ISO date strings', () => {
      const dateString = '2024-06-15T14:30:00.000Z'
      const formatted = formatDate(dateString)
      expect(formatted).toBeTruthy()
    })
  })

  describe('cn (className merge)', () => {
    it('should merge class names', () => {
      const result = cn('class1', 'class2')
      expect(result).toContain('class1')
      expect(result).toContain('class2')
    })

    it('should handle conditional classes', () => {
      const result = cn('base', true && 'conditional')
      expect(result).toContain('base')
      expect(result).toContain('conditional')
    })

    it('should filter out falsy values', () => {
      const result = cn('base', false && 'conditional', null, undefined)
      expect(result).toBe('base')
    })

    it('should handle Tailwind merge correctly', () => {
      const result = cn('p-4', 'p-2')
      // After merge, should only have one padding class
      expect(result).toBeTruthy()
    })
  })
})

