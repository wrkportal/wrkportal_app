import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getConsentStatus, updateConsent } from '@/lib/security/gdpr-compliance'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const contactId = searchParams.get('contactId')

    if (!contactId) {
      return NextResponse.json(
        { error: 'Contact ID is required' },
        { status: 400 }
      )
    }

    const consent = await getConsentStatus(contactId, session.user.tenantId)
    return NextResponse.json(consent)
  } catch (error) {
    console.error('Error fetching consent:', error)
    return NextResponse.json(
      { error: 'Failed to fetch consent status' },
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
    const { contactId, consent } = body

    if (!contactId) {
      return NextResponse.json(
        { error: 'Contact ID is required' },
        { status: 400 }
      )
    }

    await updateConsent(contactId, session.user.tenantId, consent)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating consent:', error)
    return NextResponse.json(
      { error: 'Failed to update consent' },
      { status: 500 }
    )
  }
}

