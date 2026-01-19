/**
 * Sales Report API - Single Report
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  getReport,
  updateReport,
  deleteReport,
  generateReportData,
} from '@/lib/sales/reports'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const generate = searchParams.get('generate') === 'true'

    if (generate) {
      // Generate report data
      const data = await generateReportData(
        params.id,
        session.user.tenantId
      )
      return NextResponse.json({ data })
    }

    const report = await getReport(
      params.id,
      session.user.tenantId,
      session.user.id
    )

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(report)
  } catch (error: any) {
    console.error('Error fetching report:', error)
    return NextResponse.json(
      { error: 'Failed to fetch report', details: error.message },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, config, schedule, sharedWith } = body

    const report = await updateReport(
      params.id,
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

    return NextResponse.json(report)
  } catch (error: any) {
    console.error('Error updating report:', error)
    return NextResponse.json(
      { error: 'Failed to update report', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await deleteReport(
      params.id,
      session.user.tenantId,
      session.user.id
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting report:', error)
    return NextResponse.json(
      { error: 'Failed to delete report', details: error.message },
      { status: 500 }
    )
  }
}

