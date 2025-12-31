/**
 * Integration Tests for Schedules API
 */

import { GET, POST } from '@/app/api/schedules/route'
import { NextRequest } from 'next/server'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    reportSchedule: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}))

// Mock permission middleware
jest.mock('@/lib/permissions/permission-middleware', () => ({
  withPermissionCheck: jest.fn((req, permission, handler) => {
    return handler(req, {
      userId: 'test-user-id',
      tenantId: 'test-tenant-id',
      email: 'test@example.com',
    })
  }),
}))

describe('/api/schedules', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should return empty array when no schedules exist', async () => {
      const { prisma } = require('@/lib/prisma')
      prisma.reportSchedule.findMany.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/schedules')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.schedules).toEqual([])
    })

    it('should return schedules for tenant', async () => {
      const { prisma } = require('@/lib/prisma')
      const mockSchedules = [
        {
          id: '1',
          name: 'Test Schedule',
          tenantId: 'test-tenant-id',
          frequency: 'DAILY',
        },
      ]
      prisma.reportSchedule.findMany.mockResolvedValue(mockSchedules)

      const request = new NextRequest('http://localhost:3000/api/schedules')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.schedules).toHaveLength(1)
      expect(data.schedules[0].name).toBe('Test Schedule')
    })

    it('should filter by resourceType when provided', async () => {
      const { prisma } = require('@/lib/prisma')
      prisma.reportSchedule.findMany.mockResolvedValue([])

      const request = new NextRequest(
        'http://localhost:3000/api/schedules?resourceType=REPORT'
      )
      await GET(request)

      expect(prisma.reportSchedule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            resourceType: 'REPORT',
          }),
        })
      )
    })
  })

  describe('POST', () => {
    it('should create a new schedule', async () => {
      const { prisma } = require('@/lib/prisma')
      const mockSchedule = {
        id: 'new-id',
        name: 'New Schedule',
        tenantId: 'test-tenant-id',
        frequency: 'DAILY',
        createdById: 'test-user-id',
      }
      prisma.reportSchedule.create.mockResolvedValue(mockSchedule)

      const request = new NextRequest('http://localhost:3000/api/schedules', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Schedule',
          resourceType: 'REPORT',
          resourceId: 'report-1',
          frequency: 'DAILY',
          deliveryChannels: ['EMAIL'],
          recipients: ['test@example.com'],
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.schedule.name).toBe('New Schedule')
      expect(prisma.reportSchedule.create).toHaveBeenCalled()
    })

    it('should return 400 for invalid data', async () => {
      const request = new NextRequest('http://localhost:3000/api/schedules', {
        method: 'POST',
        body: JSON.stringify({
          // Missing required fields
          name: '',
        }),
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
    })
  })
})

