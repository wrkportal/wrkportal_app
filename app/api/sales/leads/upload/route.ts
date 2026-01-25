import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { LeadSource, LeadStatus } from '@prisma/client'
import * as XLSX from 'xlsx'
import { parse } from 'csv-parse/sync'
import { SalesAutomationEngine } from '@/lib/sales/automation-engine'

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
      // Excel file
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

    // If no mapping provided, return error (mapping is required)
    if (!mappingJson || Object.keys(columnMapping).length === 0) {
      return NextResponse.json(
        { error: 'Column mapping is required. Please map columns before uploading.' },
        { status: 400 }
      )
    }

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      
      // Map row data using the column mapping
      const mappedData: Record<string, any> = {}
      const customFields: Record<string, any> = {}
      
      for (const [fileColumn, dbField] of Object.entries(columnMapping)) {
        const value = row[fileColumn]
        
        if (dbField === 'skip') {
          // Skip this column
          continue
        } else if (dbField === 'custom') {
          // Store as custom field
          if (value !== null && value !== undefined && String(value).trim() !== '') {
            customFields[fileColumn] = String(value).trim()
          }
        } else if (dbField && dbField !== '') {
          // Map to standard database field
          mappedData[dbField] = value
        }
      }

      try {
        // Validate required fields
        const firstName = String(mappedData.firstName || '').trim()
        const lastName = String(mappedData.lastName || '').trim()
        const email = String(mappedData.email || '').trim().toLowerCase()

        if (!firstName || !lastName || !email) {
          results.failed.push({
            row: i + 2, // +2 because Excel rows start at 1 and we skip header
            data: row,
            error: 'Missing required fields: firstName, lastName, or email',
          })
          continue
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
          results.failed.push({
            row: i + 2,
            data: row,
            error: `Invalid email format: ${email}`,
          })
          continue
        }

        // Check for duplicate email
        const existingLead = await prisma.salesLead.findUnique({
          where: {
            tenantId_email: {
              tenantId,
              email,
            },
          },
        })

        if (existingLead) {
          results.duplicates.push({
            row: i + 2,
            data: row,
          })
          continue
        }

        // Map lead source
        const leadSourceMap: Record<string, LeadSource> = {
          'web form': LeadSource.WEB_FORM,
          'webform': LeadSource.WEB_FORM,
          'website': LeadSource.WEB_FORM,
          'email': LeadSource.EMAIL,
          'phone': LeadSource.PHONE,
          'advertising': LeadSource.ADVERTISING,
          'event': LeadSource.EVENT,
          'referral': LeadSource.REFERRAL,
          'partner': LeadSource.PARTNER,
          'social media': LeadSource.SOCIAL_MEDIA,
          'socialmedia': LeadSource.SOCIAL_MEDIA,
          'linkedin': LeadSource.LINKEDIN,
          'other': LeadSource.OTHER,
        }
        
        const sourceValue = String(mappedData.leadSource || 'other').trim().toLowerCase()
        const leadSource = leadSourceMap[sourceValue] || LeadSource.OTHER

        // Map status
        const statusMap: Record<string, LeadStatus> = {
          'new': LeadStatus.NEW,
          'contacted': LeadStatus.CONTACTED,
          'qualified': LeadStatus.QUALIFIED,
          'converted': LeadStatus.CONVERTED,
          'unqualified': LeadStatus.UNQUALIFIED,
          'nurturing': LeadStatus.NURTURING,
        }
        const statusValue = String(mappedData.status || 'new').trim().toUpperCase()
        const status = statusMap[statusValue.toLowerCase()] || LeadStatus.NEW

        // Map rating
        const ratingMap: Record<string, string> = {
          'hot': 'HOT',
          'warm': 'WARM',
          'cold': 'COLD',
        }
        const ratingValue = String(mappedData.rating || '').trim().toUpperCase()
        const rating = ratingMap[ratingValue.toLowerCase()] || null

        // Calculate initial lead score
        let score = 0
        if (mappedData.company) score += 10
        if (mappedData.phone || mappedData.mobile) score += 5
        if (mappedData.title) score += 5
        if (mappedData.industry) score += 5

        const finalRating = rating || (score >= 20 ? 'HOT' : score >= 10 ? 'WARM' : 'COLD')

        // Create lead
        const lead = await prisma.salesLead.create({
          data: {
            tenantId,
            firstName,
            lastName,
            email,
            company: mappedData.company ? String(mappedData.company).trim() : null,
            phone: mappedData.phone ? String(mappedData.phone).trim() : null,
            mobile: mappedData.mobile ? String(mappedData.mobile).trim() : null,
            title: mappedData.title ? String(mappedData.title).trim() : null,
            industry: mappedData.industry ? String(mappedData.industry).trim() : null,
            leadSource,
            description: mappedData.description ? String(mappedData.description).trim() : null,
            assignedToId: ownerId, // Default to current user
            ownerId,
            score,
            status,
            rating: finalRating as 'HOT' | 'WARM' | 'COLD',
            ...(Object.keys(customFields).length > 0 && { customFields }),
          },
        })

        // Trigger automation
        try {
          await SalesAutomationEngine.trigger({
            tenantId,
            triggerType: 'LEAD_CREATED',
            data: { leadId: lead.id, lead },
          })
        } catch (automationError) {
          console.error('Automation trigger error:', automationError)
          // Continue even if automation fails
        }

        results.successful.push({
          id: lead.id,
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
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
    console.error('Error uploading leads:', error)
    return NextResponse.json(
      { error: 'Failed to upload leads', details: error.message },
      { status: 500 }
    )
  }
}

