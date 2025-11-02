import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createOrgUnitSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  parentId: z.string().optional().nullable(),
})

// GET - Fetch all org units with hierarchy
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orgUnits = await prisma.orgUnit.findMany({
      where: {
        tenantId: session.user.tenantId,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            users: true,
            children: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json({
      orgUnits,
      totalUnits: orgUnits.length,
      success: true,
    })
  } catch (error) {
    console.error('Error fetching org units:', error)
    return NextResponse.json(
      { error: 'Failed to fetch org units' },
      { status: 500 }
    )
  }
}

// POST - Create new org unit
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createOrgUnitSchema.parse(body)

    const orgUnit = await prisma.orgUnit.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        parentId: validatedData.parentId || null,
        tenantId: session.user.tenantId,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({ orgUnit, success: true }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating org unit:', error)
    return NextResponse.json(
      { error: 'Failed to create org unit' },
      { status: 500 }
    )
  }
}

// DELETE - Remove org unit (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin permissions
    const allowedRoles = ['TENANT_SUPER_ADMIN', 'ORG_ADMIN']
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const orgUnitId = searchParams.get('orgUnitId')

    if (!orgUnitId) {
      return NextResponse.json(
        { error: 'Org unit ID required' },
        { status: 400 }
      )
    }

    // Check if org unit has users
    const orgUnit = await prisma.orgUnit.findUnique({
      where: { id: orgUnitId },
      include: {
        _count: {
          select: {
            users: true,
            children: true,
          },
        },
      },
    })

    if (!orgUnit) {
      return NextResponse.json({ error: 'Org unit not found' }, { status: 404 })
    }

    // Prevent deletion if unit has users or child units
    if (orgUnit._count.users > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete: ${orgUnit._count.users} user(s) assigned to this unit`,
        },
        { status: 400 }
      )
    }

    if (orgUnit._count.children > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete: ${orgUnit._count.children} sub-unit(s) under this unit`,
        },
        { status: 400 }
      )
    }

    // Delete org unit
    await prisma.orgUnit.delete({
      where: { id: orgUnitId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting org unit:', error)
    return NextResponse.json(
      { error: 'Failed to delete org unit' },
      { status: 500 }
    )
  }
}
