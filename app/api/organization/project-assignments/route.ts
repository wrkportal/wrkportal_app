import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// POST - Assign user to project
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, projectId, role, allocation } = body

    if (!userId || !projectId) {
      return NextResponse.json(
        { error: 'userId and projectId are required' },
        { status: 400 }
      )
    }

    // Check if already assigned
    const existing = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'User already assigned to this project' },
        { status: 400 }
      )
    }

    // Create assignment
    const assignment = await prisma.projectMember.create({
      data: {
        userId,
        projectId,
        role: role || 'Team Member',
        allocation: allocation || 100,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    })

    return NextResponse.json({ assignment, success: true }, { status: 201 })
  } catch (error) {
    console.error('Error assigning user to project:', error)
    return NextResponse.json(
      { error: 'Failed to assign user to project' },
      { status: 500 }
    )
  }
}

// DELETE - Remove user from project
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const projectId = searchParams.get('projectId')

    if (!userId || !projectId) {
      return NextResponse.json(
        { error: 'userId and projectId are required' },
        { status: 400 }
      )
    }

    await prisma.projectMember.delete({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing user from project:', error)
    return NextResponse.json(
      { error: 'Failed to remove user from project' },
      { status: 500 }
    )
  }
}
