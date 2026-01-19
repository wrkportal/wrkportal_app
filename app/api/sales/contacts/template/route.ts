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
        'First Name': 'John',
        'Last Name': 'Doe',
        'Email': 'john.doe@example.com',
        'Phone': '+1-555-0100',
        'Mobile': '+1-555-0101',
        'Title': 'VP of Sales',
        'Department': 'Sales',
        'Account Name': 'Acme Corporation',
        'Lead Source': 'WEB_FORM',
        'Description': 'Key decision maker',
        'Status': 'ACTIVE',
      },
      {
        'First Name': 'Jane',
        'Last Name': 'Smith',
        'Email': 'jane.smith@example.com',
        'Phone': '+1-555-0200',
        'Mobile': '',
        'Title': 'Marketing Director',
        'Department': 'Marketing',
        'Account Name': 'Tech Solutions Inc',
        'Lead Source': 'LINKEDIN',
        'Description': '',
        'Status': 'ACTIVE',
      },
    ]

    const worksheet = XLSX.utils.json_to_sheet(templateData)
    worksheet['!cols'] = [
      { wch: 15 }, // First Name
      { wch: 15 }, // Last Name
      { wch: 30 }, // Email
      { wch: 18 }, // Phone
      { wch: 18 }, // Mobile
      { wch: 20 }, // Title
      { wch: 15 }, // Department
      { wch: 25 }, // Account Name
      { wch: 15 }, // Lead Source
      { wch: 40 }, // Description
      { wch: 12 }, // Status
    ]

    const instructionsData = [
      ['Contact Upload Template - Instructions'],
      [''],
      ['REQUIRED COLUMNS (must be filled):'],
      ['  • First Name - Contact\'s first name'],
      ['  • Last Name - Contact\'s last name'],
      [''],
      ['OPTIONAL COLUMNS:'],
      ['  • Email - Email address'],
      ['  • Phone - Phone number'],
      ['  • Mobile - Mobile phone number'],
      ['  • Title - Job title'],
      ['  • Department - Department name'],
      ['  • Account Name - Associated account name (will be looked up)'],
      ['  • Lead Source - Where the contact came from'],
      ['    Valid values: WEB_FORM, EMAIL, PHONE, ADVERTISING, EVENT, REFERRAL, PARTNER, SOCIAL_MEDIA, LINKEDIN, OTHER'],
      ['  • Description - Additional notes'],
      ['  • Status - Contact status'],
      ['    Valid values: ACTIVE, INACTIVE, ARCHIVED'],
      [''],
      ['NOTES:'],
      ['  • Remove example rows before uploading'],
      ['  • Account Name will be matched to existing accounts (case-insensitive)'],
      ['  • Custom columns will be stored in customFields'],
    ]

    const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData)
    instructionsSheet['!cols'] = [{ wch: 80 }]

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Contacts Template')
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions')

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    const filename = `contact-upload-template.xlsx`

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

