import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getRuleExecutionHistory, getRuleExecutionStats, getTenantExecutions } from '@/lib/sales/rule-execution-history'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const ruleId = searchParams.get('ruleId')
    const status = searchParams.get('status') as 'SUCCESS' | 'FAILED' | 'PARTIAL' | 'SKIPPED' | null
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '100')

    if (ruleId) {
      // Get history for specific rule
      const history = await getRuleExecutionHistory(ruleId, session.user.tenantId, limit)
      const stats = await getRuleExecutionStats(ruleId, session.user.tenantId)
      
      return NextResponse.json({
        history,
        stats,
      })
    } else {
      // Get all executions for tenant
      const executions = await getTenantExecutions(
        session.user.tenantId,
        {
          status: status || undefined,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
        },
        limit
      )

      return NextResponse.json({ executions })
    }
  } catch (error: any) {
    console.error('Error fetching execution history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch execution history' },
      { status: 500 }
    )
  }
}

