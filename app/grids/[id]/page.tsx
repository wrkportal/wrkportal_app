/**
 * Phase 5.3: Grid Editor - Grid Editor Page
 * 
 * Main grid editing interface
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { GridEditor } from '@/components/grid/GridEditor'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Save, ArrowLeft } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

export default function GridEditorPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null)

  useEffect(() => {
    if ('then' in params) {
      params.then(setResolvedParams)
    } else {
      setResolvedParams(params)
    }
  }, [params])

  if (!resolvedParams) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </Card>
      </div>
    )
  }

  return <GridEditorPageContent params={resolvedParams} />
}

function GridEditorPageContent({ params }: { params: { id: string } }) {
  const router = useRouter()
  const currentUser = useAuthStore((state) => state.user)
  const [grid, setGrid] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [pendingChanges, setPendingChanges] = useState<Map<string, { row: number; column: number; value: string }>>(new Map())

  const isAdmin = currentUser?.role === 'ORG_ADMIN' || 
                 currentUser?.role === 'TENANT_SUPER_ADMIN' || 
                 currentUser?.role === 'PLATFORM_OWNER'

  useEffect(() => {
    fetchGrid()
  }, [params.id])

  const fetchGrid = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/grids/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setGrid(data.grid)
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to load grid')
        if (router) {
          router.push('/grids')
        }
      }
    } catch (error) {
      console.error('Error fetching grid:', error)
      alert('Failed to load grid')
      router.push('/grids')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCellChange = (row: number, column: number, value: string) => {
    const key = `${row}:${column}`
    setPendingChanges(prev => new Map(prev).set(key, { row, column, value }))
  }

  const saveChanges = async () => {
    if (pendingChanges.size === 0) return

    setIsSaving(true)
    try {
      const cells = Array.from(pendingChanges.values()).map(change => ({
        rowIndex: change.row,
        columnIndex: change.column,
        value: change.value,
      }))

      const res = await fetch(`/api/grids/${params.id}/cells`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cells }),
      })

      if (res.ok) {
        setPendingChanges(new Map())
        // Optionally refresh grid data
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to save changes')
      }
    } catch (error) {
      console.error('Error saving cells:', error)
      alert('Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }

  // Auto-save every 5 seconds if there are pending changes
  useEffect(() => {
    if (pendingChanges.size === 0) return

    const timer = setTimeout(() => {
      saveChanges()
    }, 5000)

    return () => clearTimeout(timer)
  }, [pendingChanges.size])

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <div className="p-6 text-center text-muted-foreground">
            You don't have permission to access this page.
          </div>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </Card>
      </div>
    )
  }

  if (!grid) {
    return null
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-background px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (!router) {
                console.error('[GridDetail] Router not available')
                return
              }
              router.push('/grids')
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-semibold">{grid.name}</h1>
            {grid.description && (
              <p className="text-sm text-muted-foreground">{grid.description}</p>
            )}
          </div>
        </div>
        <Button
          onClick={saveChanges}
          disabled={isSaving || pendingChanges.size === 0}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save {pendingChanges.size > 0 && `(${pendingChanges.size})`}
            </>
          )}
        </Button>
      </div>

      {/* Grid Editor */}
      <div className="flex-1 overflow-hidden">
        <GridEditor
          gridId={grid.id}
          initialRows={grid.rowCount}
          initialColumns={grid.columnCount}
          frozenRows={grid.frozenRows}
          frozenColumns={grid.frozenColumns}
          onCellChange={handleCellChange}
        />
      </div>
    </div>
  )
}

