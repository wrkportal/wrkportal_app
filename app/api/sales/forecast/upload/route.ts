import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

interface ExcelForecastRow {
  'Client Name'?: string
  'Account Name'?: string
  'Client'?: string
  'Account'?: string
  'Period'?: string
  'Unit Price'?: number
  'Volume'?: number
  'Revenue'?: number
  'Forecasted Amount'?: number
  'Forecast Type'?: string
  'Type'?: string
}

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
    if (!['.xlsx', '.xls'].includes(fileExt)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only Excel files (.xlsx, .xls) are allowed.' },
        { status: 400 }
      )
    }

    // Read file content
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Parse Excel file
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<ExcelForecastRow>(firstSheet)

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'File is empty or has no data' },
        { status: 400 }
      )
    }

    // Get all accounts to map by name
    const accounts = await prisma.salesAccount.findMany({
      where: {
        tenantId: session.user.tenantId!,
      },
      select: {
        id: true,
        name: true,
      },
    })

    const accountMap = new Map(accounts.map((acc: any) => [acc.name.toLowerCase(), acc.id]))

    const results = {
      success: [] as any[],
      errors: [] as any[],
    }

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      try {
        // Extract account name from various possible column names
        const accountName =
          row['Client Name'] ||
          row['Account Name'] ||
          row['Client'] ||
          row['Account'] ||
          ''

        if (!accountName) {
          results.errors.push({
            row: i + 2, // +2 because Excel rows start at 1 and we skip header
            error: 'Account/Client name is required',
            data: row,
          })
          continue
        }

        // Find account by name (case-insensitive)
        const accountId = accountMap.get(accountName.toString().toLowerCase())
        if (!accountId) {
          results.errors.push({
            row: i + 2,
            error: `Account "${accountName}" not found. Please create the account first.`,
            data: row,
          })
          continue
        }
        const accountIdValue = accountId as string

        // Extract period
        const period = row['Period']?.toString() || ''
        if (!period) {
          results.errors.push({
            row: i + 2,
            error: 'Period is required (format: YYYY-MM)',
            data: row,
          })
          continue
        }

        // Validate period format (YYYY-MM)
        if (!/^\d{4}-\d{2}$/.test(period)) {
          results.errors.push({
            row: i + 2,
            error: 'Invalid period format. Use YYYY-MM (e.g., 2024-01)',
            data: row,
          })
          continue
        }

        // Extract forecast data
        const unitPrice = row['Unit Price'] ? parseFloat(row['Unit Price'].toString()) : null
        const volume = row['Volume'] ? parseFloat(row['Volume'].toString()) : null
        const revenueFromRow =
          row['Revenue'] || row['Forecasted Amount']
            ? parseFloat((row['Revenue'] || row['Forecasted Amount'])!.toString())
            : null

        // Calculate revenue
        let revenue = 0
        if (unitPrice && volume) {
          revenue = unitPrice * volume
        } else if (revenueFromRow) {
          revenue = revenueFromRow
        } else {
          results.errors.push({
            row: i + 2,
            error: 'Either (Unit Price and Volume) or Revenue/Forecasted Amount is required',
            data: row,
          })
          continue
        }

        // Extract forecast type
        const forecastType =
          (row['Forecast Type'] || row['Type'])?.toString().toUpperCase() || 'MONTHLY'
        const validTypes = ['MONTHLY', 'QUARTERLY', 'YEARLY']
        const finalForecastType = (validTypes.includes(forecastType) ? forecastType : 'MONTHLY') as any

        // Create or update forecast
        const forecast = await prisma.salesForecast.upsert({
          where: {
            tenantId_accountId_period: {
              tenantId: session.user.tenantId!,
              accountId: accountIdValue,
              period,
            },
          },
          update: {
            forecastType: finalForecastType,
            unitPrice,
            volume,
            forecastedAmount: revenue,
            revenue,
            quota: revenue,
          },
          create: {
            tenantId: session.user.tenantId!,
            accountId: accountIdValue,
            userId: session.user.id,
            period,
            forecastType: finalForecastType,
            unitPrice,
            volume,
            forecastedAmount: revenue,
            revenue,
            quota: revenue,
            actualAmount: 0,
            pipelineAmount: 0,
            closedWonAmount: 0,
            closedLostAmount: 0,
            attainment: 0,
          },
          include: {
            account: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        })

        results.success.push({
          row: i + 2,
          forecast: {
            id: forecast.id,
            accountName: forecast.account.name,
            period: forecast.period,
            revenue: forecast.revenue,
          },
        })
      } catch (error: any) {
        results.errors.push({
          row: i + 2,
          error: error.message || 'Failed to process row',
          data: row,
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${results.success.length} forecast(s)`,
      results,
    })
  } catch (error: any) {
    console.error('Error uploading forecast file:', error)
    return NextResponse.json(
      { error: 'Failed to upload forecast file', details: error.message },
      { status: 500 }
    )
  }
}

