/**
 * Sales Dashboard API - Single Dashboard
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  getDashboard,
  updateDashboard,
  deleteDashboard,
} from '@/lib/sales/dashboards'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dashboard = await getDashboard(
      params.id,
      session.user.tenantId,
      session.user.id
    )

    if (!dashboard) {
      return NextResponse.json(
        { error: 'Dashboard not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(dashboard)
  } catch (error: any) {
    console.error('Error fetching dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard', details: error.message },
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
    const { name, description, type, widgets, layout, filters, isDefault, sharedWith } = body

    const dashboard = await updateDashboard(
      params.id,
      session.user.tenantId,
      session.user.id,
      {
        name,
        description,
        type,
        widgets,
        layout,
        filters,
        isDefault,
        sharedWith,
      }
    )

    return NextResponse.json(dashboard)
  } catch (error: any) {
    console.error('Error updating dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to update dashboard', details: error.message },
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

    await deleteDashboard(
      params.id,
      session.user.tenantId,
      session.user.id
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to delete dashboard', details: error.message },
      { status: 500 }
    )
  }
}

