import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

// Helper function to safely access operationsResource model
function getOperationsResource() {
  return (prisma as any).operationsResource as any
}

type OperationsResource = {
  department: string | null
  onLeave: boolean
  onTraining: boolean
  utilization: number | string
}

// GET - Get capacity data by department
export async function GET(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'READ' },
    async (request, userInfo) => {
      try {
        const operationsResource = getOperationsResource()
        if (!operationsResource) {
          return NextResponse.json(
            { error: 'Operations resource model not available' },
            { status: 503 }
          )
        }

        const resources = await operationsResource.findMany({
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
        const byDepartment: Record<string, any> = {};
        
        (resources as OperationsResource[]).forEach((resource: OperationsResource) => {
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
          available: (resources as OperationsResource[]).filter((r: OperationsResource) => !r.onLeave && !r.onTraining).length,
          utilization: resources.length > 0
            ? Number(((resources as OperationsResource[]).reduce((sum: number, r: OperationsResource) => sum + Number(r.utilization), 0) / resources.length).toFixed(1))
            : 0,
          onLeave: (resources as OperationsResource[]).filter((r: OperationsResource) => r.onLeave).length,
          onTraining: (resources as OperationsResource[]).filter((r: OperationsResource) => r.onTraining).length,
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

