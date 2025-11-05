import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'

interface DefaultLayoutHook {
  saveAsDefault: (pageKey: string, layoutData: any, targetRole?: string) => Promise<boolean>
  loadDefaultLayout: (pageKey: string) => Promise<any>
  clearDefaultLayout: (pageKey: string, targetRole?: string) => Promise<boolean>
  isLoading: boolean
  error: string | null
}

export function useDefaultLayout(): DefaultLayoutHook {
  const user = useAuthStore((state) => state.user)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const saveAsDefault = async (
    pageKey: string,
    layoutData: any,
    targetRole?: string
  ): Promise<boolean> => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/default-layouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageKey,
          layoutData,
          targetRole,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save default layout')
      }

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error saving default layout:', err)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const loadDefaultLayout = async (pageKey: string): Promise<any> => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams({ pageKey })
      if (user?.role) {
        params.append('role', user.role)
      }

      const response = await fetch(`/api/default-layouts?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to load default layout')
      }

      const data = await response.json()
      return data.defaultLayout?.layoutData || null
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error loading default layout:', err)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const clearDefaultLayout = async (
    pageKey: string,
    targetRole?: string
  ): Promise<boolean> => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams({ pageKey })
      if (targetRole) {
        params.append('targetRole', targetRole)
      }

      const response = await fetch(`/api/default-layouts?${params.toString()}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to clear default layout')
      }

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error clearing default layout:', err)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return {
    saveAsDefault,
    loadDefaultLayout,
    clearDefaultLayout,
    isLoading,
    error,
  }
}

