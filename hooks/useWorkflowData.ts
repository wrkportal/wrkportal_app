'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useWorkflowTerminology } from './useWorkflowTerminology'
import { WorkflowType } from '@/lib/workflows/terminology'
import { MethodologyType } from '@/lib/workflows/methodologies'

/**
 * Hook to fetch workflow-specific data
 */
export function useWorkflowData() {
  const user = useAuthStore((state) => state.user)
  const { workflowType: contextWorkflowType } = useWorkflowTerminology()
  const [workflowAssignments, setWorkflowAssignments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const currentWorkflowType = (user?.primaryWorkflowType as WorkflowType) || contextWorkflowType || WorkflowType.GENERAL

  useEffect(() => {
    const fetchAssignments = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/workflows/assignments?userId=${user.id}`)
        if (response.ok) {
          const data = await response.json()
          setWorkflowAssignments(data.assignments || [])
        }
      } catch (error) {
        console.error('Error fetching workflow assignments:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAssignments()
  }, [user])

  return {
    workflowType: currentWorkflowType,
    workflowAssignments,
    isLoading,
  }
}

/**
 * Hook to fetch projects filtered by workflow
 */
export function useWorkflowProjects(workflowType?: WorkflowType | null) {
  const [projects, setProjects] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        if (workflowType) {
          params.append('workflowType', workflowType)
        }

        const response = await fetch(`/api/projects?${params.toString()}`)
        if (response.ok) {
          const data = await response.json()
          setProjects(data.projects || [])
        } else {
          setError('Failed to fetch projects')
        }
      } catch (err) {
        console.error('Error fetching projects:', err)
        setError('Failed to fetch projects')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProjects()
  }, [workflowType])

  return { projects, isLoading, error }
}

/**
 * Hook to fetch task templates for a workflow
 */
export function useTaskTemplates(
  workflowType: WorkflowType | null,
  methodologyType?: MethodologyType | null
) {
  const [templates, setTemplates] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTemplates = async () => {
      if (!workflowType) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        params.append('workflowType', workflowType)
        if (methodologyType) {
          params.append('methodologyType', methodologyType)
        }

        const response = await fetch(`/api/workflows/task-templates?${params.toString()}`)
        if (response.ok) {
          const data = await response.json()
          setTemplates(data.templates || [])
        } else {
          setError('Failed to fetch templates')
        }
      } catch (err) {
        console.error('Error fetching task templates:', err)
        setError('Failed to fetch templates')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTemplates()
  }, [workflowType, methodologyType])

  return { templates, isLoading, error }
}

/**
 * Hook to fetch dashboard data filtered by workflow
 */
export function useWorkflowDashboard(workflowType?: WorkflowType | null) {
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboard = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        if (workflowType) {
          params.append('workflowType', workflowType)
        }

        const response = await fetch(`/api/projects/dashboard?${params.toString()}`)
        if (response.ok) {
          const data = await response.json()
          setDashboardData(data)
        } else {
          setError('Failed to fetch dashboard data')
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        setError('Failed to fetch dashboard data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboard()
  }, [workflowType])

  return { dashboardData, isLoading, error }
}

