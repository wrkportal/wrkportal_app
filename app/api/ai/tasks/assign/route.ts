import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getTeamMembersForAI } from '@/lib/ai/data-access'
import { assignTasks } from '@/lib/ai/services'
import { Prisma } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, projectName, tasks, teamMembers, skillsAndExpertise } = body

    if (!tasks) {
      return NextResponse.json(
        { error: 'Tasks are required' },
        { status: 400 }
      )
    }

    let teamData

    // If projectId provided, fetch real team data
    if (projectId) {
      type TeamMember = Prisma.UserGetPayload<{
        select: {
          id: true
          name: true
          firstName: true
          lastName: true
          email: true
          role: true
          skills: {
            include: {
              skill: {
                select: {
                  name: true
                  category: true
                }
              }
            }
          }
          assignedTasks: {
            select: {
              id: true
              priority: true
              estimatedHours: true
            }
          }
          teamMemberships: {
            select: {
              projectId: true
              allocation: true
            }
          }
        }
      }>

      type UserSkill = TeamMember['skills'][0]
      type AssignedTask = TeamMember['assignedTasks'][0]

      const realTeamMembers: TeamMember[] = await getTeamMembersForAI(
        session.user.tenantId,
        projectId
      )

      // Format team member data for AI
      teamData = realTeamMembers.map((member: TeamMember) => {
        const name = member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim()
        const skills = member.skills.map((s: UserSkill) => 
          `${s.skill.name} (${s.level})`
        ).join(', ')
        
        const currentWorkload = member.assignedTasks.length
        const totalEstimatedHours = member.assignedTasks.reduce((sum: number, task: AssignedTask) => 
          sum + (Number(task.estimatedHours) || 0), 0
        )

        return `${name} - Skills: ${skills || 'None listed'} - Current tasks: ${currentWorkload} (${totalEstimatedHours}h estimated)`
      }).join('\n')
    } else {
      teamData = teamMembers
    }

    const assignments = await assignTasks({
      projectName: projectName || 'Project',
      tasks,
      teamMembers: teamData || teamMembers,
      skillsAndExpertise: skillsAndExpertise || '',
    })

    return NextResponse.json({ assignments })
  } catch (error) {
    console.error('Task assignment error:', error)
    return NextResponse.json(
      { error: 'Failed to assign tasks' },
      { status: 500 }
    )
  }
}

