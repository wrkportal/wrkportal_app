import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { searchProjectDataForAI } from '@/lib/ai/data-access'
import { performSemanticSearch } from '@/lib/ai/services'
import { Prisma } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { query } = body

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }

    // First, do a basic database search
    const dbResults = await searchProjectDataForAI(session.user.tenantId, query)

    // Define types for the search results
    type ProjectWithManager = Prisma.ProjectGetPayload<{
      select: {
        id: true
        name: true
        description: true
        code: true
        status: true
        manager: {
          select: {
            name: true
            firstName: true
            lastName: true
          }
        }
      }
    }>

    type TaskWithRelations = Prisma.TaskGetPayload<{
      select: {
        id: true
        title: true
        description: true
        status: true
        priority: true
        project: {
          select: {
            name: true
          }
        }
        assignee: {
          select: {
            name: true
            firstName: true
            lastName: true
          }
        }
      }
    }>

    type CommentWithRelations = Prisma.TaskCommentGetPayload<{
      select: {
        id: true
        content: true
        createdAt: true
        task: {
          select: {
            title: true
            project: {
              select: {
                name: true
              }
            }
          }
        }
        user: {
          select: {
            name: true
            firstName: true
            lastName: true
          }
        }
      }
    }>

    // Compile all data for AI to analyze
    const searchContext = {
      query,
      projects: dbResults.projects.map((p: ProjectWithManager) => ({
        title: p.name,
        content: `${p.description || ''} (Code: ${p.code}, Status: ${p.status})`,
        type: 'project',
        metadata: {
          projectName: p.name,
          manager: p.manager?.name || `${p.manager?.firstName} ${p.manager?.lastName}`,
          date: '',
        },
      })),
      tasks: dbResults.tasks.map((t: TaskWithRelations) => ({
        title: t.title,
        content: `${t.description || ''} (Status: ${t.status}, Priority: ${t.priority})`,
        type: 'task',
        metadata: {
          projectName: t.project?.name,
          assignee: t.assignee?.name || `${t.assignee?.firstName} ${t.assignee?.lastName}`,
          date: '',
        },
      })),
      comments: dbResults.comments.map((c: CommentWithRelations) => ({
        title: `Comment on: ${c.task.title}`,
        content: c.content,
        type: 'comment',
        metadata: {
          projectName: c.task.project?.name,
          author: c.user.name || `${c.user.firstName} ${c.user.lastName}`,
          date: c.createdAt.toLocaleDateString(),
        },
      })),
    }

    // Use AI to rank and enhance results
    const results = await performSemanticSearch(searchContext)

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Semantic search error:', error)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}

