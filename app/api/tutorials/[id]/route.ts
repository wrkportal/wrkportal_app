import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@/types'

// GET /api/tutorials/[id] - Get a single tutorial
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tutorial = await prisma.tutorial.findUnique({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
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

    if (!tutorial) {
      return NextResponse.json({ error: 'Tutorial not found' }, { status: 404 })
    }

    // Increment view count
    await prisma.tutorial.update({
      where: { id: params.id },
      data: { viewCount: { increment: 1 } },
    })

    return NextResponse.json({ tutorial })
  } catch (error) {
    console.error('Error fetching tutorial:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tutorial' },
      { status: 500 }
    )
  }
}

// PUT /api/tutorials/[id] - Update a tutorial (Super Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is super admin
    if (session.user.role !== UserRole.TENANT_SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'Only super admins can update tutorials' },
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

    // Check if tutorial exists
    const existingTutorial = await prisma.tutorial.findUnique({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    })

    if (!existingTutorial) {
      return NextResponse.json({ error: 'Tutorial not found' }, { status: 404 })
    }

    const tutorial = await prisma.tutorial.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(type && { type }),
        ...(duration && { duration }),
        ...(level && { level }),
        ...(category && { category }),
        ...(section && { section }),
        ...(videoUrl !== undefined && { videoUrl }),
        ...(contentText !== undefined && { contentText }),
        ...(fileUrl !== undefined && { fileUrl }),
        ...(fileName !== undefined && { fileName }),
        ...(fileSize !== undefined && { fileSize }),
        ...(thumbnail !== undefined && { thumbnail }),
        ...(order !== undefined && { order }),
        ...(isPublished !== undefined && { isPublished }),
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

    return NextResponse.json({ tutorial })
  } catch (error) {
    console.error('Error updating tutorial:', error)
    return NextResponse.json(
      { error: 'Failed to update tutorial' },
      { status: 500 }
    )
  }
}

// DELETE /api/tutorials/[id] - Delete a tutorial (Super Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is super admin
    if (session.user.role !== UserRole.TENANT_SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'Only super admins can delete tutorials' },
        { status: 403 }
      )
    }

    // Check if tutorial exists
    const existingTutorial = await prisma.tutorial.findUnique({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    })

    if (!existingTutorial) {
      return NextResponse.json({ error: 'Tutorial not found' }, { status: 404 })
    }

    await prisma.tutorial.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Tutorial deleted successfully' })
  } catch (error) {
    console.error('Error deleting tutorial:', error)
    return NextResponse.json(
      { error: 'Failed to delete tutorial' },
      { status: 500 }
    )
  }
}

