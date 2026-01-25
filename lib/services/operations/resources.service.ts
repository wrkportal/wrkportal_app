import { prisma } from '@/lib/prisma'

// Type definitions for resources
type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EARLY_LEAVE' | 'ON_LEAVE' | 'SICK_LEAVE'

// Extended Prisma client type to include operations models that may not be in schema yet
type ExtendedPrismaClient = typeof prisma & {
  operationsResource?: {
    findMany: (args?: { where?: any; include?: any }) => Promise<any[]>
  }
  operationsAttendance?: {
    findMany: (args?: { where?: any }) => Promise<any[]>
  }
  operationsAttrition?: {
    count: (args?: { where?: any }) => Promise<number>
  }
  operationsShift?: {
    findFirst: (args?: { where?: any }) => Promise<any | null>
  }
  operationsShiftAssignment?: {
    count: (args?: { where?: any }) => Promise<number>
  }
  operationsOnboarding?: {
    findFirst: (args?: { where?: any }) => Promise<any | null>
  }
}

export interface CapacityStats {
  byDepartment: Array<{
    department: string
    total: number
    available: number
    utilized: number
    onLeave: number
    onTraining: number
    utilization: number
  }>
  totals: {
    total: number
    available: number
    utilization: number
    onLeave: number
    onTraining: number
  }
}

export interface AttendanceStats {
  total: number
  present: number
  absent: number
  late: number
  attendanceRate: number
}

export class ResourcesService {
  /**
   * Get capacity by department
   */
  static async getCapacityByDepartment(
    tenantId: string
  ): Promise<CapacityStats> {
    // Type assertion needed: These models may not be in Prisma schema yet
    const prismaClient = prisma as ExtendedPrismaClient
    
    const resources = await (prismaClient.operationsResource?.findMany({
      where: { tenantId },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
          },
        },
      },
    }) || Promise.resolve([]))

    const byDepartment: Record<string, any> = {}

    resources.forEach((resource: any) => {
      const dept = resource.department || 'Unassigned'
      if (!byDepartment[dept]) {
        byDepartment[dept] = {
          department: dept,
          total: 0,
          available: 0,
          utilized: 0,
          onLeave: 0,
          onTraining: 0,
        }
      }

      byDepartment[dept].total++
      if (!resource.onLeave && !resource.onTraining) {
        byDepartment[dept].available++
      }
      byDepartment[dept].utilized += Number(resource.utilization)
      if (resource.onLeave) byDepartment[dept].onLeave++
      if (resource.onTraining) byDepartment[dept].onTraining++
    })

    const capacityData = Object.values(byDepartment).map((dept: any) => ({
      ...dept,
      utilization:
        dept.total > 0
          ? Number((dept.utilized / dept.total).toFixed(1))
          : 0,
    }))

    const totals = {
      total: resources.length,
      available: resources.filter((r: any) => !r.onLeave && !r.onTraining).length,
      utilization:
        resources.length > 0
          ? Number(
              (
                resources.reduce((sum: number, r: any) => sum + Number(r.utilization), 0) /
                resources.length
              ).toFixed(1)
            )
          : 0,
      onLeave: resources.filter((r: any) => r.onLeave).length,
      onTraining: resources.filter((r: any) => r.onTraining).length,
    }

    return {
      byDepartment: capacityData,
      totals,
    }
  }

  /**
   * Get attendance statistics
   */
  static async getAttendanceStats(
    tenantId: string,
    date?: Date
  ): Promise<AttendanceStats> {
    const targetDate = date || new Date()
    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    // Type assertion needed: These models may not be in Prisma schema yet
    const prismaClient = prisma as ExtendedPrismaClient
    
    const records = await (prismaClient.operationsAttendance?.findMany({
      where: {
        tenantId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    }) || Promise.resolve([]))

    const present = records.filter((r: any) => r.status === 'PRESENT').length
    const absent = records.filter((r: any) => r.status === 'ABSENT').length
    const late = records.filter((r: any) => r.status === 'LATE').length
    const total = records.length
    const attendanceRate =
      total > 0 ? Number(((present / total) * 100).toFixed(1)) : 0

    return {
      total,
      present,
      absent,
      late,
      attendanceRate,
    }
  }

  /**
   * Calculate employee utilization
   */
  static calculateUtilization(
    totalHours: number,
    availableHours: number
  ): number {
    if (availableHours === 0) return 0
    return Number(((totalHours / availableHours) * 100).toFixed(1))
  }

  /**
   * Get attrition rate
   */
  static async getAttritionRate(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    // Type assertion needed: These models may not be in Prisma schema yet
    const prismaClient = prisma as ExtendedPrismaClient
    
    const [exits, avgHeadcount] = await Promise.all([
      (prismaClient.operationsAttrition?.count({
        where: {
          tenantId,
          exitDate: {
            gte: startDate,
            lte: endDate,
          },
        },
      }) || Promise.resolve(0)),
      prisma.user.count({
        where: {
          tenantId,
          status: 'ACTIVE',
        },
      }),
    ])

    if (avgHeadcount === 0) return 0

    const months = Math.max(
      1,
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
    )

    return Number(((exits / avgHeadcount / months) * 100).toFixed(2))
  }

  /**
   * Get shift coverage
   */
  static async getShiftCoverage(
    tenantId: string,
    shiftId: string,
    date: Date
  ): Promise<{
    required: number
    assigned: number
    coverage: number
  }> {
    // Type assertion needed: These models may not be in Prisma schema yet
    const prismaClient = prisma as ExtendedPrismaClient
    
    const shift = await (prismaClient.operationsShift?.findFirst({
      where: {
        id: shiftId,
        tenantId,
      },
    }) || Promise.resolve(null))

    if (!shift) {
      throw new Error('Shift not found')
    }

    const assignments = await (prismaClient.operationsShiftAssignment?.count({
      where: {
        shiftId,
        tenantId,
        startDate: { lte: date },
        OR: [{ endDate: null }, { endDate: { gte: date } }],
      },
    }) || Promise.resolve(0))

    // Default required coverage (can be configured per shift)
    const required = 5 // This should come from shift configuration

    return {
      required,
      assigned: assignments,
      coverage: Number(((assignments / required) * 100).toFixed(1)),
    }
  }

  /**
   * Calculate timesheet hours
   */
  static calculateTimesheetHours(
    checkIn: Date | null,
    checkOut: Date | null
  ): number {
    if (!checkIn || !checkOut) return 0
    return Number(
      ((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)).toFixed(2)
    )
  }

  /**
   * Get onboarding progress
   */
  static async getOnboardingProgress(
    tenantId: string,
    onboardingId: string
  ): Promise<{
    progress: number
    status: string
    milestones: Array<{ name: string; completed: boolean }>
  }> {
    // Type assertion needed: These models may not be in Prisma schema yet
    const prismaClient = prisma as ExtendedPrismaClient
    
    const onboarding = await (prismaClient.operationsOnboarding?.findFirst({
      where: {
        id: onboardingId,
        tenantId,
      },
    }) || Promise.resolve(null))

    if (!onboarding) {
      throw new Error('Onboarding record not found')
    }

    // Default milestones (can be customized)
    const milestones = [
      { name: 'Documentation', completed: onboarding.progress >= 25 },
      { name: 'Orientation', completed: onboarding.progress >= 50 },
      { name: 'Training', completed: onboarding.progress >= 75 },
      { name: 'Final Review', completed: onboarding.progress >= 100 },
    ]

    return {
      progress: onboarding.progress,
      status: onboarding.status,
      milestones,
    }
  }
}

