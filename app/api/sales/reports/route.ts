/**
 * Sales Reports API
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  createReport,
  getReports,
} from '@/lib/sales/reports'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') as 'ANALYTICS' | 'PERFORMANCE' | 'FORECAST' | 'CUSTOM' | null

    const reports = await getReports(
      session.user.tenantId,
      session.user.id,
      type || undefined
    )

    return NextResponse.json(reports)
  } catch (error: any) {
    console.error('Error fetching reports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reports', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, config, schedule, sharedWith } = body

    if (!name || !config) {
      return NextResponse.json(
        { error: 'Report name and config are required' },
        { status: 400 }
      )
    }

    const report = await createReport(
      session.user.tenantId,
      session.user.id,
      {
        name,
        description,
        config,
        schedule,
        sharedWith,
      }
    )

    return NextResponse.json(report, { status: 201 })
  } catch (error: any) {
    console.error('Error creating report:', error)
    return NextResponse.json(
      { error: 'Failed to create report', details: error.message },
      { status: 500 }
    )
  }
}

