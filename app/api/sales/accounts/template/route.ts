import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import * as XLSX from 'xlsx'

/**
 * Download Account Upload Template
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workbook = XLSX.utils.book_new()

    const templateData = [
      {
        'Name': 'Acme Corporation',
        'Type': 'CUSTOMER',
        'Industry': 'Technology',
        'Website': 'https://acme.com',
        'Phone': '+1-555-0100',
        'Email': 'contact@acme.com',
        'Annual Revenue': '5000000',
        'Number of Employees': '250',
        'Description': 'Leading technology solutions provider',
        'Status': 'ACTIVE',
        'Rating': 'HOT',
      },
      {
        'Name': 'Tech Partners LLC',
        'Type': 'PARTNER',
        'Industry': 'Software',
        'Website': 'https://techpartners.com',
        'Phone': '+1-555-0200',
        'Email': 'info@techpartners.com',
        'Annual Revenue': '2000000',
        'Number of Employees': '100',
        'Description': 'Strategic technology partner',
        'Status': 'ACTIVE',
        'Rating': 'WARM',
      },
    ]

    const worksheet = XLSX.utils.json_to_sheet(templateData)
    worksheet['!cols'] = [
      { wch: 25 }, // Name
      { wch: 15 }, // Type
      { wch: 20 }, // Industry
      { wch: 30 }, // Website
      { wch: 18 }, // Phone
      { wch: 30 }, // Email
      { wch: 18 }, // Annual Revenue
      { wch: 20 }, // Number of Employees
      { wch: 40 }, // Description
      { wch: 12 }, // Status
      { wch: 10 }, // Rating
    ]

    const instructionsData = [
      ['Account Upload Template - Instructions'],
      [''],
      ['REQUIRED COLUMNS (must be filled):'],
      ['  • Name - Account/company name'],
      [''],
      ['OPTIONAL COLUMNS:'],
      ['  • Type - Account type'],
      ['    Valid values: CUSTOMER, PARTNER, COMPETITOR, RESELLER, PROSPECT'],
      ['  • Industry - Industry sector'],
      ['  • Website - Company website URL'],
      ['  • Phone - Phone number'],
      ['  • Email - Email address'],
      ['  • Annual Revenue - Annual revenue (numeric)'],
      ['  • Number of Employees - Employee count (numeric)'],
      ['  • Description - Additional notes'],
      ['  • Status - Account status'],
      ['    Valid values: ACTIVE, INACTIVE, ARCHIVED'],
      ['  • Rating - Account rating'],
      ['    Valid values: HOT, WARM, COLD'],
      [''],
      ['NOTES:'],
      ['  • Remove example rows before uploading'],
      ['  • Column headers are case-insensitive'],
      ['  • Custom columns will be stored in customFields'],
    ]

    const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData)
    instructionsSheet['!cols'] = [{ wch: 80 }]

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Accounts Template')
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions')

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    const filename = `account-upload-template.xlsx`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    console.error('Error generating template:', error)
    return NextResponse.json(
      { error: 'Failed to generate template', details: error.message },
      { status: 500 }
    )
  }
}

