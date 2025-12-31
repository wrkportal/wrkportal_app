import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { refineQuery, type QueryRefinementRequest } from '@/lib/reporting-studio/nlq-enhancement'

/**
 * POST /api/reporting-studio/nlq/refine
 * Refine a SQL query based on user feedback
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body: QueryRefinementRequest = await request.json()

    if (!body.originalQuestion || !body.originalSQL) {
      return NextResponse.json(
        { error: 'Original question and SQL are required' },
        { status: 400 }
      )
    }

    // Refine the query
    const result = await refineQuery(body)

    // TODO: Store learning example for future improvement
    if (body.userFeedback && body.correctedSQL) {
      // Store in database for learning
      // This would be used for fine-tuning the model
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error refining query:', error)
    return NextResponse.json(
      { error: 'Failed to refine query', details: error.message },
      { status: 500 }
    )
  }
}

