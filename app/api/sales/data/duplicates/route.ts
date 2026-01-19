import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { 
  detectLeadDuplicates, 
  detectContactDuplicates, 
  detectAccountDuplicates,
  mergeDuplicates
} from '@/lib/sales/duplicate-detection'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get('entityType') as 'lead' | 'contact' | 'account'
    const entityId = searchParams.get('entityId')

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'entityType and entityId are required' },
        { status: 400 }
      )
    }

    let duplicates = []

    switch (entityType) {
      case 'lead':
        duplicates = await detectLeadDuplicates(entityId, session.user.tenantId)
        break
      case 'contact':
        duplicates = await detectContactDuplicates(entityId, session.user.tenantId)
        break
      case 'account':
        duplicates = await detectAccountDuplicates(entityId, session.user.tenantId)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid entityType' },
          { status: 400 }
        )
    }

    return NextResponse.json({ duplicates })
  } catch (error: any) {
    console.error('Error detecting duplicates:', error)
    return NextResponse.json(
      { error: 'Failed to detect duplicates' },
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
    const { sourceId, targetId, entityType } = body

    if (!sourceId || !targetId || !entityType) {
      return NextResponse.json(
        { error: 'sourceId, targetId, and entityType are required' },
        { status: 400 }
      )
    }

    await mergeDuplicates(sourceId, targetId, entityType, session.user.tenantId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error merging duplicates:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to merge duplicates' },
      { status: 500 }
    )
  }
}

