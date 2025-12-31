import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getFunctionRegistry, FunctionDefinition } from '@/lib/reporting-engine/function-registry'

// GET: Get function details
export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const registry = getFunctionRegistry()
    const func = registry.get(params.name)

    if (!func) {
      return NextResponse.json(
        { error: 'Function not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ function: func })
  } catch (error: any) {
    console.error('Error fetching function:', error)
    return NextResponse.json(
      { error: 'Failed to fetch function', details: error.message },
      { status: 500 }
    )
  }
}

// PUT: Update function
export async function PUT(
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

    const registry = getFunctionRegistry()
    const existingFunc = registry.get(params.name)

    if (!existingFunc) {
      return NextResponse.json(
        { error: 'Function not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const updatedFunc: FunctionDefinition = { ...existingFunc, ...body }

    // Remove old function and register updated one
    registry.remove(params.name)
    registry.register(updatedFunc, true)

    return NextResponse.json({
      success: true,
      message: `Function ${params.name} updated successfully`,
      function: updatedFunc
    })
  } catch (error: any) {
    console.error('Error updating function:', error)
    return NextResponse.json(
      { error: 'Failed to update function', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE: Remove function
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

    const registry = getFunctionRegistry()
    const removed = registry.remove(params.name)

    if (!removed) {
      return NextResponse.json(
        { error: 'Function not found or cannot be removed' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Function ${params.name} removed successfully`
    })
  } catch (error: any) {
    console.error('Error removing function:', error)
    return NextResponse.json(
      { error: 'Failed to remove function', details: error.message },
      { status: 500 }
    )
  }
}















