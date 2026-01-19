import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'
import { parse } from 'csv-parse/sync'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const mappingJson = formData.get('mapping') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    let columnMapping: Record<string, string> = {}
    if (mappingJson) {
      try {
        columnMapping = JSON.parse(mappingJson)
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid mapping configuration' },
          { status: 400 }
        )
      }
    }

    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
    if (!['.csv', '.xlsx', '.xls'].includes(fileExt)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only CSV and Excel files (.csv, .xlsx, .xls) are allowed.' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    let rows: any[] = []
    if (fileExt === '.csv') {
      const content = buffer.toString('utf-8')
      rows = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      })
    } else {
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      rows = XLSX.utils.sheet_to_json(firstSheet)
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'File is empty or has no data' },
        { status: 400 }
      )
    }

    const tenantId = session.user.tenantId!
    const results = {
      successful: [] as any[],
      failed: [] as Array<{ row: number; data: any; error: string }>,
      duplicates: [] as Array<{ row: number; data: any }>,
    }

    if (!mappingJson || Object.keys(columnMapping).length === 0) {
      return NextResponse.json(
        { error: 'Column mapping is required. Please map columns before uploading.' },
        { status: 400 }
      )
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      
      const mappedData: Record<string, any> = {}
      const customFields: Record<string, any> = {}
      
      for (const [fileColumn, dbField] of Object.entries(columnMapping)) {
        const value = row[fileColumn]
        
        if (dbField === 'skip') {
          continue
        } else if (dbField === 'custom') {
          if (value !== null && value !== undefined && String(value).trim() !== '') {
            customFields[fileColumn] = String(value).trim()
          }
        } else if (dbField && dbField !== '') {
          mappedData[dbField] = value
        }
      }

      try {
        const name = String(mappedData.name || '').trim()
        const code = String(mappedData.code || '').trim() || `PROD-${Date.now()}-${i}`
        const unitPrice = mappedData.unitPrice ? parseFloat(String(mappedData.unitPrice)) : 0

        if (!name) {
          results.failed.push({
            row: i + 2,
            data: row,
            error: 'Missing required field: name',
          })
          continue
        }

        // Check for duplicate code
        const existingProduct = await prisma.salesProduct.findUnique({
          where: {
            tenantId_code: {
              tenantId,
              code,
            },
          },
        })

        if (existingProduct) {
          results.duplicates.push({
            row: i + 2,
            data: row,
          })
          continue
        }

        const product = await prisma.salesProduct.create({
          data: {
            tenantId,
            name,
            code,
            description: mappedData.description ? String(mappedData.description).trim() : null,
            family: mappedData.family ? String(mappedData.family).trim() : null,
            category: mappedData.category ? String(mappedData.category).trim() : null,
            unitPrice,
            cost: mappedData.cost ? parseFloat(String(mappedData.cost)) : null,
            isActive: mappedData.isActive !== undefined ? Boolean(mappedData.isActive) : true,
            ...(Object.keys(customFields).length > 0 && { customFields }),
          },
        })

        results.successful.push({
          id: product.id,
          name: product.name,
          code: product.code,
        })
      } catch (error: any) {
        results.failed.push({
          row: i + 2,
          data: row,
          error: error.message || 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: rows.length,
        successful: results.successful.length,
        failed: results.failed.length,
        duplicates: results.duplicates.length,
      },
      results,
    })
  } catch (error: any) {
    console.error('Error uploading products:', error)
    return NextResponse.json(
      { error: 'Failed to upload products', details: error.message },
      { status: 500 }
    )
  }
}

