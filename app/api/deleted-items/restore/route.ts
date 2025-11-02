import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const restoreSchema = z.object({
  type: z.enum(['task', 'project']),
  id: z.string(),
})

// POST /api/deleted-items/restore - Restore a deleted item
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, id } = restoreSchema.parse(body)

    if (type === 'task') {
      const task = await prisma.task.update({
        where: { id },
        data: {
          deletedAt: null,
          deletedById: null,
        },
      })
      return NextResponse.json(
        { message: 'Task restored successfully', task },
        { status: 200 }
      )
    } else if (type === 'project') {
      const project = await prisma.project.update({
        where: { id },
        data: {
          deletedAt: null,
          deletedById: null,
        },
      })
      return NextResponse.json(
        { message: 'Project restored successfully', project },
        { status: 200 }
      )
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error restoring item:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
