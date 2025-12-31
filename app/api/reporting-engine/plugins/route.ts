import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getPluginSystem, Plugin } from '@/lib/reporting-engine/plugin-system'

// GET: List all plugins
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const pluginSystem = getPluginSystem()
    const plugins = pluginSystem.getAll()

    return NextResponse.json({ plugins })
  } catch (error: any) {
    console.error('Error fetching plugins:', error)
    return NextResponse.json(
      { error: 'Failed to fetch plugins', details: error.message },
      { status: 500 }
    )
  }
}

// POST: Install/load a plugin
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    // TODO: Add proper role check

    const body = await request.json()
    const plugin: Plugin = body

    // Validate plugin
    if (!plugin.name || !plugin.version) {
      return NextResponse.json(
        { error: 'Plugin name and version are required' },
        { status: 400 }
      )
    }

    // Load plugin
    const pluginSystem = getPluginSystem()

    try {
      await pluginSystem.load(plugin)

      return NextResponse.json({
        success: true,
        message: `Plugin ${plugin.name} installed successfully`,
        plugin
      })
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Failed to install plugin', details: error.message },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Error installing plugin:', error)
    return NextResponse.json(
      { error: 'Failed to install plugin', details: error.message },
      { status: 500 }
    )
  }
}















