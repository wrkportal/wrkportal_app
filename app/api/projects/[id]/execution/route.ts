import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch execution phase data
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
    console.log('📥 GET /api/projects/[id]/execution - Project ID:', id)

    const project = await prisma.project.findUnique({
      where: { id },
      select: {
        id: true,
        executionData: true,
      },
    })

    if (!project) {
      console.error('❌ Project not found:', id)
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    console.log(
      '✅ Found project execution data:',
      project.executionData ? 'exists' : 'empty'
    )
    return NextResponse.json({ executionData: project.executionData || {} })
  } catch (error) {
    console.error('❌ Error fetching execution data:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// POST - Save execution phase data
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
    console.log('💾 POST /api/projects/[id]/execution - Project ID:', id)

    const body = await req.json()

    console.log('💾 Saving execution data')

    // Update project with execution data
    const project = await prisma.project.update({
      where: { id },
      data: {
        executionData: {
          ...body,
          lastUpdated: new Date().toISOString(),
        },
      },
    })

    console.log('✅ Successfully saved execution data for project:', id)
    return NextResponse.json({ success: true, project })
  } catch (error) {
    console.error('❌ Error saving execution data:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
