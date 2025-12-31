import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { readFile } from 'fs/promises'
import * as XLSX from 'xlsx'
import { parse } from 'csv-parse/sync'

const MAX_PREVIEW_ROWS = 100
const MAX_ALLOWED_ROWS = 100000 // Maximum rows we'll allow to prevent memory issues
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

    // Get limit from query parameters, default to MAX_PREVIEW_ROWS
    const { searchParams } = new URL(request.url)
    const requestedLimitParam = searchParams.get('limit')
    
    // If limit is provided, use it (up to MAX_ALLOWED_ROWS), otherwise default to MAX_PREVIEW_ROWS
    let requestedLimit = MAX_PREVIEW_ROWS
    if (requestedLimitParam) {
      const parsed = parseInt(requestedLimitParam, 10)
      if (!isNaN(parsed) && parsed > 0) {
        requestedLimit = parsed
      }
    }
    const limit = Math.min(requestedLimit, MAX_ALLOWED_ROWS) // Cap at MAX_ALLOWED_ROWS
    
    console.log(`📊 Preview API: fileId=${params.id}, fileName=${file.originalName}, requestedLimitParam=${requestedLimitParam}, parsedLimit=${requestedLimit}, finalLimit=${limit}, fileRowCount=${file.rowCount || 'N/A'}`)

    // Read and parse the file
    const buffer = await fetchFileContent(file.filePath)
    const fileExt = file.originalName.substring(file.originalName.lastIndexOf('.')).toLowerCase()

    let columns: string[] = []
    let rows: any[][] = []

    if (fileExt === '.csv') {
      const content = buffer.toString('utf-8')
      // For CSV, parse all rows if limit is large (for calculations), otherwise use the limit
      // If limit is >= 1000, parse all rows (don't use 'to' option to avoid parsing issues)
      const parseOptions: any = { 
        columns: true, 
        skip_empty_lines: true,
      }
      
      // Only limit parsing if limit is small (for preview)
      // For large limits (calculations), parse all rows and then slice
      if (limit < 1000) {
        parseOptions.to = limit + 1 // +1 for header
      }
      
      const records = parse(content, parseOptions)

      if (records.length > 0) {
        columns = Object.keys(records[0])
        // Slice to the requested limit
        rows = records.slice(0, limit).map((record: any) => 
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
        
        // For Excel, slice from row 1 (skip header) to the requested limit
        // data[0] is the header, so we start from index 1
        // We want to take 'limit' number of data rows (excluding header)
        const startIndex = 1 // Skip header row
        const endIndex = Math.min(data.length, startIndex + limit) // Take up to 'limit' rows
        
        console.log(`📊 Excel parsing: totalRows=${data.length}, headerRow=1, startIndex=${startIndex}, endIndex=${endIndex}, limit=${limit}`)
        
        rows = data.slice(startIndex, endIndex).map((row: any) => {
          const rowArray = Array.isArray(row) ? row : []
          return columns.map((_, idx) => rowArray[idx] !== undefined ? rowArray[idx] : null)
        })
        
        console.log(`✅ Excel parsed: ${rows.length} data rows (requested: ${limit})`)
        
        // Warn if we got fewer rows than requested and file has more rows
        if (rows.length < limit && file.rowCount && file.rowCount > rows.length) {
          console.warn(`⚠️ WARNING: Requested ${limit} rows but only got ${rows.length} rows. File has ${file.rowCount} total rows. This might be due to empty rows being skipped by XLSX parser.`)
        }
      }
    }
    
    console.log(`✅ Preview API: Returning ${rows.length} rows (requested: ${limit}, fileRowCount: ${file.rowCount || 'N/A'})`)

    return NextResponse.json({ columns, rows, rowCount: file.rowCount || rows.length }, { status: 200 })
  } catch (error) {
    console.error('Error previewing file:', error)
    return NextResponse.json(
      { error: 'Failed to preview file' },
      { status: 500 }
    )
  }
}

