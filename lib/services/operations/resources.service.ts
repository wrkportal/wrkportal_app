import { prisma } from '@/lib/prisma'
import { AttendanceStatus, ResourceStatus } from '@prisma/client'

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
    const resources = await prisma.operationsResource.findMany({
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
    })

    const byDepartment: Record<string, any> = {}

    resources.forEach((resource) => {
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
      available: resources.filter((r) => !r.onLeave && !r.onTraining).length,
      utilization:
        resources.length > 0
          ? Number(
              (
                resources.reduce((sum, r) => sum + Number(r.utilization), 0) /
                resources.length
              ).toFixed(1)
            )
          : 0,
      onLeave: resources.filter((r) => r.onLeave).length,
      onTraining: resources.filter((r) => r.onTraining).length,
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

    const records = await prisma.operationsAttendance.findMany({
      where: {
        tenantId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    })

    const present = records.filter((r) => r.status === 'PRESENT').length
    const absent = records.filter((r) => r.status === 'ABSENT').length
    const late = records.filter((r) => r.status === 'LATE').length
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
    const [exits, avgHeadcount] = await Promise.all([
      prisma.operationsAttrition.count({
        where: {
          tenantId,
          exitDate: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
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
    const shift = await prisma.operationsShift.findFirst({
      where: {
        id: shiftId,
        tenantId,
      },
    })

    if (!shift) {
      throw new Error('Shift not found')
    }

    const assignments = await prisma.operationsShiftAssignment.count({
      where: {
        shiftId,
        tenantId,
        startDate: { lte: date },
        OR: [{ endDate: null }, { endDate: { gte: date } }],
      },
    })

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
    const onboarding = await prisma.operationsOnboarding.findFirst({
      where: {
        id: onboardingId,
        tenantId,
      },
    })

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

