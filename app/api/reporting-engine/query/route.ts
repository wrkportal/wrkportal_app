import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getQueryEngine, Query, QueryOptions } from '@/lib/reporting-engine/query-engine'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { query, options = {} }: { query: Query; options?: QueryOptions } = body

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    // Validate query
    const queryEngine = getQueryEngine()
    const validation = queryEngine.validate(query)

    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid query', details: validation.errors },
        { status: 400 }
      )
    }

    // Optimize query
    const optimizedQuery = queryEngine.optimize(query)

    // Execute query
    const result = await queryEngine.execute(
      optimizedQuery,
      session.user.tenantId!,
      {
        limit: options.limit || 1000,
        offset: options.offset || 0,
        cache: options.cache !== false,
        timeout: options.timeout || 30000
      }
    )

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Query execution error:', error)
    return NextResponse.json(
      { error: 'Query execution failed', details: error.message },
      { status: 500 }
    )
  }
}















