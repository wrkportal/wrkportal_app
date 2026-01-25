import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { extractStructuredData } from '@/lib/ai/ai-service'
import { PROMPTS } from '@/lib/ai/prompts'
import { Prisma } from '@prisma/client'

/**
 * POST - Generate AI daily briefing for projects
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if AI provider is configured
    const aiProvider = process.env.AI_PROVIDER || 'azure-openai'
    if (aiProvider === 'azure-openai' && !process.env.AZURE_OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'Azure OpenAI API key is not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { projectId } = body

    const userId = session.user.id
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    // Fetch projects where user is member or manager
    const whereClause: any = {
      tenantId: session.user.tenantId,
      deletedAt: null,
      OR: [
        { managerId: userId },
        { teamMembers: { some: { userId } } },
      ],
    }

    if (projectId) {
      whereClause.id = projectId
    }

    // Build context for AI
    type ProjectWithIncludes = Prisma.ProjectGetPayload<{
      include: {
        tasks: true
        risks: true
        issues: true
      }
    }>
    
    type Task = ProjectWithIncludes['tasks'][0]
    type Risk = ProjectWithIncludes['risks'][0]
    type Issue = ProjectWithIncludes['issues'][0]

    // Fetch projects with related data
    const projects = (await prisma.project.findMany({
      where: whereClause,
      include: {
        tasks: {
          where: {
            updatedAt: {
              gte: yesterday,
            },
          },
        },
        risks: {
          where: {
            OR: [
              { createdAt: { gte: yesterday } },
              { status: { in: ['IDENTIFIED', 'ACTIVE'] } },
            ],
          },
        },
        issues: {
          where: {
            OR: [
              { createdAt: { gte: yesterday } },
              { status: { in: ['OPEN', 'IN_PROGRESS'] } },
            ],
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })) as ProjectWithIncludes[]

    const projectSummaries = projects.map((project: ProjectWithIncludes) => {
      const recentTasks = project.tasks || []
      const newTasks = recentTasks.filter((t: Task) => 
        new Date(t.createdAt) >= yesterday
      )
      const completedTasks = recentTasks.filter((t: Task) => 
        t.status === 'DONE' && new Date(t.updatedAt) >= yesterday
      )
      const updatedTasks = recentTasks.filter((t: Task) => 
        t.status !== 'DONE' && new Date(t.updatedAt) >= yesterday
      )

      return `
**${project.name}** (${project.code})
- Status: ${project.status}
- RAG: ${project.ragStatus}
- Progress: ${project.progress}%
- New tasks today: ${newTasks.length}
- Completed tasks today: ${completedTasks.length}
- Updated tasks: ${updatedTasks.length}
- Active risks: ${project.risks.length}
- Open issues: ${project.issues.length}
${newTasks.length > 0 ? `\n  New Tasks:\n${newTasks.slice(0, 5).map((t: Task) => `    - ${t.title}`).join('\n')}` : ''}
${completedTasks.length > 0 ? `\n  Completed:\n${completedTasks.slice(0, 5).map((t: Task) => `    - ${t.title}`).join('\n')}` : ''}
${project.risks.length > 0 ? `\n  Risks:\n${project.risks.slice(0, 3).map((r: Risk) => `    - [${r.level}] ${r.title}`).join('\n')}` : ''}
${project.issues.length > 0 ? `\n  Issues:\n${project.issues.slice(0, 3).map((i: Issue) => `    - [${i.severity}] ${i.title}`).join('\n')}` : ''}
      `
    }).join('\n\n')

    const context = `Generate a concise daily briefing for a project manager summarizing what changed across their projects today (${today.toLocaleDateString()}).

Here's the activity from ${yesterday.toLocaleDateString()} to ${today.toLocaleDateString()}:

${projectSummaries}

Create a brief, actionable summary that highlights:
1. Key accomplishments and completed tasks
2. New or escalated risks and issues
3. Projects that need attention
4. Action items for today

Keep it concise, professional, and focused on what matters most.`

    const briefing = await extractStructuredData<{ briefing: string }>(
      context,
      `{ "briefing": "string (a concise daily briefing text)" }`,
      `You are a project management assistant. Create clear, concise daily briefings that help project managers understand what changed and what needs attention.`
    )

    return NextResponse.json({ briefing: briefing.briefing })
  } catch (error: any) {
    console.error('Error generating daily briefing:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate daily briefing' },
      { status: 500 }
    )
  }
}

