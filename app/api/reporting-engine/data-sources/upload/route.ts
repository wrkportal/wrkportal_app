import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!session.user.tenantId) {
      return NextResponse.json(
        { error: 'User tenant not found', message: 'User must be associated with a tenant' },
        { status: 400 }
      )
    }

    console.log('File upload request received')

    const formData = await request.formData()
    const file = formData.get('file') as File
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const functionalArea = formData.get('functionalArea') as string

    console.log('Form data:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      name,
      functionalArea,
    })

    if (!file) {
      console.error('No file in form data')
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    if (!['xlsx', 'xls', 'csv'].includes(fileExtension || '')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only Excel (.xlsx, .xls) and CSV files are supported' },
        { status: 400 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'uploads', 'reporting-engine')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const filePath = join(uploadsDir, fileName)
    await writeFile(filePath, buffer)

    // Parse file to get schema
    let schema: any = { fields: [], rowCount: 0 }
    let sampleData: any[] = []

    try {
      if (fileExtension === 'csv') {
        // Parse CSV
        const csvText = buffer.toString('utf-8')
        const lines = csvText.split('\n').filter(line => line.trim())
        if (lines.length > 0) {
          const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
          schema.fields = headers.map((header, index) => ({
            name: header,
            type: 'string', // Default to string, could be enhanced with type detection
            nullable: true,
            isRelation: false,
            index,
          }))

          // Parse sample rows (first 10 rows)
          for (let i = 1; i < Math.min(11, lines.length); i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''))
            const row: any = {}
            headers.forEach((header, idx) => {
              row[header] = values[idx] || null
            })
            sampleData.push(row)
          }
          schema.rowCount = lines.length - 1
        }
      } else {
        // Parse Excel
        const workbook = XLSX.read(buffer, { type: 'buffer' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const data = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: null })

        if (data.length > 0) {
          const headers = Object.keys(data[0] as any)
          schema.fields = headers.map((header, index) => ({
            name: header,
            type: 'string', // Default to string
            nullable: true,
            isRelation: false,
            index,
          }))

          // Get sample data (first 10 rows)
          sampleData = data.slice(0, 10) as any[]
          schema.rowCount = data.length
        }
      }
    } catch (error: any) {
      console.error('Error parsing file:', error)
      return NextResponse.json(
        { error: 'Failed to parse file', details: error.message },
        { status: 400 }
      )
    }

    if (schema.fields.length === 0) {
      return NextResponse.json(
        { error: 'File appears to be empty or has no valid data' },
        { status: 400 }
      )
    }

    // Create data source
    let dataSource
    try {
      dataSource = await prisma.dataSource.create({
        data: {
          name: name || file.name.replace(/\.[^/.]+$/, ''), // Remove extension
          description: description || `Uploaded file: ${file.name}`,
          type: 'FILE',
          connection: {
            filePath,
            fileName,
            originalFileName: file.name,
            fileExtension,
            fileSize: file.size,
          },
          schema: {
            ...schema,
            sampleData: sampleData.slice(0, 5), // Store first 5 rows as sample
          },
          functionalArea: functionalArea || null,
          tenantId: session.user.tenantId!,
          syncFrequency: 'REAL_TIME', // File data is static until re-uploaded
        },
      })
      console.log('Data source created:', dataSource.id)
    } catch (error: any) {
      console.error('Error creating data source:', error)
      console.error('Error details:', {
        code: error.code,
        meta: error.meta,
        message: error.message,
      })
      throw new Error(`Failed to create data source: ${error.message || 'Unknown error'}`)
    }

    // Grant creator access
    try {
      await prisma.dataSourceAccess.create({
        data: {
          dataSourceId: dataSource.id,
          userId: session.user.id,
          permission: 'WRITE',
        },
      })
      console.log('Data source access created')
    } catch (error: any) {
      console.error('Error creating data source access:', error)
      // Don't fail the whole operation if access creation fails
      console.warn('Continuing despite access creation error')
    }

    // Create a default query for this data source
    let query
    try {
      query = await prisma.query.create({
        data: {
          name: `Query: ${dataSource.name}`,
          description: `Auto-generated query for ${dataSource.name}`,
          dataSourceId: dataSource.id,
          queryBuilder: {
            select: schema.fields.map((f: any) => f.name),
            from: dataSource.id, // Reference to data source
          },
          createdById: session.user.id,
        },
      })
      console.log('Query created:', query.id)
    } catch (error: any) {
      console.error('Error creating query:', error)
      // Don't fail the whole operation if query creation fails
      console.warn('Continuing despite query creation error')
    }

    return NextResponse.json({
      dataSource: {
        ...dataSource,
        queryId: query?.id, // Return query ID for immediate use
      },
      schema,
      sampleData: sampleData.slice(0, 5),
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error uploading file:', error)
    console.error('Error stack:', error.stack)
    console.error('Error name:', error.name)
    console.error('Error code:', error.code)
    
    // Return detailed error information
    const errorMessage = error.message || 'Unknown error occurred'
    const errorDetails = {
      error: 'Failed to upload file',
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? {
        name: error.name,
        code: error.code,
        stack: error.stack,
      } : undefined,
    }
    
    return NextResponse.json(
      errorDetails,
      { status: 500 }
    )
  }
}
