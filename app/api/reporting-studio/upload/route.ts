import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import * as XLSX from 'xlsx'
import { parse } from 'csv-parse/sync'

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'reporting-studio')

// Ensure upload directory exists
async function ensureUploadDir() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true })
  } catch (error) {
    // Directory might already exist
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await ensureUploadDir()

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['.csv', '.xlsx', '.xls']
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
    
    if (!allowedTypes.includes(fileExt)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only CSV and Excel files are allowed.' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const uniqueName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const filePath = join(UPLOAD_DIR, uniqueName)

    // Read file content
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Save file
    await writeFile(filePath, buffer)

    // Parse file to get metadata
    let rowCount = 0
    let columnCount = 0

    try {
      if (fileExt === '.csv') {
        const content = buffer.toString('utf-8')
        const records = parse(content, { columns: true, skip_empty_lines: true })
        rowCount = records.length
        columnCount = Object.keys(records[0] || {}).length
      } else {
        // Excel file
        const workbook = XLSX.read(buffer, { type: 'buffer' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const data = XLSX.utils.sheet_to_json(firstSheet)
        rowCount = data.length
        columnCount = Object.keys(data[0] || {}).length
      }
    } catch (parseError) {
      console.error('Error parsing file:', parseError)
    }

    // Get tenant ID
    const tenantId = (session.user as any).tenantId

    // Save file metadata to database
    const uploadedFile = await prisma.reportingFile.create({
      data: {
        name: uniqueName,
        originalName: file.name,
        filePath: filePath,
        size: file.size,
        type: file.type,
        rowCount: rowCount || null,
        columnCount: columnCount || null,
        uploadedBy: session.user.id,
        tenantId: tenantId,
      },
    })

    return NextResponse.json(
      { message: 'File uploaded successfully', file: uploadedFile },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

