import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; contractId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const clauses = await prisma.contractClause.findMany({
      where: {
        contractId: params.contractId,
        contract: {
          quoteId: params.id,
          tenantId: session.user.tenantId!,
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(clauses)
  } catch (error: any) {
    console.error('Error fetching contract clauses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contract clauses', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; contractId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { clauseType, clauseText, isStandard, industry } = body

    // Check for unusual clauses (simple heuristic: check length, keywords, etc.)
    const isUnusual = checkUnusualClause(clauseText, clauseType)

    // Get clause suggestion based on industry and type
    const suggestedClause = getClauseSuggestion(clauseType, industry)

    const clause = await prisma.contractClause.create({
      data: {
        contractId: params.contractId,
        clauseType,
        clauseText,
        isStandard: isStandard || false,
        isUnusual,
        suggestedClause: suggestedClause || null,
        industry: industry || null,
      },
    })

    return NextResponse.json(clause)
  } catch (error: any) {
    console.error('Error creating contract clause:', error)
    return NextResponse.json(
      { error: 'Failed to create contract clause', details: error.message },
      { status: 500 }
    )
  }
}

function checkUnusualClause(text: string, type: string): boolean {
  // Simple heuristic: check for unusual patterns
  const unusualKeywords = ['unlimited', 'irrevocable', 'perpetual', 'absolute', 'guaranteed']
  const lowerText = text.toLowerCase()
  return unusualKeywords.some(keyword => lowerText.includes(keyword))
}

function getClauseSuggestion(clauseType: string, industry?: string): string | null {
  // Simple suggestion logic - in production, this would use AI or a clause library
  const suggestions: Record<string, string> = {
    indemnity: 'Use fallback clause B for this industry',
    liability_cap: 'Standard liability cap: $500,000 or contract value, whichever is lower',
    payment_terms: 'Standard payment terms: Net 30',
  }
  return suggestions[clauseType.toLowerCase()] || null
}

