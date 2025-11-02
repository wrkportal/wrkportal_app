/**
 * AI Task Assignment Recommendation API
 */

import { NextRequest, NextResponse } from 'next/server'
import { recommendTaskAssignment } from '@/lib/ai/services/task-assignment'

export async function POST(request: NextRequest) {
  try {
    const { taskId } = await request.json()

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      )
    }

    // In production, fetch actual data from database
    // For now, return mock recommendations
    const usersResponse = await fetch(`${request.nextUrl.origin}/api/users`)
    const usersData = await usersResponse.json()

    // Mock task data - in production, fetch from database
    const mockTask = {
      id: taskId,
      projectId: 'proj-1',
      title: 'Sample Task',
      description: 'Task description',
      status: 'TODO' as const,
      priority: 'HIGH' as const,
      reporterId: 'user-1',
      estimatedHours: 8,
      tags: ['frontend', 'react'],
      checklist: [],
      dependencies: [],
      attachments: [],
      comments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Mock workload data
    const userWorkloads = usersData.users?.map((user: any) => ({
      userId: user.id,
      currentHours: Math.random() * 40,
      capacity: 40,
    })) || []

    const recommendations = await recommendTaskAssignment({
      task: mockTask,
      availableUsers: usersData.users || [],
      userWorkloads,
    })

    return NextResponse.json({ recommendations })
  } catch (error) {
    console.error('Task assignment error:', error)
    return NextResponse.json(
      { error: 'Failed to recommend task assignment' },
      { status: 500 }
    )
  }
}

