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

    if (!tenantId) {
      console.warn('No tenantId found for user, returning empty files array')
      return NextResponse.json({ files: [] }, { status: 200 })
    }

    try {
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
    } catch (dbError: any) {
      // Handle case where ReportingFile table might not exist yet
      if (dbError.code === 'P2001' || dbError.message?.includes('does not exist') || dbError.message?.includes('Unknown model')) {
        console.warn('ReportingFile table not found, returning empty array')
        return NextResponse.json({ files: [] }, { status: 200 })
      }
      throw dbError
    }
  } catch (error) {
    console.error('Error fetching files:', error)
    // Return empty array instead of 500 to prevent UI errors
    return NextResponse.json({ files: [] }, { status: 200 })
  }
}

