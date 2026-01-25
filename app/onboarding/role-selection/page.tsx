'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore, fetchAuthenticatedUser } from '@/stores/authStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

// Job roles with descriptions and landing pages
const userRoles = [
  {
    value: 'developer',
    label: 'Developer',
    description: 'Software development and coding',
    workflowType: 'SOFTWARE_DEVELOPMENT',
    landingPage: '/projects/dashboard',
  },
  {
    value: 'project-manager',
    label: 'Project Manager',
    description: 'Manage projects and teams',
    workflowType: 'PRODUCT_MANAGEMENT',
    landingPage: '/product-management',
  },
  {
    value: 'human-resources',
    label: 'Human Resources',
    description: 'HR management and employee relations',
    workflowType: 'HUMAN_RESOURCES',
    landingPage: '/projects/dashboard',
  },
  {
    value: 'operations',
    label: 'Operations',
    description: 'Operations management and processes',
    workflowType: 'OPERATIONS',
    landingPage: '/projects/dashboard',
  },
  {
    value: 'it-services',
    label: 'IT Services',
    description: 'IT support and services',
    workflowType: 'IT_SUPPORT',
    landingPage: '/projects/dashboard',
  },
  {
    value: 'finance',
    label: 'Finance',
    description: 'Financial management and accounting',
    workflowType: 'FINANCE',
    landingPage: '/finance-dashboard',
  },
  {
    value: 'sales',
    label: 'Sales',
    description: 'Sales management and pipeline',
    workflowType: 'SALES',
    landingPage: '/projects/dashboard',
  },
  {
    value: 'mis',
    label: 'MIS',
    description: 'Management Information Systems',
    workflowType: 'GENERAL',
    landingPage: '/wrkboard',
  },
]

// Role to workflow type and landing page mapping
const roleMapping: Record<string, { workflowType: string; landingPage: string }> = {
  'developer': {
    workflowType: 'SOFTWARE_DEVELOPMENT',
    landingPage: '/projects/dashboard',
  },
  'project-manager': {
    workflowType: 'PRODUCT_MANAGEMENT',
    landingPage: '/product-management',
  },
  'human-resources': {
    workflowType: 'HUMAN_RESOURCES',
    landingPage: '/projects/dashboard',
  },
  'operations': {
    workflowType: 'OPERATIONS',
    landingPage: '/projects/dashboard',
  },
  'it-services': {
    workflowType: 'IT_SUPPORT',
    landingPage: '/projects/dashboard',
  },
  'finance': {
    workflowType: 'FINANCE',
    landingPage: '/finance-dashboard',
  },
  'sales': {
    workflowType: 'SALES',
    landingPage: '/projects/dashboard',
  },
  'mis': {
    workflowType: 'GENERAL',
    landingPage: '/wrkboard',
  },
}

export default function RoleSelectionPage() {
  console.log('[Role Selection Page] 🎯 Component RENDERED/MOUNTED')

  const router = useRouter()
  const { user, setUser, isHydrated } = useAuthStore()
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  console.log('[Role Selection Page] Initial state:', {
    hasUser: !!user,
    isHydrated,
    isLoading,
    selectedRole
  })

  // Fetch user if not in store
  useEffect(() => {
    const loadUser = async () => {
      console.log('[Role Selection Page] useEffect triggered', { isHydrated, hasUser: !!user })

      if (!isHydrated) {
        console.log('[Role Selection Page] Waiting for hydration...')
        return
      }

      console.log('[Role Selection Page] Loading user...', { hasUser: !!user, isHydrated })

      // Always fetch fresh user data
      const authenticatedUser = await fetchAuthenticatedUser(true)

      if (authenticatedUser) {
        setUser(authenticatedUser)
        console.log('[Role Selection Page] User fetched:', {
          email: authenticatedUser.email,
          primaryWorkflowType: authenticatedUser.primaryWorkflowType,
          primaryWorkflowTypeType: typeof authenticatedUser.primaryWorkflowType,
          landingPage: authenticatedUser.landingPage
        })

        // If user has already selected a role (has primaryWorkflowType), redirect to their landing page
        const hasSelectedRole =
          authenticatedUser.primaryWorkflowType !== null &&
          authenticatedUser.primaryWorkflowType !== undefined

        if (hasSelectedRole) {
          console.log('[Role Selection Page] ✅ User has already selected role, redirecting to landing page')
          router.replace(authenticatedUser.landingPage || '/wrkboard')
          return
        } else {
          console.log('[Role Selection Page] ❌ User has NOT selected role, showing role selection form')
          setIsLoading(false) // Show the form
        }
      } else {
        // Not authenticated, redirect to login
        console.log('[Role Selection Page] No authenticated user, redirecting to login')
        router.replace('/login')
        return
      }
    }

    loadUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated]) // Only depend on isHydrated to avoid infinite loops

  const handleRoleSelection = async (roleValue: string) => {
    const currentUser = user || (await fetchAuthenticatedUser())
    if (!currentUser) {
      router.push('/login')
      return
    }

    setSelectedRole(roleValue)
    setIsSaving(true)

    try {
      const mapping = roleMapping[roleValue]
      if (!mapping) {
        console.error('Invalid role selected')
        setIsSaving(false)
        setSelectedRole(null)
        return
      }

      // Skip role update via organization API - it requires admin permissions
      // The role will remain as assigned during signup, but workflow type and landing page will be set
      // This allows users to select their workflow preference without needing admin rights
      console.log('[Role Selection] Skipping role update via organization API (not required for workflow selection)')

      // Update user profile with workflow type and landing page
      // This marks that the user has selected their role
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          primaryWorkflowType: mapping.workflowType,
          landingPage: mapping.landingPage,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log('[Role Selection] Role selection saved successfully', {
          role: roleValue,
          workflowType: mapping.workflowType,
          landingPage: mapping.landingPage
        })

        // Force refresh user data from API (bypass cache)
        const updatedUser = await fetchAuthenticatedUser(true)
        if (updatedUser) {
          setUser(updatedUser)
          console.log('[Role Selection] User updated in store', {
            email: updatedUser.email,
            primaryWorkflowType: updatedUser.primaryWorkflowType,
            landingPage: updatedUser.landingPage
          })
        }

        // Redirect to landing page using hard navigation to ensure it works
        console.log('[Role Selection] 🚀 Redirecting to landing page:', mapping.landingPage)
        // Use setTimeout to ensure state is saved before redirect
        setTimeout(() => {
          console.log('[Role Selection] Executing redirect now...')
          window.location.href = mapping.landingPage
        }, 200)
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to save role selection', errorData)
        alert('Failed to save your selection. Please try again.')
        setIsSaving(false)
        setSelectedRole(null)
      }
    } catch (error) {
      console.error('Error saving role selection:', error)
      alert('An error occurred. Please try again.')
      setIsSaving(false)
      setSelectedRole(null)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome! 👋</CardTitle>
          <CardDescription className="text-base mt-2">
            To get started, please select your role in the organization.
          </CardDescription>
          {user && (
            <CardDescription className="text-sm mt-1 text-muted-foreground">
              Current role: <span className="font-medium">{user.role}</span>
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {userRoles.map((role) => (
              <Button
                key={role.value}
                variant={selectedRole === role.value ? 'default' : 'outline'}
                className="h-auto p-4 flex flex-col items-start justify-start gap-2 text-left"
                onClick={() => handleRoleSelection(role.value)}
                disabled={isSaving}
              >
                {isSaving && selectedRole === role.value ? (
                  <div className="flex items-center gap-2 w-full">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="font-medium">Setting up...</span>
                  </div>
                ) : (
                  <>
                    <span className="font-medium text-base">{role.label}</span>
                    <span className="text-xs text-muted-foreground">{role.description}</span>
                  </>
                )}
              </Button>
            ))}
          </div>
          {isSaving && (
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Setting up your dashboard...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

