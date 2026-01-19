import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

// GET - List software licenses
// Note: This would ideally integrate with license management systems
export async function GET(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'it', action: 'READ' },
    async (request, userInfo) => {
      try {
        // TODO: Create ITLicense model or use existing structure
        // For now, return placeholder structure
        // Licenses would come from:
        // - License management systems
        // - Software asset management (SAM) tools
        // - Manual tracking

        const licenses: any[] = []

        const stats = {
          total: licenses.length,
          active: licenses.filter(l => l.status === 'ACTIVE').length,
          expiringSoon: licenses.filter(l => {
            if (!l.expiryDate) return false
            const expiry = new Date(l.expiryDate)
            const daysUntilExpiry = Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            return daysUntilExpiry <= 30 && daysUntilExpiry > 0
          }).length,
          expired: licenses.filter(l => {
            if (!l.expiryDate) return false
            return new Date(l.expiryDate) < new Date()
          }).length,
          totalCost: licenses.reduce((sum, l) => sum + (l.cost || 0), 0),
        }

        return NextResponse.json({
          licenses,
          stats,
        })
      } catch (error) {
        console.error('Error fetching licenses:', error)
        return NextResponse.json(
          { error: 'Failed to fetch licenses' },
          { status: 500 }
        )
      }
    }
  )
}

