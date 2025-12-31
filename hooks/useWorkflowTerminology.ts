/**
 * useWorkflowTerminology Hook
 * 
 * Context-aware hook that provides workflow-specific terminology based on:
 * 1. Current project's workflow (if viewing a project)
 * 2. User's primary workflow
 * 3. GENERAL (fallback)
 */

'use client'

import { useState, useEffect } from 'react'
import { useParams, usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { WorkflowType, getTerm as getTermFromLib, getTerminology, type TerminologyMap } from '@/lib/workflows/terminology'

export function useWorkflowTerminology() {
  const user = useAuthStore((state) => state.user)
  const params = useParams()
  const pathname = usePathname()

  // Get workflow type from context (priority order):
  // 1. Current project's workflow (if on project page)
  // 2. User's primary workflow
  // 3. GENERAL (default)
  const [workflowType, setWorkflowType] = useState<WorkflowType | null>(
    (user?.primaryWorkflowType as WorkflowType) || WorkflowType.GENERAL
  )

  // Fetch project workflow if on project page
  useEffect(() => {
    const projectId = params?.projectId || params?.id
    if (projectId && typeof projectId === 'string') {
      fetchProjectWorkflow(projectId)
        .then((workflow) => {
          if (workflow) setWorkflowType(workflow)
        })
        .catch(() => {
          // If fetch fails, use user's primary workflow or GENERAL
          setWorkflowType(
            (user?.primaryWorkflowType as WorkflowType) || WorkflowType.GENERAL
          )
        })
    } else {
      // Not on a project page, use user's primary workflow
      setWorkflowType(
        (user?.primaryWorkflowType as WorkflowType) || WorkflowType.GENERAL
      )
    }
  }, [params, user?.primaryWorkflowType])

  const getTerm = (key: keyof TerminologyMap): string => {
    return getTermFromLib(workflowType, key)
  }

  return {
    getTerm,
    workflowType,
    terminology: getTerminology(workflowType),
    isContextAware: true, // Indicates terminology is context-aware
  }
}

/**
 * Fetch workflow type for a specific project
 */
async function fetchProjectWorkflow(
  projectId: string
): Promise<WorkflowType | null> {
  try {
    const response = await fetch(`/api/projects/${projectId}/workflow`)
    if (response.ok) {
      const data = await response.json()
      return (data.workflowType as WorkflowType) || null
    }
  } catch (error) {
    console.error('Error fetching project workflow:', error)
  }
  return null
}

