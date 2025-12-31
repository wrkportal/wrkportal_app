import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { parseFile } from '@/lib/reporting-studio/file-parser'
import { detectSchema, suggestColumnDescriptions } from '@/lib/reporting-studio/schema-detector'
import { readFile } from 'fs/promises'
import { get } from '@vercel/blob'

const isDevelopment = process.env.NODE_ENV === 'development'

/**
 * GET /api/reporting-studio/files/[id]/schema
 * Get detected schema for a file
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

    // Parse file (limit to 1000 rows for schema detection)
    const parsedData = await parseFile(buffer, file.originalName, {
      limit: 1000,
      detectSchema: true,
    })

    // Detect schema
    const detectedSchema = detectSchema(parsedData)

    // Suggest column descriptions
    const descriptions = suggestColumnDescriptions(parsedData.columns, parsedData.rows)

    return NextResponse.json({
      schema: detectedSchema,
      columnDescriptions: descriptions,
      preview: {
        rows: parsedData.sampleData,
        columns: parsedData.columns,
      },
    })
  } catch (error: any) {
    console.error('Error detecting schema:', error)
    return NextResponse.json(
      { error: 'Failed to detect schema', details: error.message },
      { status: 500 }
    )
  }
}

