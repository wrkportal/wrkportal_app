import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workbook = XLSX.utils.book_new()

    const templateData = [
      {
        'Name': 'Enterprise Plan',
        'Code': 'ENT-PLAN-001',
        'Description': 'Full-featured enterprise solution',
        'Family': 'Software',
        'Category': 'Subscription',
        'Unit Price': '999.99',
        'Cost': '200.00',
        'Is Active': 'TRUE',
      },
      {
        'Name': 'Professional Plan',
        'Code': 'PRO-PLAN-001',
        'Description': 'Professional tier subscription',
        'Family': 'Software',
        'Category': 'Subscription',
        'Unit Price': '499.99',
        'Cost': '100.00',
        'Is Active': 'TRUE',
      },
    ]

    const worksheet = XLSX.utils.json_to_sheet(templateData)
    worksheet['!cols'] = [
      { wch: 25 }, // Name
      { wch: 20 }, // Code
      { wch: 40 }, // Description
      { wch: 15 }, // Family
      { wch: 15 }, // Category
      { wch: 15 }, // Unit Price
      { wch: 15 }, // Cost
      { wch: 12 }, // Is Active
    ]

    const instructionsData = [
      ['Product Upload Template - Instructions'],
      [''],
      ['REQUIRED COLUMNS (must be filled):'],
      ['  • Name - Product name'],
      [''],
      ['OPTIONAL COLUMNS:'],
      ['  • Code - Product code (must be unique, auto-generated if not provided)'],
      ['  • Description - Product description'],
      ['  • Family - Product family/line'],
      ['  • Category - Product category'],
      ['  • Unit Price - Selling price (numeric)'],
      ['  • Cost - Product cost (numeric)'],
      ['  • Is Active - Whether product is active (TRUE/FALSE)'],
      [''],
      ['NOTES:'],
      ['  • Remove example rows before uploading'],
      ['  • Product codes must be unique within your organization'],
      ['  • If code is not provided, one will be auto-generated'],
      ['  • Default unit price is 0 if not provided'],
      ['  • Products are active by default'],
      ['  • Custom columns will be stored in customFields'],
    ]

    const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData)
    instructionsSheet['!cols'] = [{ wch: 80 }]

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products Template')
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions')

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    const filename = `product-upload-template.xlsx`

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

