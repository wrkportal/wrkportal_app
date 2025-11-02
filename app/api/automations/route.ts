import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET /api/automations - Fetch all automations for the tenant
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's tenant
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { tenantId: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // For now, return empty array since automations table doesn't exist yet
    // In production, this would query the automations table
    const automations: any[] = []

    // Calculate stats
    const stats = {
      totalAutomations: automations.length,
      activeAutomations: automations.filter((a: any) => a.enabled).length,
      totalExecutions: automations.reduce(
        (sum: number, a: any) => sum + (a.executions || 0),
        0
      ),
      avgSuccessRate: automations.length > 0 ? 98.5 : 0,
      timeSaved: automations.reduce(
        (sum: number, a: any) => sum + (a.timeSaved || 0),
        0
      ),
    }

    return NextResponse.json(
      {
        automations,
        stats,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching automations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
