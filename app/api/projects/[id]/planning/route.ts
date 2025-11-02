import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch planning phase data
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    console.log('📥 GET /api/projects/[id]/planning - Project ID:', id)

    const project = await prisma.project.findUnique({
      where: { id },
      select: {
        id: true,
        planningData: true,
      },
    })

    if (!project) {
      console.error('❌ Project not found:', id)
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    console.log(
      '✅ Found project planning data:',
      project.planningData ? 'exists' : 'empty'
    )
    return NextResponse.json({ planningData: project.planningData || {} })
  } catch (error) {
    console.error('❌ Error fetching planning data:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// POST - Save planning phase data
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    console.log('💾 POST /api/projects/[id]/planning - Project ID:', id)

    const body = await req.json()
    const { deliverables, deliverableDetails, selectedDeliverableId } = body

    console.log('💾 Saving planning data:', {
      deliverablesCount: deliverables?.length || 0,
      deliverableDetailsCount: Object.keys(deliverableDetails || {}).length,
      selectedDeliverableId,
    })

    // Update project with planning data
    const project = await prisma.project.update({
      where: { id },
      data: {
        planningData: {
          deliverables,
          deliverableDetails,
          selectedDeliverableId,
          lastUpdated: new Date().toISOString(),
        },
      },
    })

    console.log('✅ Successfully saved planning data for project:', id)
    return NextResponse.json({ success: true, project })
  } catch (error) {
    console.error('❌ Error saving planning data:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
