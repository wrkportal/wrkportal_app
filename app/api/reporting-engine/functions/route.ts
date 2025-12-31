import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getFunctionRegistry, FunctionDefinition } from '@/lib/reporting-engine/function-registry'

// GET: List all functions
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const registry = getFunctionRegistry()
    const category = request.nextUrl.searchParams.get('category')

    let functions: FunctionDefinition[]

    if (category) {
      functions = registry.getByCategory(category)
    } else {
      functions = registry.getAll()
    }

    return NextResponse.json({ functions })
  } catch (error: any) {
    console.error('Error fetching functions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch functions', details: error.message },
      { status: 500 }
    )
  }
}

// POST: Register a custom function
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin (only admins can register custom functions)
    // TODO: Add proper role check

    const body = await request.json()
    const functionDef: FunctionDefinition = body

    // Validate function definition
    if (!functionDef.name || !functionDef.execute) {
      return NextResponse.json(
        { error: 'Function name and execute function are required' },
        { status: 400 }
      )
    }

    // Register function
    const registry = getFunctionRegistry()

    try {
      registry.register(functionDef, true) // true = custom function

      return NextResponse.json({
        success: true,
        message: `Function ${functionDef.name} registered successfully`,
        function: functionDef
      })
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Failed to register function', details: error.message },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Error registering function:', error)
    return NextResponse.json(
      { error: 'Failed to register function', details: error.message },
      { status: 500 }
    )
  }
}















