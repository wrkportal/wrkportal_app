import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { parseFile } from '@/lib/reporting-studio/file-parser'
import { REPORTING_STUDIO_CONFIG } from '@/lib/reporting-studio/constants'
import { readFile } from 'fs/promises'
import { get } from '@vercel/blob'

const isDevelopment = process.env.NODE_ENV === 'development'

/**
 * GET /api/reporting-studio/files/[id]/preview
 * Get preview of file data (limited rows)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Find the file
    const file = await prisma.reportingFile.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId,
      },
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Get limit from query params
    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '100'),
      REPORTING_STUDIO_CONFIG.MAX_QUERY_ROWS
    )

    // Read file content
    let buffer: Buffer
    if (isDevelopment) {
      buffer = await readFile(file.filePath)
    } else {
      // Production: Read from Vercel Blob
      const blob = await get(file.filePath)
      const arrayBuffer = await blob.arrayBuffer()
      buffer = Buffer.from(arrayBuffer)
    }

    // Parse file with limit
    const parsedData = await parseFile(buffer, file.originalName, {
      limit,
      detectSchema: false, // Faster preview without schema detection
    })

    return NextResponse.json({
      file: {
        id: file.id,
        name: file.originalName,
        rowCount: file.rowCount,
        columnCount: file.columnCount,
      },
      data: {
        rows: parsedData.rows,
        columns: parsedData.columns,
        rowCount: parsedData.rowCount,
        columnCount: parsedData.columnCount,
      },
    })
  } catch (error: any) {
    console.error('Error previewing file:', error)
    return NextResponse.json(
      { error: 'Failed to preview file', details: error.message },
      { status: 500 }
    )
  }
}

