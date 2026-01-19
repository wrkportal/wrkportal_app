import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import * as XLSX from 'xlsx'

/**
 * Download Lead Upload Template
 * Returns an Excel file with headers and example data
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create workbook
    const workbook = XLSX.utils.book_new()

    // Define template data with example row
    const templateData = [
      {
        // Required fields
        'First Name': 'John',
        'Last Name': 'Doe',
        'Email': 'john.doe@example.com',
        // Optional fields
        'Company': 'Acme Corporation',
        'Phone': '+1-555-0123',
        'Mobile': '+1-555-0124',
        'Title': 'VP of Sales',
        'Industry': 'Technology',
        'Lead Source': 'WEB_FORM',
        'Description': 'Interested in enterprise solution',
        'Status': 'NEW',
        'Rating': 'WARM',
      },
      {
        'First Name': 'Jane',
        'Last Name': 'Smith',
        'Email': 'jane.smith@example.com',
        'Company': 'Tech Solutions Inc',
        'Phone': '+1-555-0234',
        'Mobile': '',
        'Title': 'Marketing Director',
        'Industry': 'Software',
        'Lead Source': 'LINKEDIN',
        'Description': 'Looking for marketing automation tools',
        'Status': 'CONTACTED',
        'Rating': 'HOT',
      },
      {
        'First Name': 'Mike',
        'Last Name': 'Johnson',
        'Email': 'mike.j@example.com',
        'Company': 'StartupXYZ',
        'Phone': '',
        'Mobile': '+1-555-0345',
        'Title': 'CEO',
        'Industry': 'SaaS',
        'Lead Source': 'EVENT',
        'Description': '',
        'Status': 'NEW',
        'Rating': 'COLD',
      },
    ]

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(templateData)

    // Set column widths for better readability
    const columnWidths = [
      { wch: 15 }, // First Name
      { wch: 15 }, // Last Name
      { wch: 30 }, // Email
      { wch: 25 }, // Company
      { wch: 18 }, // Phone
      { wch: 18 }, // Mobile
      { wch: 20 }, // Title
      { wch: 15 }, // Industry
      { wch: 15 }, // Lead Source
      { wch: 40 }, // Description
      { wch: 12 }, // Status
      { wch: 10 }, // Rating
    ]
    worksheet['!cols'] = columnWidths

    // Add instructions in a comment/note (Excel doesn't support notes easily, so we'll use a second sheet)
    const instructionsData = [
      ['Lead Upload Template - Instructions'],
      [''],
      ['REQUIRED COLUMNS (must be filled):'],
      ['  • First Name - Lead\'s first name'],
      ['  • Last Name - Lead\'s last name'],
      ['  • Email - Valid email address (must be unique)'],
      [''],
      ['OPTIONAL COLUMNS:'],
      ['  • Company - Company or organization name'],
      ['  • Phone - Phone number'],
      ['  • Mobile - Mobile phone number'],
      ['  • Title - Job title or position'],
      ['  • Industry - Industry sector'],
      ['  • Lead Source - Where the lead came from'],
      ['    Valid values: WEB_FORM, EMAIL, PHONE, ADVERTISING, EVENT, REFERRAL, PARTNER, SOCIAL_MEDIA, LINKEDIN, OTHER'],
      ['  • Description - Additional notes or information'],
      ['  • Status - Current lead status'],
      ['    Valid values: NEW, CONTACTED, QUALIFIED, CONVERTED, UNQUALIFIED, NURTURING'],
      ['  • Rating - Lead quality rating'],
      ['    Valid values: HOT, WARM, COLD'],
      [''],
      ['NOTES:'],
      ['  • Remove example rows before uploading'],
      ['  • Column headers are case-insensitive'],
      ['  • Duplicate emails will be skipped'],
      ['  • Lead scores are calculated automatically'],
      ['  • If Status or Rating is not provided, defaults will be assigned'],
      [''],
      ['CUSTOM COLUMNS:'],
      ['  • You can add additional columns beyond the standard ones'],
      ['  • Custom columns will be stored and can be used in views, filters, and exports'],
      ['  • Examples: Budget, Region, Campaign ID, Referral Code, Custom Notes, etc.'],
      ['  • Custom fields are preserved even if they don\'t match standard columns'],
    ]

    const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData)
    instructionsSheet['!cols'] = [{ wch: 80 }]

    // Add sheets to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads Template')
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions')

    // Generate Excel buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    const filename = `lead-upload-template.xlsx`

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

