'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { WorkflowSelector } from '@/components/workflows/WorkflowSelector'
import { MethodologySelector } from '@/components/workflows/MethodologySelector'
import { WorkflowType } from '@/lib/workflows/terminology'
import { MethodologyType } from '@/lib/workflows/methodologies'
import { useAuthStore } from '@/stores/authStore'
import { Loader2, CheckCircle2, ArrowRight } from 'lucide-react'
import { getWorkflowConfig } from '@/lib/workflows/config'
import { getMethodologyConfig } from '@/lib/workflows/methodologies'

export default function WorkflowOnboardingPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowType | null>(
    (user?.primaryWorkflowType as WorkflowType) || null
  )
  const [selectedMethodology, setSelectedMethodology] = useState<MethodologyType | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const workflowConfig = selectedWorkflow ? getWorkflowConfig(selectedWorkflow) : null
  const methodologyConfig = selectedMethodology ? getMethodologyConfig(selectedMethodology) : null

  const handleSave = async () => {
    if (!selectedWorkflow || !user) return

    setIsSaving(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          primaryWorkflowType: selectedWorkflow,
          workflowSettings: {
            methodologyType: selectedMethodology,
            onboardingComplete: true,
          },
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setIsComplete(true)
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/projects/dashboard')
        }, 2000)
      } else {
        alert('Failed to save workflow preferences. Please try again.')
      }
    } catch (error) {
      console.error('Error saving workflow:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSkip = () => {
    router.push('/projects/dashboard')
  }

  if (isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto" />
            <h2 className="text-2xl font-bold">Workflow Selected!</h2>
            <p className="text-muted-foreground">
              Your preferences have been saved. Redirecting to dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 p-4">
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Welcome to wrkportal.com
          </h1>
          <p className="text-lg text-muted-foreground">
            Let's customize your experience by selecting your primary workflow
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Your Primary Workflow</CardTitle>
            <CardDescription>
              Choose the workflow that best matches your role. You can change this later in settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WorkflowSelector
              value={selectedWorkflow}
              onChange={setSelectedWorkflow}
              showPreview={true}
            />
          </CardContent>
        </Card>

        {selectedWorkflow && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Select Methodology (Optional)</CardTitle>
              <CardDescription>
                Choose a methodology that aligns with your workflow. This helps customize your boards and views.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MethodologySelector
                workflowType={selectedWorkflow}
                value={selectedMethodology}
                onChange={setSelectedMethodology}
                showPreview={true}
              />
            </CardContent>
          </Card>
        )}

        {workflowConfig && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>What You'll Get</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Terminology</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">Projects → {workflowConfig.name === 'Software Development' ? 'Products' : workflowConfig.name === 'Marketing' ? 'Campaigns' : 'Projects'}</Badge>
                    <Badge variant="outline">Tasks → {workflowConfig.name === 'Software Development' ? 'User Stories' : workflowConfig.name === 'Marketing' ? 'Marketing Activities' : 'Tasks'}</Badge>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Features</h3>
                  <div className="flex flex-wrap gap-2">
                    {workflowConfig.features.slice(0, 5).map((feature: string) => (
                      <Badge key={feature} variant="secondary">{feature}</Badge>
                    ))}
                  </div>
                </div>
                {methodologyConfig && (
                  <div>
                    <h3 className="font-semibold mb-2">Methodology Features</h3>
                    <div className="flex flex-wrap gap-2">
                      {methodologyConfig.features.slice(0, 4).map((feature: string) => (
                        <Badge key={feature} variant="outline">{feature}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={handleSkip}>
            Skip for Now
          </Button>
          <Button
            onClick={handleSave}
            disabled={!selectedWorkflow || isSaving}
            className="gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

