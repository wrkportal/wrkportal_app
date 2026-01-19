/**
 * Report Templates API
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  getReportTemplates,
  getTemplatesByCategory,
} from '@/lib/sales/report-templates'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')

    const templates = category
      ? getTemplatesByCategory(category)
      : getReportTemplates()

    return NextResponse.json(templates)
  } catch (error: any) {
    console.error('Error fetching report templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates', details: error.message },
      { status: 500 }
    )
  }
}

