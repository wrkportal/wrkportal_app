import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

// Helper function to safely access operationsAsset model
function getOperationsAsset() {
  return (prisma as any).operationsAsset as any
}

// GET - List network devices
// Note: This would ideally integrate with network monitoring systems
export async function GET(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'it', action: 'READ' },
    async (request, userInfo) => {
      try {
        // TODO: Integrate with network monitoring systems
        // Network devices would come from:
        // - SNMP monitoring
        // - Network management systems
        // - Custom network inventory

        // For now, we can use OperationsAsset with category 'Network Device'
        const operationsAsset = getOperationsAsset()
        if (!operationsAsset) {
          return NextResponse.json(
            { error: 'Operations asset model not available', devices: [], stats: { totalDevices: 0, onlineDevices: 0, offlineDevices: 0, avgUptime: 0, totalBandwidth: 0 } },
            { status: 503 }
          )
        }

        const networkDevices = await (operationsAsset as any).findMany({
          where: {
            tenantId: userInfo.tenantId,
            category: { contains: 'Network', mode: 'insensitive' },
          },
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        })

        const devices = networkDevices.map((device: any) => ({
          id: device.id,
          name: device.name,
          type: device.category || 'Network Device',
          ipAddress: '', // Would come from network monitoring
          status: device.status === 'ASSIGNED' ? 'ONLINE' : device.status === 'AVAILABLE' ? 'ONLINE' : 'OFFLINE',
          uptime: 99.8, // Would come from monitoring
          bandwidthUsage: 0, // Would come from monitoring
          location: device.location || '',
        }))

        const stats = {
          totalDevices: devices.length,
          onlineDevices: devices.filter((d: any) => d.status === 'ONLINE').length,
          offlineDevices: devices.filter((d: any) => d.status === 'OFFLINE').length,
          avgUptime: devices.length > 0 ? devices.reduce((sum: number, d: any) => sum + d.uptime, 0) / devices.length : 0,
          totalBandwidth: devices.reduce((sum: number, d: any) => sum + d.bandwidthUsage, 0),
        }

        return NextResponse.json({
          devices,
          stats,
        })
      } catch (error) {
        console.error('Error fetching network devices:', error)
        return NextResponse.json(
          { error: 'Failed to fetch network devices' },
          { status: 500 }
        )
      }
    }
  )
}

