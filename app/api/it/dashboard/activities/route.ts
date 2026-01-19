import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

// GET - Get recent IT activities for dashboard
export async function GET(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'it', action: 'READ' },
    async (request, userInfo) => {
      try {
        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get('limit') || '5')

        const activities: any[] = []

        // Get recent tickets (using SalesCase)
        const recentTickets = await prisma.salesCase.findMany({
          where: { tenantId: userInfo.tenantId },
          include: {
            assignedTo: {
              select: { name: true },
            },
            createdBy: {
              select: { name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
        })

        recentTickets.forEach((ticket) => {
          const formatTimeAgo = (date: Date) => {
            const now = new Date()
            const diffMs = now.getTime() - date.getTime()
            const diffMins = Math.floor(diffMs / (1000 * 60))
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

            if (diffMins < 60) return `${diffMins} minutes ago`
            if (diffHours < 24) return `${diffHours} hours ago`
            if (diffDays < 7) return `${diffDays} days ago`
            return date.toLocaleDateString()
          }

          activities.push({
            id: ticket.id,
            title: ticket.subject,
            priority: ticket.priority,
            status: ticket.status,
            assignee: ticket.assignedTo?.name || 'Unassigned',
            created: formatTimeAgo(ticket.createdAt),
            createdAt: ticket.createdAt,
          })
        })

        // Sort by time and limit
        activities.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )

        return NextResponse.json({ tickets: activities.slice(0, limit) })
      } catch (error) {
        console.error('Error fetching activities:', error)
        return NextResponse.json(
          { error: 'Failed to fetch activities' },
          { status: 500 }
        )
      }
    }
  )
}

