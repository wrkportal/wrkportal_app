import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@/types'

// GET /api/tutorials - Get all tutorials (everyone can view)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const section = searchParams.get('section')
    const category = searchParams.get('category')

    const tutorials = await prisma.tutorial.findMany({
      where: {
        tenantId: session.user.tenantId,
        isPublished: true,
        ...(section && { section: section as any }),
        ...(category && { category }),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json({ tutorials })
  } catch (error) {
    console.error('Error fetching tutorials:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tutorials' },
      { status: 500 }
    )
  }
}

// POST /api/tutorials - Create a new tutorial (Super Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is super admin
    if (session.user.role !== UserRole.TENANT_SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'Only super admins can create tutorials' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      title,
      description,
      type,
      duration,
      level,
      category,
      section,
      videoUrl,
      contentText,
      fileUrl,
      fileName,
      fileSize,
      thumbnail,
      order,
      isPublished,
    } = body

    // Validation
    if (!title || !description || !type || !duration || !level || !category || !section) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const tutorial = await prisma.tutorial.create({
      data: {
        title,
        description,
        type,
        duration,
        level,
        category,
        section,
        videoUrl,
        contentText,
        fileUrl,
        fileName,
        fileSize,
        thumbnail,
        order: order || 0,
        isPublished: isPublished !== undefined ? isPublished : true,
        tenantId: session.user.tenantId,
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ tutorial }, { status: 201 })
  } catch (error) {
    console.error('Error creating tutorial:', error)
    return NextResponse.json(
      { error: 'Failed to create tutorial' },
      { status: 500 }
    )
  }
}

