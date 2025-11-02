import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch initiate phase data
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
    console.log('📥 GET /api/projects/[id]/initiate - Project ID:', id)

    const project = await prisma.project.findUnique({
      where: { id },
      select: {
        id: true,
        initiateData: true,
      },
    })

    if (!project) {
      console.error('❌ Project not found:', id)
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    console.log(
      '✅ Found project initiate data:',
      project.initiateData ? 'exists' : 'empty'
    )
    return NextResponse.json({ initiateData: project.initiateData })
  } catch (error) {
    console.error('❌ Error fetching initiate data:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// POST - Save initiate phase data
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
    console.log('💾 POST /api/projects/[id]/initiate - Project ID:', id)

    const body = await req.json()
    const { checklist, stakeholders, objectives, charter } = body

    console.log('💾 Saving data:', {
      checklistItems: checklist?.length || 0,
      stakeholdersCount: stakeholders?.length || 0,
      objectivesCount: objectives?.successCriteria?.length || 0,
      charterStatus: charter?.status,
    })

    // Update project with initiate data
    const project = await prisma.project.update({
      where: { id },
      data: {
        initiateData: {
          checklist,
          stakeholders,
          objectives,
          charter,
          lastUpdated: new Date().toISOString(),
        },
      },
    })

    console.log('✅ Successfully saved initiate data for project:', id)
    return NextResponse.json({ success: true, project })
  } catch (error) {
    console.error('❌ Error saving initiate data:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
