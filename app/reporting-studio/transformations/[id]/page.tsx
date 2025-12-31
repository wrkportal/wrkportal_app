/**
 * Phase 5.4: Data Transformation Builder - Editor Page
 * 
 * Visual transformation pipeline builder
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { TransformationBuilder } from '@/components/transformations/TransformationBuilder'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Save, ArrowLeft, Play, Eye } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

export default function TransformationEditorPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentUser = useAuthStore((state) => state.user)
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null)
  const [transformation, setTransformation] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(searchParams?.get('preview') === 'true')

  useEffect(() => {
    if ('then' in params) {
      params.then(setResolvedParams)
    } else {
      setResolvedParams(params)
    }
  }, [params])

  useEffect(() => {
    if (resolvedParams?.id) {
      fetchTransformation()
    }
  }, [resolvedParams?.id])

  const fetchTransformation = async () => {
    if (!resolvedParams?.id) return
    
    setIsLoading(true)
    try {
      const res = await fetch(`/api/transformations/${resolvedParams.id}`)
      if (res.ok) {
        const data = await res.json()
        setTransformation(data.transformation)
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to load transformation')
        router.push('/reporting-studio/transformations')
      }
    } catch (error) {
      console.error('Error fetching transformation:', error)
      alert('Failed to load transformation')
      router.push('/reporting-studio/transformations')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (pipelineConfig: any, steps: any[]) => {
    setIsSaving(true)
    try {
      // Update transformation with new pipeline config
      const res = await fetch(`/api/transformations/${resolvedParams?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pipelineConfig,
        }),
      })

      if (res.ok) {
        // Update steps
        for (const step of steps) {
          if (step.id) {
            // Update existing step
            await fetch(`/api/transformations/${resolvedParams?.id}/steps/${step.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                stepOrder: step.stepOrder,
                operator: step.operator,
                config: step.config,
                inputStepIds: step.inputStepIds,
              }),
            })
          } else {
            // Create new step
            await fetch(`/api/transformations/${resolvedParams?.id}/steps`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                stepOrder: step.stepOrder,
                operator: step.operator,
                config: step.config,
                inputStepIds: step.inputStepIds,
              }),
            })
          }
        }

        // Refresh transformation data
        fetchTransformation()
        alert('Transformation saved successfully!')
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to save transformation')
      }
    } catch (error) {
      console.error('Error saving transformation:', error)
      alert('Failed to save transformation')
    } finally {
      setIsSaving(false)
    }
  }

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

  if (!transformation) {
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
            onClick={() => router.push('/reporting-studio/transformations')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-semibold">{transformation.name}</h1>
            {transformation.description && (
              <p className="text-sm text-muted-foreground">{transformation.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Hide Preview
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Show Preview
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Transformation Builder */}
      <div className="flex-1 overflow-hidden">
        <TransformationBuilder
          transformation={transformation}
          onSave={handleSave}
          isSaving={isSaving}
          showPreview={showPreview}
        />
      </div>
    </div>
  )
}

