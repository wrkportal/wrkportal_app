import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { readFile } from 'fs/promises'
import * as XLSX from 'xlsx'
import { parse } from 'csv-parse/sync'

async function fetchFileContent(filePath: string): Promise<Buffer> {
  // Check if it's a URL (Vercel Blob) or local path
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    const response = await fetch(filePath)
    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }
  return readFile(filePath)
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

    // Read and parse the file to extract column names
    const buffer = await fetchFileContent(file.filePath)
    const fileExt = file.originalName.substring(file.originalName.lastIndexOf('.')).toLowerCase()

    let fields: string[] = []

    try {
      if (fileExt === '.csv') {
        const content = buffer.toString('utf-8')
        const records = parse(content, { 
          columns: true, 
          skip_empty_lines: true,
          to: 1 // Only parse first row to get headers
        })
        if (records.length > 0) {
          fields = Object.keys(records[0])
        }
      } else {
        // Excel file
        const workbook = XLSX.read(buffer, { type: 'buffer' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const data = XLSX.utils.sheet_to_json(firstSheet, { defval: null })
        if (data.length > 0) {
          fields = Object.keys(data[0])
        }
      }
    } catch (parseError) {
      console.error('Error parsing file for fields:', parseError)
      return NextResponse.json(
        { error: 'Failed to parse file' },
        { status: 500 }
      )
    }

    return NextResponse.json({ fields }, { status: 200 })
  } catch (error) {
    console.error('Error getting file fields:', error)
    return NextResponse.json(
      { error: 'Failed to get file fields' },
      { status: 500 }
    )
  }
}

