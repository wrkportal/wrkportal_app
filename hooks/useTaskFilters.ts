/**
 * useTaskFilters Hook
 * 
 * Centralized hook for task filtering logic used across all dashboards.
 * Handles status, priority, and due date filtering.
 * 
 * Usage:
 * ```tsx
 * const { filteredTasks, filters, setStatusFilter, setPriorityFilter, setDueDateFilter } = useTaskFilters(tasks)
 * ```
 */

import { useMemo, useState, useCallback } from 'react'

export type TaskStatusFilter = 'ALL' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'BLOCKED' | 'DONE' | 'CANCELLED'
export type TaskPriorityFilter = 'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
export type TaskDueDateFilter = 'ALL' | 'OVERDUE' | 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'NO_DUE_DATE'

export interface Task {
  id: string
  title: string
  status: string
  priority: string
  dueDate?: string | Date | null
  assigneeId?: string
  [key: string]: any
}

export interface UseTaskFiltersReturn {
  filteredTasks: Task[]
  filters: {
    status: TaskStatusFilter
    priority: TaskPriorityFilter
    dueDate: TaskDueDateFilter
  }
  setStatusFilter: (filter: TaskStatusFilter) => void
  setPriorityFilter: (filter: TaskPriorityFilter) => void
  setDueDateFilter: (filter: TaskDueDateFilter) => void
  clearFilters: () => void
  hasActiveFilters: boolean
}

export function useTaskFilters(tasks: Task[]): UseTaskFiltersReturn {
  const [statusFilter, setStatusFilter] = useState<TaskStatusFilter>('ALL')
  const [priorityFilter, setPriorityFilter] = useState<TaskPriorityFilter>('ALL')
  const [dueDateFilter, setDueDateFilter] = useState<TaskDueDateFilter>('ALL')

  const filteredTasks = useMemo(() => {
    let filtered = [...tasks]

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((task) => task.status === statusFilter)
    }

    // Priority filter
    if (priorityFilter !== 'ALL') {
      filtered = filtered.filter((task) => task.priority === priorityFilter)
    }

    // Due date filter
    if (dueDateFilter !== 'ALL') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      filtered = filtered.filter((task) => {
        if (!task.dueDate) {
          return dueDateFilter === 'NO_DUE_DATE'
        }

        const dueDate = new Date(task.dueDate)
        dueDate.setHours(0, 0, 0, 0)

        switch (dueDateFilter) {
          case 'OVERDUE':
            return dueDate < today
          case 'TODAY':
            return dueDate.getTime() === today.getTime()
          case 'THIS_WEEK':
            const weekEnd = new Date(today)
            weekEnd.setDate(weekEnd.getDate() + 7)
            return dueDate >= today && dueDate <= weekEnd
          case 'THIS_MONTH':
            return (
              dueDate.getMonth() === today.getMonth() &&
              dueDate.getFullYear() === today.getFullYear()
            )
          case 'NO_DUE_DATE':
            return false
          default:
            return true
        }
      })
    }

    return filtered
  }, [tasks, statusFilter, priorityFilter, dueDateFilter])

  const clearFilters = useCallback(() => {
    setStatusFilter('ALL')
    setPriorityFilter('ALL')
    setDueDateFilter('ALL')
  }, [])

  const hasActiveFilters = useMemo(
    () => statusFilter !== 'ALL' || priorityFilter !== 'ALL' || dueDateFilter !== 'ALL',
    [statusFilter, priorityFilter, dueDateFilter]
  )

  return {
    filteredTasks,
    filters: {
      status: statusFilter,
      priority: priorityFilter,
      dueDate: dueDateFilter,
    },
    setStatusFilter,
    setPriorityFilter,
    setDueDateFilter,
    clearFilters,
    hasActiveFilters,
  }
}
