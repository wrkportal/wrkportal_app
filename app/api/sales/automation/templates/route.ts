import { NextRequest, NextResponse } from 'next/server'
import { 
  workflowTemplates, 
  getTemplatesByCategory, 
  getTemplateById,
  searchTemplates,
  getPopularTemplates
} from '@/lib/sales/workflow-templates'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') as any
    const id = searchParams.get('id')
    const search = searchParams.get('search')
    const popular = searchParams.get('popular')

    if (id) {
      const template = getTemplateById(id)
      if (!template) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(template)
    }

    if (popular === 'true') {
      const limit = parseInt(searchParams.get('limit') || '5')
      const templates = getPopularTemplates(limit)
      return NextResponse.json({ templates })
    }

    if (search) {
      const templates = searchTemplates(search)
      return NextResponse.json({ templates })
    }

    if (category) {
      const templates = getTemplatesByCategory(category)
      return NextResponse.json({ templates })
    }

    // Return all templates
    return NextResponse.json({ templates: workflowTemplates })
  } catch (error: any) {
    console.error('Error fetching workflow templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

