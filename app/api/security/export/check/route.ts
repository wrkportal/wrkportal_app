import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { checkExportAllowed, logExportActivity } from '@/lib/security/data-loss-prevention'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { resourceType, format, rowCount, fields, filters } = body

    const exportRequest = {
      userId: session.user.id,
      tenantId: session.user.tenantId,
      resourceType,
      format,
      rowCount,
      fields,
      filters
    }

    const result = await checkExportAllowed(exportRequest)
    
    // Log the export check
    await logExportActivity(exportRequest, result.allowed, undefined)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error checking export:', error)
    return NextResponse.json(
      { error: 'Failed to check export permissions' },
      { status: 500 }
    )
  }
}

