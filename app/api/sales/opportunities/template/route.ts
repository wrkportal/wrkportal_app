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
        'Name': 'Enterprise Solution Deal',
        'Account Name': 'Acme Corporation',
        'Stage': 'PROSPECTING',
        'Amount': '50000',
        'Probability': '25',
        'Expected Close Date': '2024-12-31',
        'Type': 'NEW_BUSINESS',
        'Lead Source': 'WEB_FORM',
        'Next Step': 'Schedule discovery call',
        'Description': 'Large enterprise opportunity',
        'Competitor Info': 'Competing with Vendor X',
      },
      {
        'Name': 'Product Expansion',
        'Account Name': 'Tech Solutions Inc',
        'Stage': 'QUALIFICATION',
        'Amount': '25000',
        'Probability': '40',
        'Expected Close Date': '2024-11-30',
        'Type': 'UPSELL',
        'Lead Source': 'REFERRAL',
        'Next Step': 'Send proposal',
        'Description': '',
        'Competitor Info': '',
      },
    ]

    const worksheet = XLSX.utils.json_to_sheet(templateData)
    worksheet['!cols'] = [
      { wch: 30 }, // Name
      { wch: 25 }, // Account Name
      { wch: 20 }, // Stage
      { wch: 15 }, // Amount
      { wch: 12 }, // Probability
      { wch: 20 }, // Expected Close Date
      { wch: 15 }, // Type
      { wch: 15 }, // Lead Source
      { wch: 30 }, // Next Step
      { wch: 40 }, // Description
      { wch: 30 }, // Competitor Info
    ]

    const instructionsData = [
      ['Opportunity Upload Template - Instructions'],
      [''],
      ['REQUIRED COLUMNS (must be filled):'],
      ['  • Name - Opportunity name'],
      ['  • Expected Close Date - Expected closing date (YYYY-MM-DD)'],
      [''],
      ['OPTIONAL COLUMNS:'],
      ['  • Account Name - Associated account name (will be looked up)'],
      ['  • Stage - Opportunity stage'],
      ['    Valid values: PROSPECTING, QUALIFICATION, NEEDS_ANALYSIS, VALUE_PROPOSITION, ID_DECISION_MAKERS, PERCEPTION_ANALYSIS, PROPOSAL_PRICE_QUOTE, NEGOTIATION_REVIEW, CLOSED_WON, CLOSED_LOST'],
      ['  • Amount - Opportunity amount (numeric)'],
      ['  • Probability - Probability percentage (0-100)'],
      ['  • Type - Opportunity type'],
      ['    Valid values: NEW_BUSINESS, EXISTING_BUSINESS, UPSELL, CROSS_SELL, RENEWAL'],
      ['  • Lead Source - Lead source'],
      ['    Valid values: WEB_FORM, EMAIL, PHONE, ADVERTISING, EVENT, REFERRAL, PARTNER, SOCIAL_MEDIA, LINKEDIN, OTHER'],
      ['  • Next Step - Next action item'],
      ['  • Description - Additional notes'],
      ['  • Competitor Info - Competitor information'],
      [''],
      ['NOTES:'],
      ['  • Remove example rows before uploading'],
      ['  • Account Name will be matched to existing accounts (case-insensitive)'],
      ['  • Default stage is PROSPECTING if not provided'],
      ['  • Default probability is 10% if not provided'],
      ['  • Custom columns will be stored in customFields'],
    ]

    const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData)
    instructionsSheet['!cols'] = [{ wch: 80 }]

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Opportunities Template')
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions')

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    const filename = `opportunity-upload-template.xlsx`

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

