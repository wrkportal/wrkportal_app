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
    const ownerId = session.user.id
    const results = {
      successful: [] as any[],
      failed: [] as Array<{ row: number; data: any; error: string }>,
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
        const amount = mappedData.amount ? parseFloat(String(mappedData.amount)) : 0
        const expectedCloseDate = mappedData.expectedCloseDate

        if (!name) {
          results.failed.push({
            row: i + 2,
            data: row,
            error: 'Missing required field: name',
          })
          continue
        }

        if (!expectedCloseDate) {
          results.failed.push({
            row: i + 2,
            data: row,
            error: 'Missing required field: expectedCloseDate',
          })
          continue
        }

        // Parse date
        let closeDate: Date
        try {
          closeDate = new Date(expectedCloseDate)
          if (isNaN(closeDate.getTime())) {
            throw new Error('Invalid date')
          }
        } catch {
          results.failed.push({
            row: i + 2,
            data: row,
            error: `Invalid expectedCloseDate format: ${expectedCloseDate}`,
          })
          continue
        }

        // Map stage
        const stageMap: Record<string, string> = {
          'prospecting': 'PROSPECTING',
          'qualification': 'QUALIFICATION',
          'needs_analysis': 'NEEDS_ANALYSIS',
          'needs analysis': 'NEEDS_ANALYSIS',
          'value_proposition': 'VALUE_PROPOSITION',
          'value proposition': 'VALUE_PROPOSITION',
          'id_decision_makers': 'ID_DECISION_MAKERS',
          'perception_analysis': 'PERCEPTION_ANALYSIS',
          'proposal_price_quote': 'PROPOSAL_PRICE_QUOTE',
          'negotiation_review': 'NEGOTIATION_REVIEW',
          'closed_won': 'CLOSED_WON',
          'closed_lost': 'CLOSED_LOST',
        }
        const stageValue = String(mappedData.stage || 'prospecting').trim().toLowerCase()
        const stage = stageMap[stageValue] || 'PROSPECTING'

        // Map type
        const typeMap: Record<string, string> = {
          'new_business': 'NEW_BUSINESS',
          'existing_business': 'EXISTING_BUSINESS',
          'upsell': 'UPSELL',
          'cross_sell': 'CROSS_SELL',
          'renewal': 'RENEWAL',
        }
        const typeValue = String(mappedData.type || '').trim().toLowerCase()
        const type = typeValue ? (typeMap[typeValue] || null) : null

        // Map lead source
        const leadSourceMap: Record<string, string> = {
          'web form': 'WEB_FORM',
          'email': 'EMAIL',
          'phone': 'PHONE',
          'advertising': 'ADVERTISING',
          'event': 'EVENT',
          'referral': 'REFERRAL',
          'partner': 'PARTNER',
          'social media': 'SOCIAL_MEDIA',
          'linkedin': 'LINKEDIN',
          'other': 'OTHER',
        }
        const sourceValue = String(mappedData.leadSource || '').trim().toLowerCase()
        const leadSource = sourceValue ? (leadSourceMap[sourceValue] || null) : null

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

        const probability = mappedData.probability ? parseInt(String(mappedData.probability)) : 10

        const opportunity = await prisma.salesOpportunity.create({
          data: {
            tenantId,
            accountId,
            name,
            description: mappedData.description ? String(mappedData.description).trim() : null,
            stage: stage as any,
            amount,
            probability,
            expectedCloseDate: closeDate,
            type: type as any,
            leadSource: leadSource as any,
            nextStep: mappedData.nextStep ? String(mappedData.nextStep).trim() : null,
            competitorInfo: mappedData.competitorInfo ? String(mappedData.competitorInfo).trim() : null,
            ownerId: mappedData.ownerId || ownerId,
            createdById: ownerId,
            status: 'OPEN',
            ...(Object.keys(customFields).length > 0 && { customFields }),
          },
        })

        results.successful.push({
          id: opportunity.id,
          name: opportunity.name,
          amount: opportunity.amount,
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
        duplicates: 0,
      },
      results,
    })
  } catch (error: any) {
    console.error('Error uploading opportunities:', error)
    return NextResponse.json(
      { error: 'Failed to upload opportunities', details: error.message },
      { status: 500 }
    )
  }
}

