'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TourStep {
  title: string
  description: string
  targetSelector?: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}

const tourSteps: TourStep[] = [
  {
    title: 'Welcome to wrkportal!',
    description: 'Let us show you around. This quick tour will help you get the most out of the platform.',
  },
  {
    title: 'Sidebar Navigation',
    description: 'Access all your dashboards, projects, and tools from the sidebar. Each department has its own dedicated dashboard.',
    targetSelector: '[data-tour="sidebar"]',
    position: 'right',
  },
  {
    title: 'Command Palette',
    description: 'Press Ctrl+K (or Cmd+K) anytime to quickly navigate, search, or create items. It\'s the fastest way to get around.',
  },
  {
    title: 'AI Assistant',
    description: 'Your AI assistant can analyze data across all modules, generate reports, predict risks, and automate tasks.',
    targetSelector: '[data-tour="ai-assistant"]',
    position: 'bottom',
  },
  {
    title: 'Notifications',
    description: 'Stay on top of tasks, approvals, and updates. Smart notifications prioritize what matters most.',
    targetSelector: '[data-tour="notifications"]',
    position: 'bottom',
  },
  {
    title: 'You\'re all set!',
    description: 'Start by creating your first project or exploring the dashboards. Check the Quick Wins checklist on your dashboard for guided next steps.',
  },
]

export function OnboardingTour() {
  const [isVisible, setIsVisible] = React.useState(false)
  const [currentStep, setCurrentStep] = React.useState(0)

  React.useEffect(() => {
    const completed = localStorage.getItem('wrkportal_onboarding_complete')
    if (!completed) {
      const timer = setTimeout(() => setIsVisible(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep((s) => s + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1)
  }

  const handleComplete = () => {
    localStorage.setItem('wrkportal_onboarding_complete', 'true')
    setIsVisible(false)
  }

  if (!isVisible) return null

  const step = tourSteps[currentStep]
  const isFirst = currentStep === 0
  const isLast = currentStep === tourSteps.length - 1

  return (
    <div className="fixed inset-0 z-[200]">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Tour card */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md px-4">
        <div className="bg-card border rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">
                Step {currentStep + 1} of {tourSteps.length}
              </span>
            </div>
            <button
              onClick={handleComplete}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="px-6 pb-4">
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pb-6">
            <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between px-6 py-4 bg-muted/30 border-t">
            <Button variant="ghost" size="sm" onClick={handleComplete}>
              Skip tour
            </Button>
            <div className="flex items-center gap-2">
              {!isFirst && (
                <Button variant="outline" size="sm" onClick={handlePrev}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              )}
              <Button size="sm" onClick={handleNext}>
                {isLast ? 'Get Started' : 'Next'}
                {!isLast && <ChevronRight className="h-4 w-4 ml-1" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
