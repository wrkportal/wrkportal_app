import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'
import { sendEmail } from '@/lib/email'

// GET - Get stakeholder update schedule and recent updates
export async function GET(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'projects', action: 'READ' },
    async (request, userInfo) => {
      try {
        const { searchParams } = new URL(req.url)
        const projectId = searchParams.get('projectId')

        // Fetch projects for updates
        const whereClause: any = {
          tenantId: userInfo.tenantId,
          deletedAt: null,
        }

        if (projectId) {
          whereClause.id = projectId
        }

        const projects = await prisma.project.findMany({
          where: whereClause,
          include: {
            releases: {
              where: {
                status: { in: ['PLANNED', 'IN_PROGRESS'] },
              },
              include: {
                tasks: {
                  where: {
                    deletedAt: null,
                  },
                  select: {
                    id: true,
                    status: true,
                  },
                },
              },
            },
            tasks: {
              where: {
                deletedAt: null,
              },
              select: {
                id: true,
                status: true,
                dueDate: true,
              },
            },
          },
        })

        // Generate update summaries
        const updates = projects.map((project) => {
          const tasks = project.tasks || []
          const releases = project.releases || []
          const totalTasks = tasks.length
          const completedTasks = tasks.filter((t) => t.status === 'DONE').length
          const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

          // Find upcoming milestones (releases)
          const upcomingReleases = releases
            .filter((r) => {
              const daysUntil = Math.ceil(
                (new Date(r.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              )
              return daysUntil <= 30 && daysUntil >= 0
            })
            .map((r) => ({
              id: r.id,
              name: r.name,
              version: r.version,
              targetDate: r.targetDate,
              progress: r.progress || 0,
            }))

          return {
            projectId: project.id,
            projectName: project.name,
            progress,
            status: project.status,
            totalTasks,
            completedTasks,
            upcomingReleases,
            lastUpdated: project.updatedAt,
            updateSummary: {
              progress: `${progress}% complete`,
              tasks: `${completedTasks} of ${totalTasks} tasks completed`,
              releases: upcomingReleases.length > 0 ? `${upcomingReleases.length} upcoming release(s)` : 'No upcoming releases',
            },
          }
        })

        // Calculate next update schedule
        const now = new Date()
        const nextWeeklyUpdate = new Date(now)
        nextWeeklyUpdate.setDate(nextWeeklyUpdate.getDate() + (7 - nextWeeklyUpdate.getDay()))

        return NextResponse.json({
          updates,
          schedule: {
            weekly: {
              nextUpdate: nextWeeklyUpdate.toISOString(),
              frequency: 'weekly',
            },
            milestones: {
              enabled: true,
              notifyOn: ['release', 'major_progress', 'blockers'],
            },
          },
          summary: {
            totalProjects: updates.length,
            activeProjects: updates.filter((u) => u.status === 'IN_PROGRESS').length,
            avgProgress:
              updates.length > 0
                ? Math.round(updates.reduce((sum, u) => sum + u.progress, 0) / updates.length)
                : 0,
            upcomingReleases: updates.reduce((sum, u) => sum + u.upcomingReleases.length, 0),
          },
        })
      } catch (error) {
        console.error('Error fetching stakeholder updates:', error)
        return NextResponse.json(
          { error: 'Failed to fetch stakeholder updates' },
          { status: 500 }
        )
      }
    }
  )
}

// POST - Send stakeholder update
export async function POST(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'projects', action: 'READ' },
    async (request, userInfo) => {
      try {
        const body = await req.json()
        const { projectId, recipients, updateType, customMessage } = body

        // Fetch project data
        const project = await prisma.project.findFirst({
          where: {
            id: projectId,
            tenantId: userInfo.tenantId,
            deletedAt: null,
          },
          include: {
            tasks: {
              where: {
                deletedAt: null,
              },
              select: {
                id: true,
                status: true,
                title: true,
              },
            },
            releases: {
              where: {
                status: { in: ['PLANNED', 'IN_PROGRESS'] },
              },
              select: {
                id: true,
                name: true,
                version: true,
                targetDate: true,
                progress: true,
              },
            },
          },
        })

        if (!project) {
          return NextResponse.json({ error: 'Project not found' }, { status: 404 })
        }

        // Generate update content
        const totalTasks = project.tasks.length
        const completedTasks = project.tasks.filter((t) => t.status === 'DONE').length
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

        const updateContent = {
          projectName: project.name,
          progress,
          status: project.status,
          completedTasks,
          totalTasks,
          upcomingReleases: project.releases,
          customMessage,
        }

        // Generate email HTML
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #9333ea; border-bottom: 2px solid #ec4899; padding-bottom: 10px;">
              Project Update: ${project.name}
            </h2>
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Progress Summary</h3>
              <p><strong>Status:</strong> ${project.status}</p>
              <p><strong>Progress:</strong> ${progress}%</p>
              <p><strong>Tasks:</strong> ${completedTasks} of ${totalTasks} completed</p>
            </div>
            ${project.releases.length > 0 ? `
              <div style="background: #ffffff; padding: 20px; border-left: 4px solid #9333ea; margin: 20px 0;">
                <h3 style="margin-top: 0;">Upcoming Releases</h3>
                ${project.releases.map((r) => `
                  <p><strong>${r.name}</strong> (${r.version}) - ${new Date(r.targetDate).toLocaleDateString()}</p>
                `).join('')}
              </div>
            ` : ''}
            ${customMessage ? `
              <div style="background: #ffffff; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0;">
                <p style="margin: 0; line-height: 1.6;">${customMessage.replace(/\n/g, '<br>')}</p>
              </div>
            ` : ''}
            <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
              This update was generated from wrkportal.com
            </p>
          </div>
        `

        // Send emails to recipients
        const emailResults = await Promise.allSettled(
          recipients.map((email: string) =>
            sendEmail({
              to: email,
              subject: `Project Update: ${project.name}`,
              html: emailHtml,
              text: `Project Update: ${project.name}\n\nProgress: ${progress}%\nTasks: ${completedTasks}/${totalTasks}\n\n${customMessage || ''}`,
            })
          )
        )

        const successful = emailResults.filter((r) => r.status === 'fulfilled').length
        const failed = emailResults.filter((r) => r.status === 'rejected').length

        return NextResponse.json({
          success: true,
          sent: successful,
          failed,
          updateContent,
        })
      } catch (error) {
        console.error('Error sending stakeholder update:', error)
        return NextResponse.json(
          { error: 'Failed to send stakeholder update' },
          { status: 500 }
        )
      }
    }
  )
}

