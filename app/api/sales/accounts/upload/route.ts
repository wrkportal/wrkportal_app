import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'
import { parse } from 'csv-parse/sync'
import { AutoActivityCapture } from '@/lib/sales/auto-activity-capture'

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

    // Parse column mapping configuration
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

    // Parse file
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
    const ownerId = session.user.id
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

    // Process each row
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
        // Validate required field
        const name = String(mappedData.name || '').trim()

        if (!name) {
          results.failed.push({
            row: i + 2,
            data: row,
            error: 'Missing required field: name',
          })
          continue
        }

        // Map type
        const typeMap: Record<string, string> = {
          'customer': 'CUSTOMER',
          'partner': 'PARTNER',
          'competitor': 'COMPETITOR',
          'reseller': 'RESELLER',
          'prospect': 'PROSPECT',
        }
        const typeValue = String(mappedData.type || 'customer').trim().toLowerCase()
        const type = typeMap[typeValue] || 'CUSTOMER'

        // Map status
        const statusMap: Record<string, string> = {
          'active': 'ACTIVE',
          'inactive': 'INACTIVE',
          'archived': 'ARCHIVED',
        }
        const statusValue = String(mappedData.status || 'active').trim().toUpperCase()
        const status = statusMap[statusValue.toLowerCase()] || 'ACTIVE'

        // Map rating
        const ratingMap: Record<string, string> = {
          'hot': 'HOT',
          'warm': 'WARM',
          'cold': 'COLD',
        }
        const ratingValue = String(mappedData.rating || '').trim().toUpperCase()
        const rating = ratingMap[ratingValue.toLowerCase()] || null

        // Parse addresses if provided
        let billingAddress = null
        let shippingAddress = null
        if (mappedData.billingAddress) {
          try {
            billingAddress = typeof mappedData.billingAddress === 'string' 
              ? JSON.parse(mappedData.billingAddress) 
              : mappedData.billingAddress
          } catch {
            billingAddress = { address: String(mappedData.billingAddress) }
          }
        }
        if (mappedData.shippingAddress) {
          try {
            shippingAddress = typeof mappedData.shippingAddress === 'string' 
              ? JSON.parse(mappedData.shippingAddress) 
              : mappedData.shippingAddress
          } catch {
            shippingAddress = { address: String(mappedData.shippingAddress) }
          }
        }

        // Create account
        const account = await prisma.salesAccount.create({
          data: {
            tenantId,
            name,
            type: type as any,
            industry: mappedData.industry ? String(mappedData.industry).trim() : null,
            website: mappedData.website ? String(mappedData.website).trim() : null,
            phone: mappedData.phone ? String(mappedData.phone).trim() : null,
            email: mappedData.email ? String(mappedData.email).trim().toLowerCase() : null,
            billingAddress,
            shippingAddress,
            annualRevenue: mappedData.annualRevenue ? parseFloat(String(mappedData.annualRevenue)) : null,
            numberOfEmployees: mappedData.numberOfEmployees ? parseInt(String(mappedData.numberOfEmployees)) : null,
            description: mappedData.description ? String(mappedData.description).trim() : null,
            ownerId: mappedData.ownerId || ownerId,
            parentAccountId: mappedData.parentAccountId || null,
            status: status as any,
            rating: rating as any,
            ...(Object.keys(customFields).length > 0 && { customFields }),
          },
        })

        // Automatically capture activity
        try {
          await AutoActivityCapture.capture({
            tenantId,
            userId: ownerId,
            type: 'ACCOUNT_CREATED',
            data: {
              accountId: account.id,
              account,
            },
          })
        } catch (automationError) {
          console.error('Automation trigger error:', automationError)
        }

        results.successful.push({
          id: account.id,
          name: account.name,
          email: account.email,
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
    console.error('Error uploading accounts:', error)
    return NextResponse.json(
      { error: 'Failed to upload accounts', details: error.message },
      { status: 500 }
    )
  }
}

