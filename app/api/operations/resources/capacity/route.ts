import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

// GET - Get capacity data by department
export async function GET(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'READ' },
    async (request, userInfo) => {
      try {
        const resources = await prisma.operationsResource.findMany({
          where: { tenantId: userInfo.tenantId },
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

        // Group by department
        const byDepartment: Record<string, any> = {}
        
        resources.forEach(resource => {
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

        // Calculate averages
        const capacityData = Object.values(byDepartment).map((dept: any) => ({
          ...dept,
          utilization: dept.total > 0 ? Number((dept.utilized / dept.total).toFixed(1)) : 0,
        }))

        // Calculate totals
        const totals = {
          total: resources.length,
          available: resources.filter(r => !r.onLeave && !r.onTraining).length,
          utilization: resources.length > 0
            ? Number((resources.reduce((sum, r) => sum + Number(r.utilization), 0) / resources.length).toFixed(1))
            : 0,
          onLeave: resources.filter(r => r.onLeave).length,
          onTraining: resources.filter(r => r.onTraining).length,
        }

        return NextResponse.json({
          byDepartment: capacityData,
          totals,
        })
      } catch (error) {
        console.error('Error fetching capacity data:', error)
        return NextResponse.json(
          { error: 'Failed to fetch capacity data' },
          { status: 500 }
        )
      }
    }
  )
}

