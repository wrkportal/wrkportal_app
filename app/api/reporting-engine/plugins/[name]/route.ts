import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getPluginSystem } from '@/lib/reporting-engine/plugin-system'

// GET: Get plugin details
export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const pluginSystem = getPluginSystem()
    const plugin = pluginSystem.get(params.name)

    if (!plugin) {
      return NextResponse.json(
        { error: 'Plugin not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ plugin })
  } catch (error: any) {
    console.error('Error fetching plugin:', error)
    return NextResponse.json(
      { error: 'Failed to fetch plugin', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE: Uninstall plugin
export async function DELETE(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    // TODO: Add proper role check

    const pluginSystem = getPluginSystem()
    const removed = pluginSystem.unload(params.name)

    if (!removed) {
      return NextResponse.json(
        { error: 'Plugin not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Plugin ${params.name} uninstalled successfully`
    })
  } catch (error: any) {
    console.error('Error uninstalling plugin:', error)
    return NextResponse.json(
      { error: 'Failed to uninstall plugin', details: error.message },
      { status: 500 }
    )
  }
}

// POST: Enable/disable plugin
export async function POST(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    // TODO: Add proper role check

    const body = await request.json()
    const { action }: { action: 'enable' | 'disable' } = body

    if (!action || !['enable', 'disable'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be "enable" or "disable"' },
        { status: 400 }
      )
    }

    const pluginSystem = getPluginSystem()
    const success = action === 'enable'
      ? pluginSystem.enable(params.name)
      : pluginSystem.disable(params.name)

    if (!success) {
      return NextResponse.json(
        { error: 'Plugin not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Plugin ${params.name} ${action}d successfully`
    })
  } catch (error: any) {
    console.error('Error updating plugin:', error)
    return NextResponse.json(
      { error: 'Failed to update plugin', details: error.message },
      { status: 500 }
    )
  }
}















