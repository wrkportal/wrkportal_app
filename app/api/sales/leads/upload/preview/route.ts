import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import * as XLSX from 'xlsx'
import { parse } from 'csv-parse/sync'

/**
 * Preview uploaded file and return column names
 * This allows users to map columns before importing
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
    if (!['.csv', '.xlsx', '.xls'].includes(fileExt)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only CSV and Excel files (.csv, .xlsx, .xls) are allowed.' },
        { status: 400 }
      )
    }

    // Read file content
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Parse file to get headers
    let headers: string[] = []
    if (fileExt === '.csv') {
      const content = buffer.toString('utf-8')
      const rows = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      })
      if (rows.length > 0) {
        headers = Object.keys(rows[0])
      }
    } else {
      // Excel file
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })
      if (data.length > 0) {
        headers = (data[0] as string[]).filter(h => h !== null && h !== undefined && String(h).trim() !== '')
      }
    }

    if (headers.length === 0) {
      return NextResponse.json(
        { error: 'File is empty or has no headers' },
        { status: 400 }
      )
    }

    // Get sample data (first 3 rows) to help with mapping
    let sampleRows: Record<string, any>[] = []
    if (fileExt === '.csv') {
      const content = buffer.toString('utf-8')
      const rows = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      })
      sampleRows = rows.slice(0, 3)
    } else {
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      const data = XLSX.utils.sheet_to_json(firstSheet)
      sampleRows = (data as any[]).slice(0, 3)
    }

    return NextResponse.json({
      success: true,
      columns: headers,
      sampleRows,
      totalRows: sampleRows.length > 0 ? 'multiple' : 0,
    })
  } catch (error: any) {
    console.error('Error previewing file:', error)
    return NextResponse.json(
      { error: 'Failed to preview file', details: error.message },
      { status: 500 }
    )
  }
}

