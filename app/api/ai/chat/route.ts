/**
 * AI Chat Assistant API
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { chatWithAssistant } from '@/lib/ai/services/ai-assistant'
import { canUseAI } from '@/lib/utils/tier-utils'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user's tier has access to AI features
    const { canUseAI, canExecuteAIQuery, getUserTier } = await import('@/lib/utils/tier-utils')
    const hasAIAccess = await canUseAI(session.user.id)
    if (!hasAIAccess) {
      return NextResponse.json(
        {
          error: 'AI features are not available on your current plan',
          message: 'Upgrade to Professional or higher to access AI features. Visit your settings to upgrade.',
          upgradeRequired: true,
        },
        { status: 403 }
      )
    }

    // Check AI query limits for Professional tier (50 queries/month)
    const canExecute = await canExecuteAIQuery(session.user.id)
    if (!canExecute) {
      const tier = await getUserTier(session.user.id)
      const { getAIQueryLimitInfo } = await import('@/lib/utils/tier-utils')
      const limitInfo = await getAIQueryLimitInfo(session.user.id)
      
      return NextResponse.json(
        {
          error: 'AI query limit reached',
          message: tier === 'professional'
            ? 'Professional tier allows 50 AI queries per month. Upgrade to Business or higher for unlimited AI queries.'
            : `You've reached your AI query limit (${limitInfo.limit}/month). Upgrade to increase your limits.`,
          upgradeRequired: true,
          limitInfo: {
            currentCount: limitInfo.currentCount,
            limit: limitInfo.limit,
            remaining: limitInfo.remaining,
          },
        },
        { status: 403 }
      )
    }

    const { messages } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      )
    }

    // Get tier-based AI model (Professional: GPT-3.5-turbo, Business: GPT-4 Turbo)
    const { getAIConfigForUser } = await import('@/lib/utils/ai-model-selection')
    const aiConfig = await getAIConfigForUser(session.user.id)

    // Define function implementations
    const functionImplementations = {
      get_org_users: async (args: { tenantId?: string; status?: string }) => {
        try {
          // If tenantId provided and caller has permission, use admin route; else use org-scoped route
          if (args.tenantId && args.tenantId !== session.user.tenantId) {
            // Only super admin can query other tenants
            if (session.user.role !== 'TENANT_SUPER_ADMIN') {
              return { error: 'Forbidden', success: false }
            }
            const params = new URLSearchParams()
            if (args.status) params.set('status', args.status)
            const res = await fetch(`${request.nextUrl.origin}/api/admin/tenants/${args.tenantId}/users?${params}`, {
              headers: { Cookie: request.headers.get('cookie') || '' },
            })
            const data = await res.json()
            
            // Remove avatar images to reduce token count - they're too large for AI context
            if (data.users && Array.isArray(data.users)) {
              data.users = data.users.map((user: any) => {
                const { avatar, ...userWithoutAvatar } = user
                return userWithoutAvatar
              })
            }
            
            console.log('get_org_users (admin) response (avatars removed):', data)
            return data
          } else {
            const params = new URLSearchParams()
            if (args.status) params.set('status', args.status)
            const url = `${request.nextUrl.origin}/api/organization/users?${params}`
            console.log('Fetching org users from:', url)
            const res = await fetch(url, {
              headers: { Cookie: request.headers.get('cookie') || '' },
            })
            const data = await res.json()
            
            // Remove avatar images to reduce token count - they're too large for AI context
            if (data.users && Array.isArray(data.users)) {
              data.users = data.users.map((user: any) => {
                const { avatar, ...userWithoutAvatar } = user
                return userWithoutAvatar
              })
            }
            
            console.log('get_org_users response (avatars removed):', data)
            return data
          }
        } catch (error) {
          console.error('get_org_users error:', error)
          return { error: 'Failed to fetch users', success: false }
        }
      },
      get_project_details: async (args: { projectId: string }) => {
        const response = await fetch(`${request.nextUrl.origin}/api/projects/${args.projectId}`, {
          headers: { Cookie: request.headers.get('cookie') || '' },
        })
        return response.json()
      },
      list_projects: async (args: { status?: string; search?: string }) => {
        const params = new URLSearchParams()
        if (args.status) params.append('status', args.status)
        if (args.search) params.append('search', args.search)
        
        const response = await fetch(`${request.nextUrl.origin}/api/projects?${params}`, {
          headers: { Cookie: request.headers.get('cookie') || '' },
        })
        return response.json()
      },
      create_task: async (args: any) => {
        const response = await fetch(`${request.nextUrl.origin}/api/tasks`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Cookie: request.headers.get('cookie') || '',
          },
          body: JSON.stringify(args),
        })
        return response.json()
      },
      update_task_status: async (args: { taskId: string; status: string }) => {
        const response = await fetch(`${request.nextUrl.origin}/api/tasks/${args.taskId}`, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            Cookie: request.headers.get('cookie') || '',
          },
          body: JSON.stringify({ status: args.status }),
        })
        return response.json()
      },
      get_my_tasks: async (args: { status?: string; overdue?: boolean }) => {
        const params = new URLSearchParams()
        if (args.status) params.append('status', args.status)
        if (args.overdue) params.append('overdue', 'true')
        
        const response = await fetch(`${request.nextUrl.origin}/api/tasks/my-tasks?${params}`, {
          headers: { Cookie: request.headers.get('cookie') || '' },
        })
        return response.json()
      },
      get_all_tasks: async (args: { projectId?: string; status?: string; overdue?: boolean }) => {
        const params = new URLSearchParams()
        if (args.projectId) params.append('projectId', args.projectId)
        if (args.status) params.append('status', args.status)
        if (args.overdue) params.append('overdue', 'true')
        
        const response = await fetch(`${request.nextUrl.origin}/api/tasks?${params}`, {
          headers: { Cookie: request.headers.get('cookie') || '' },
        })
        return response.json()
      },
      get_budget_status: async (args: { projectId: string }) => {
        const response = await fetch(`${request.nextUrl.origin}/api/projects/${args.projectId}/budget`, {
          headers: { Cookie: request.headers.get('cookie') || '' },
        })
        return response.json()
      },
      get_team_members: async (args: { projectId?: string; skills?: string[] }) => {
        const params = new URLSearchParams()
        if (args.projectId) params.append('projectId', args.projectId)
        if (args.skills) args.skills.forEach(s => params.append('skills', s))
        
        const response = await fetch(`${request.nextUrl.origin}/api/users?${params}`, {
          headers: { Cookie: request.headers.get('cookie') || '' },
        })
        return response.json()
      },
      create_risk: async (args: any) => {
        const response = await fetch(`${request.nextUrl.origin}/api/projects/${args.projectId}/risks`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Cookie: request.headers.get('cookie') || '',
          },
          body: JSON.stringify(args),
        })
        return response.json()
      },
      get_project_risks: async (args: { projectId: string; level?: string }) => {
        const params = new URLSearchParams()
        if (args.level) params.append('level', args.level)
        
        const response = await fetch(`${request.nextUrl.origin}/api/projects/${args.projectId}/risks?${params}`, {
          headers: { Cookie: request.headers.get('cookie') || '' },
        })
        return response.json()
      },
      search_projects_and_tasks: async (args: { query: string }) => {
        const response = await fetch(`${request.nextUrl.origin}/api/search?q=${encodeURIComponent(args.query)}`, {
          headers: { Cookie: request.headers.get('cookie') || '' },
        })
        return response.json()
      },
      // Sales-specific functions
      schedule_meeting: async (args: any) => {
        const response = await fetch(`${request.nextUrl.origin}/api/sales/activities`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Cookie: request.headers.get('cookie') || '',
          },
          body: JSON.stringify({
            type: args.type || 'MEETING',
            subject: args.subject,
            description: args.description || null,
            dueDate: args.dueDate,
            duration: args.duration || 30,
            location: args.location || null,
            leadId: args.leadId || null,
            contactId: args.contactId || null,
            accountId: args.accountId || null,
            opportunityId: args.opportunityId || null,
            status: 'PLANNED',
            priority: 'MEDIUM',
          }),
        })
        return response.json()
      },
      create_opportunity: async (args: any) => {
        const response = await fetch(`${request.nextUrl.origin}/api/sales/opportunities`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Cookie: request.headers.get('cookie') || '',
          },
          body: JSON.stringify({
            name: args.name,
            description: args.description || null,
            amount: args.amount || 0,
            stage: args.stage || 'PROSPECTING',
            probability: args.probability || 10,
            expectedCloseDate: args.expectedCloseDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            accountId: args.accountId || null,
            leadId: args.leadId || null,
          }),
        })
        return response.json()
      },
      get_my_schedule: async (args: { date?: string }) => {
        const params = new URLSearchParams()
        if (args.date) {
          params.append('date', args.date)
        }
        params.append('assignedToId', session.user.id)
        
        const response = await fetch(`${request.nextUrl.origin}/api/sales/activities?${params}`, {
          headers: { Cookie: request.headers.get('cookie') || '' },
        })
        const activities = await response.json()
        
        // Filter activities for the specified date
        const targetDate = args.date ? new Date(args.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        const scheduledActivities = Array.isArray(activities) 
          ? activities.filter((activity: any) => {
              if (!activity.dueDate) return false
              const activityDate = new Date(activity.dueDate).toISOString().split('T')[0]
              return activityDate === targetDate
            })
          : []
        
        return { activities: scheduledActivities, date: targetDate }
      },
      get_my_priorities: async (args: { includeOverdue?: boolean }) => {
        const [tasksRes, activitiesRes] = await Promise.all([
          fetch(`${request.nextUrl.origin}/api/tasks/my-tasks?status=TODO&priority=HIGH`, {
            headers: { Cookie: request.headers.get('cookie') || '' },
          }),
          fetch(`${request.nextUrl.origin}/api/sales/activities?assignedToId=${session.user.id}&priority=HIGH`, {
            headers: { Cookie: request.headers.get('cookie') || '' },
          }),
        ])
        
        const tasks = await tasksRes.json()
        const activities = await activitiesRes.json()
        
        let overdueTasks = []
        if (args.includeOverdue) {
          const overdueRes = await fetch(`${request.nextUrl.origin}/api/tasks/my-tasks?overdue=true`, {
            headers: { Cookie: request.headers.get('cookie') || '' },
          })
          overdueTasks = await overdueRes.json()
        }
        
        return {
          highPriorityTasks: Array.isArray(tasks) ? tasks : [],
          highPriorityActivities: Array.isArray(activities) ? activities : [],
          overdueTasks: Array.isArray(overdueTasks) ? overdueTasks : [],
        }
      },
      list_leads: async (args: { search?: string; status?: string }) => {
        const params = new URLSearchParams()
        if (args.search) params.append('search', args.search)
        if (args.status) params.append('status', args.status)
        
        const response = await fetch(`${request.nextUrl.origin}/api/sales/leads?${params}`, {
          headers: { Cookie: request.headers.get('cookie') || '' },
        })
        return response.json()
      },
      list_contacts: async (args: { search?: string }) => {
        const params = new URLSearchParams()
        if (args.search) params.append('search', args.search)
        
        const response = await fetch(`${request.nextUrl.origin}/api/sales/contacts?${params}`, {
          headers: { Cookie: request.headers.get('cookie') || '' },
        })
        return response.json()
      },
      list_opportunities: async (args: { search?: string; stage?: string; status?: string }) => {
        const params = new URLSearchParams()
        if (args.search) params.append('search', args.search)
        if (args.stage) params.append('stage', args.stage)
        if (args.status) params.append('status', args.status)
        
        const response = await fetch(`${request.nextUrl.origin}/api/sales/opportunities?${params}`, {
          headers: { Cookie: request.headers.get('cookie') || '' },
        })
        return response.json()
      },
    }

    const result = await chatWithAssistant(messages, functionImplementations, {
      model: aiConfig.model,
      temperature: aiConfig.temperature,
      maxTokens: aiConfig.maxTokens,
    })

    // Log AI query for tracking (after successful execution)
    try {
      const { logAIQuery } = await import('@/lib/utils/tier-utils')
      await logAIQuery(
        session.user.tenantId!,
        session.user.id,
        'CHAT',
        {
          messageCount: messages.length,
          hasFunctionCalls: !!result.functionCalls && result.functionCalls.length > 0,
          functionCallCount: result.functionCalls?.length || 0,
        }
      )
    } catch (error) {
      // Log error but don't fail the request - tracking should not break main functionality
      console.error('Error logging AI query:', error)
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Chat API error:', error)
    
    // Return more detailed error information
    const errorMessage = error?.message || 'Failed to process chat request'
    const errorDetails = error?.response?.data || error?.cause || null
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails,
        message: 'Sorry, I encountered an error. Please check your OpenAI API key configuration.'
      },
      { status: 500 }
    )
  }
}

