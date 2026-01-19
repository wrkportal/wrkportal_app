'use client'

import { useState, useEffect } from 'react'

/**
 * Hook for fetching operations dashboard stats
 */
export function useOperationsDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch('/api/operations/dashboard/stats')
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard stats')
        }
        const data = await response.json()
        setStats(data)
      } catch (err) {
        console.error('Error fetching dashboard stats:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch dashboard stats')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return { stats, loading, error, refetch: () => {
    setLoading(true)
    const fetchStats = async () => {
      try {
        setError(null)
        const response = await fetch('/api/operations/dashboard/stats')
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard stats')
        }
        const data = await response.json()
        setStats(data)
      } catch (err) {
        console.error('Error fetching dashboard stats:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch dashboard stats')
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  } }
}

/**
 * Hook for fetching work orders
 */
export function useWorkOrders(filters?: {
  status?: string
  priority?: string
  search?: string
  page?: number
  limit?: number
}) {
  const [workOrders, setWorkOrders] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<any>(null)

  useEffect(() => {
    const fetchWorkOrders = async () => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        if (filters?.status) params.append('status', filters.status)
        if (filters?.priority) params.append('priority', filters.priority)
        if (filters?.search) params.append('search', filters.search)
        if (filters?.page) params.append('page', filters.page.toString())
        if (filters?.limit) params.append('limit', filters.limit.toString())

        const response = await fetch(`/api/operations/work-orders?${params.toString()}`)
        if (!response.ok) {
          throw new Error('Failed to fetch work orders')
        }
        const data = await response.json()
        setWorkOrders(data.workOrders || [])
        setStats(data.stats)
        setPagination(data.pagination)
      } catch (err) {
        console.error('Error fetching work orders:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch work orders')
      } finally {
        setLoading(false)
      }
    }

    fetchWorkOrders()
  }, [filters?.status, filters?.priority, filters?.search, filters?.page, filters?.limit])

  return { workOrders, stats, loading, error, pagination }
}

/**
 * Hook for creating work order
 */
export function useCreateWorkOrder() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createWorkOrder = async (data: any) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/operations/work-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create work order')
      }
      return await response.json()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create work order'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { createWorkOrder, loading, error }
}

/**
 * Hook for updating work order
 */
export function useUpdateWorkOrder() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateWorkOrder = async (id: string, data: any) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/operations/work-orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update work order')
      }
      return await response.json()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update work order'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { updateWorkOrder, loading, error }
}

/**
 * Hook for completing work order
 */
export function useCompleteWorkOrder() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const completeWorkOrder = async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/operations/work-orders/${id}/complete`, {
        method: 'POST',
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to complete work order')
      }
      return await response.json()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete work order'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { completeWorkOrder, loading, error }
}

/**
 * Hook for deleting work order
 */
export function useDeleteWorkOrder() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteWorkOrder = async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/operations/work-orders/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete work order')
      }
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete work order'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { deleteWorkOrder, loading, error }
}

