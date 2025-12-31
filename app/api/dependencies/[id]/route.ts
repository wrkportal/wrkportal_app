import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateDependencySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.enum(['BLOCKS', 'BLOCKED_BY', 'DEPENDS_ON', 'RELATED_TO']).optional(),
  status: z.enum(['ACTIVE', 'RESOLVED', 'AT_RISK', 'BLOCKED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  impact: z.string().optional(),
  mitigation: z.string().optional(),
  resolvedAt: z.string().optional().nullable(),
})

// GET - Fetch single dependency by ID
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

    const dependency = await prisma.dependency.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    })

    if (!dependency) {
      return NextResponse.json({ error: 'Dependency not found' }, { status: 404 })
    }

    return NextResponse.json({ dependency })
  } catch (error) {
    console.error('Error fetching dependency:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update dependency
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const validatedData = updateDependencySchema.parse(body)

    // Verify dependency exists and user has access
    const existingDependency = await prisma.dependency.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    })

    if (!existingDependency) {
      return NextResponse.json({ error: 'Dependency not found' }, { status: 404 })
    }

    const updateData: any = {}
    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.type !== undefined) updateData.type = validatedData.type
    if (validatedData.status !== undefined) updateData.status = validatedData.status
    if (validatedData.priority !== undefined) updateData.priority = validatedData.priority
    if (validatedData.impact !== undefined) updateData.impact = validatedData.impact
    if (validatedData.mitigation !== undefined) updateData.mitigation = validatedData.mitigation
    if (validatedData.resolvedAt !== undefined) {
      updateData.resolvedAt = validatedData.resolvedAt ? new Date(validatedData.resolvedAt) : null
    }

    const dependency = await prisma.dependency.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ dependency })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating dependency:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete dependency
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify dependency exists and user has access
    const dependency = await prisma.dependency.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    })

    if (!dependency) {
      return NextResponse.json({ error: 'Dependency not found' }, { status: 404 })
    }

    // Delete the dependency
    await prisma.dependency.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Dependency deleted successfully' })
  } catch (error) {
    console.error('Error deleting dependency:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

