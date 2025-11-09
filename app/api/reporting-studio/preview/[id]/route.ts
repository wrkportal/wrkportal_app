import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { readFile } from 'fs/promises'
import * as XLSX from 'xlsx'
import { parse } from 'csv-parse/sync'

const MAX_PREVIEW_ROWS = 100
const isDevelopment = process.env.NODE_ENV === 'development'

// Helper function to fetch file content
async function fetchFileContent(filePath: string): Promise<Buffer> {
  if (isDevelopment || !filePath.startsWith('http')) {
    // Development: Read from filesystem
    return await readFile(filePath)
  } else {
    // Production: Fetch from Vercel Blob Storage
    const response = await fetch(filePath)
    if (!response.ok) {
      throw new Error('Failed to fetch file from blob storage')
    }
    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = (session.user as any).tenantId

    // Find the file
    const file = await prisma.reportingFile.findFirst({
      where: {
        id: params.id,
        tenantId: tenantId,
      },
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Read and parse the file
    const buffer = await fetchFileContent(file.filePath)
    const fileExt = file.originalName.substring(file.originalName.lastIndexOf('.')).toLowerCase()

    let columns: string[] = []
    let rows: any[][] = []

    if (fileExt === '.csv') {
      const content = buffer.toString('utf-8')
      const records = parse(content, { 
        columns: true, 
        skip_empty_lines: true,
        to: MAX_PREVIEW_ROWS + 1 // +1 for header
      })

      if (records.length > 0) {
        columns = Object.keys(records[0])
        rows = records.slice(0, MAX_PREVIEW_ROWS).map((record: any) => 
          columns.map(col => record[col])
        )
      }
    } else {
      // Excel file
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })

      if (data.length > 0) {
        columns = (data[0] as any[]).map(col => String(col || ''))
        rows = data.slice(1, MAX_PREVIEW_ROWS + 1).map((row: any) => {
          const rowArray = Array.isArray(row) ? row : []
          return columns.map((_, idx) => rowArray[idx] !== undefined ? rowArray[idx] : null)
        })
      }
    }

    return NextResponse.json({ columns, rows }, { status: 200 })
  } catch (error) {
    console.error('Error previewing file:', error)
    return NextResponse.json(
      { error: 'Failed to preview file' },
      { status: 500 }
    )
  }
}

