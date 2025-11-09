import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get tenant ID
    const tenantId = (session.user as any).tenantId

    // Fetch files for this tenant
    const files = await prisma.reportingFile.findMany({
      where: {
        tenantId: tenantId,
      },
      orderBy: {
        uploadedAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        originalName: true,
        size: true,
        type: true,
        rowCount: true,
        columnCount: true,
        isMerged: true,
        uploadedAt: true,
      },
    })

    return NextResponse.json({ files }, { status: 200 })
  } catch (error) {
    console.error('Error fetching files:', error)
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    )
  }
}

