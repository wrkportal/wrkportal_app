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
        const firstName = String(mappedData.firstName || '').trim()
        const lastName = String(mappedData.lastName || '').trim()

        if (!firstName || !lastName) {
          results.failed.push({
            row: i + 2,
            data: row,
            error: 'Missing required fields: firstName or lastName',
          })
          continue
        }

        // Map lead source
        const leadSourceMap: Record<string, string> = {
          'web form': 'WEB_FORM',
          'webform': 'WEB_FORM',
          'website': 'WEB_FORM',
          'email': 'EMAIL',
          'phone': 'PHONE',
          'advertising': 'ADVERTISING',
          'event': 'EVENT',
          'referral': 'REFERRAL',
          'partner': 'PARTNER',
          'social media': 'SOCIAL_MEDIA',
          'socialmedia': 'SOCIAL_MEDIA',
          'linkedin': 'LINKEDIN',
          'other': 'OTHER',
        }
        const sourceValue = String(mappedData.leadSource || '').trim().toLowerCase()
        const leadSource = leadSourceMap[sourceValue] || null

        // Map status
        const statusMap: Record<string, string> = {
          'active': 'ACTIVE',
          'inactive': 'INACTIVE',
          'archived': 'ARCHIVED',
        }
        const statusValue = String(mappedData.status || 'active').trim().toUpperCase()
        const status = statusMap[statusValue.toLowerCase()] || 'ACTIVE'

        // Parse mailing address if provided
        let mailingAddress = null
        if (mappedData.mailingAddress) {
          try {
            mailingAddress = typeof mappedData.mailingAddress === 'string' 
              ? JSON.parse(mappedData.mailingAddress) 
              : mappedData.mailingAddress
          } catch {
            mailingAddress = { address: String(mappedData.mailingAddress) }
          }
        }

        // Look up account by name if accountId not provided
        let accountId = mappedData.accountId || null
        if (!accountId && mappedData.accountName) {
          const account = await prisma.salesAccount.findFirst({
            where: {
              tenantId,
              name: { equals: String(mappedData.accountName).trim(), mode: 'insensitive' },
            },
          })
          if (account) accountId = account.id
        }

        const contact = await prisma.salesContact.create({
          data: {
            tenantId,
            accountId,
            firstName,
            lastName,
            email: mappedData.email ? String(mappedData.email).trim().toLowerCase() : null,
            phone: mappedData.phone ? String(mappedData.phone).trim() : null,
            mobile: mappedData.mobile ? String(mappedData.mobile).trim() : null,
            title: mappedData.title ? String(mappedData.title).trim() : null,
            department: mappedData.department ? String(mappedData.department).trim() : null,
            mailingAddress,
            description: mappedData.description ? String(mappedData.description).trim() : null,
            ownerId: mappedData.ownerId || ownerId,
            reportsToId: mappedData.reportsToId || null,
            status: status as any,
            leadSource: leadSource as any,
            ...(Object.keys(customFields).length > 0 && { customFields }),
          },
        })

        try {
          await AutoActivityCapture.capture({
            tenantId,
            userId: ownerId,
            type: 'CONTACT_CREATED',
            data: {
              contactId: contact.id,
              contact,
            },
          })
        } catch (automationError) {
          console.error('Automation trigger error:', automationError)
        }

        results.successful.push({
          id: contact.id,
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
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
    console.error('Error uploading contacts:', error)
    return NextResponse.json(
      { error: 'Failed to upload contacts', details: error.message },
      { status: 500 }
    )
  }
}

