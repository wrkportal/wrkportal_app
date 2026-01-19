/**
 * Sales Dashboards API
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  createDashboard,
  getDashboards,
  getAvailableWidgetTypes,
} from '@/lib/sales/dashboards'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') as 'PERSONAL' | 'TEAM' | 'EXECUTIVE' | 'CUSTOM' | null

    const dashboards = await getDashboards(
      session.user.tenantId,
      session.user.id,
      type || undefined
    )

    return NextResponse.json(dashboards)
  } catch (error: any) {
    console.error('Error fetching dashboards:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboards', details: error.message },
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
    const { name, description, type, widgets, layout, filters, isDefault, sharedWith } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Dashboard name is required' },
        { status: 400 }
      )
    }

    const dashboard = await createDashboard(
      session.user.tenantId,
      session.user.id,
      {
        name,
        description,
        type: type || 'PERSONAL',
        widgets,
        layout,
        filters,
        isDefault,
        sharedWith,
      }
    )

    return NextResponse.json(dashboard, { status: 201 })
  } catch (error: any) {
    console.error('Error creating dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to create dashboard', details: error.message },
      { status: 500 }
    )
  }
}

// Get available widget types
export async function OPTIONS(request: NextRequest) {
  try {
    const widgetTypes = getAvailableWidgetTypes()
    return NextResponse.json({ widgetTypes })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to get widget types', details: error.message },
      { status: 500 }
    )
  }
}

