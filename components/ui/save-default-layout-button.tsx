'use client'

import { useState } from 'react'
import { Save, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useDefaultLayout } from '@/hooks/useDefaultLayout'
import { useAuthStore } from '@/stores/authStore'
import { UserRole } from '@/types'

interface SaveDefaultLayoutButtonProps {
  pageKey: string
  getCurrentLayout: () => any
  onSaveSuccess?: () => void
  className?: string
}

export function SaveDefaultLayoutButton({
  pageKey,
  getCurrentLayout,
  onSaveSuccess,
  className,
}: SaveDefaultLayoutButtonProps) {
  const user = useAuthStore((state) => state.user)
  const { saveAsDefault, isLoading } = useDefaultLayout()
  const [success, setSuccess] = useState(false)

  // Only show for Platform Owners
  if (user?.role !== UserRole.PLATFORM_OWNER) {
    return null
  }

  const handleSave = async (targetRole?: string) => {
    const layoutData = getCurrentLayout()
    const result = await saveAsDefault(pageKey, layoutData, targetRole)

    if (result) {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
      
      // Call the success callback to clear localStorage
      if (onSaveSuccess) {
        onSaveSuccess()
      }
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={className}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : success ? (
            <Check className="h-4 w-4 mr-2 text-green-600" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {success ? 'Saved!' : 'Save as Default'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Save Layout For</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleSave()}>
          All Users (Default)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          By Role:
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleSave(UserRole.PLATFORM_OWNER)}>
          Platform Owners
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSave(UserRole.TENANT_SUPER_ADMIN)}>
          Super Admins
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSave(UserRole.ORG_ADMIN)}>
          Org Admins
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSave(UserRole.PMO_LEAD)}>
          PMO Leads
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSave(UserRole.PROJECT_MANAGER)}>
          Project Managers
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSave(UserRole.TEAM_MEMBER)}>
          Team Members
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

