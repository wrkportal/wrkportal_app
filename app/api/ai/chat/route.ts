/**
 * AI Chat Assistant API
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { chatWithAssistant } from '@/lib/ai/services/ai-assistant'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { messages } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      )
    }

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
    }

    const result = await chatWithAssistant(messages, functionImplementations)

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

