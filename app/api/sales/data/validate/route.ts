import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { validateLead, validateContact, validateAccount } from '@/lib/sales/data-validation'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { entityType, data } = body

    if (!entityType || !data) {
      return NextResponse.json(
        { error: 'entityType and data are required' },
        { status: 400 }
      )
    }

    let result

    switch (entityType) {
      case 'lead':
        result = validateLead(data)
        break
      case 'contact':
        result = validateContact(data)
        break
      case 'account':
        result = validateAccount(data)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid entityType. Must be lead, contact, or account' },
          { status: 400 }
        )
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error validating data:', error)
    return NextResponse.json(
      { error: 'Failed to validate data' },
      { status: 500 }
    )
  }
}

