'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { WorkspaceType, UserRole, GroupRole } from '@/types'
import { getAvailableRoles } from '@/lib/permissions'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UserPlus, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface InviteUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Available sections that can be granted access to
const AVAILABLE_SECTIONS = [
  { id: 'Finance', label: 'Finance', href: '/finance-dashboard' },
  { id: 'Sales', label: 'Sales', href: '/sales-dashboard' },
  { id: 'Operations', label: 'Operations', href: '/operations-dashboard' },
  { id: 'Developer', label: 'Developer', href: '/developer-dashboard' },
  { id: 'IT Services', label: 'IT Services', href: '/it-dashboard' },
  { id: 'Customer Service', label: 'Customer Service', href: '/customer-service-dashboard' },
  { id: 'Projects', label: 'Projects', href: '/product-management' },
  { id: 'Recruitment', label: 'Recruitment', href: '/recruitment-dashboard' },
]

export function InviteUserModal({ open, onOpenChange }: InviteUserModalProps) {
  const user = useAuthStore((state) => state.user)
  const [email, setEmail] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [selectedSections, setSelectedSections] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [workspaceType, setWorkspaceType] = useState<WorkspaceType>(WorkspaceType.ORGANIZATION)

  // Fetch workspace type on mount
  useEffect(() => {
    const fetchWorkspaceType = async () => {
      try {
        const response = await fetch('/api/user/workspace-type')
        if (response.ok) {
          const data = await response.json()
          setWorkspaceType(data.type as WorkspaceType)
        }
      } catch (err) {
        // Default to ORGANIZATION if fetch fails
        console.error('Failed to fetch workspace type:', err)
      }
    }
    if (open) {
      fetchWorkspaceType()
    }
  }, [open])

  const availableRoles = getAvailableRoles(workspaceType)

  // Set default role if not selected
  if (!selectedRole && availableRoles.length > 0) {
    setSelectedRole(availableRoles[availableRoles.length - 1].value) // Default to last role (usually Member/Team Member)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const payload: any = { email }

      // Add role based on workspace type
      if (workspaceType === WorkspaceType.ORGANIZATION) {
        payload.role = selectedRole
      } else {
        payload.groupRole = selectedRole
      }

      // Add allowed sections if any are selected
      // If no sections selected, user will have no access (empty array)
      // If all sections selected or none selected, pass null for full access
      if (selectedSections.length > 0 && selectedSections.length < AVAILABLE_SECTIONS.length) {
        payload.allowedSections = selectedSections
      }
      // If no sections selected, pass empty array (no access except wrkboard)
      // If all sections selected, don't pass allowedSections (null = full access)

      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation')
      }

      setSuccess(true)
      setEmail('')
      setSelectedRole(availableRoles[availableRoles.length - 1].value)
      setSelectedSections([])

      // Close modal after a short delay
      setTimeout(() => {
        onOpenChange(false)
        setSuccess(false)
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to send invitation')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false)
      setEmail('')
      setError(null)
      setSuccess(false)
      setSelectedSections([])
    }
  }

  const toggleSection = (sectionId: string) => {
    setSelectedSections(prev => 
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite to {workspaceType === WorkspaceType.ORGANIZATION ? 'Organization' : 'Group'}
          </DialogTitle>
          <DialogDescription>
            {workspaceType === WorkspaceType.ORGANIZATION
              ? 'Send an invitation to add a new member to your organization.'
              : 'Invite someone to collaborate with your group.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-50 text-green-900 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription>Invitation sent successfully!</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading || success}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={selectedRole}
                onValueChange={setSelectedRole}
                disabled={loading || success}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{role.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {role.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Allowed Sections (Optional)</Label>
              <div className="text-xs text-muted-foreground mb-2">
                Select which sections the invited user can access. Leave empty for full access.
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-2">
                {AVAILABLE_SECTIONS.map((section) => (
                  <label
                    key={section.id}
                    className="flex items-center space-x-2 p-2 rounded hover:bg-muted cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSections.includes(section.id)}
                      onChange={() => toggleSection(section.id)}
                      disabled={loading || success}
                      className="rounded"
                    />
                    <span className="text-sm">{section.label}</span>
                  </label>
                ))}
              </div>
              {selectedSections.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  No sections selected = Full access (all sections)
                </p>
              )}
              {selectedSections.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedSections.length} section(s) selected. User will only see these sections.
                </p>
              )}
            </div>

            <div className="rounded-md bg-muted p-3 text-sm">
              <p className="text-muted-foreground">
                💡 The invited user will receive an email with a link to join your{' '}
                {workspaceType === WorkspaceType.ORGANIZATION ? 'organization' : 'group'}. 
                The invitation will expire in 7 days.
                <br />
                <span className="block mt-1 text-amber-600">
                  ⚠️ If the user already has an account, they will have access to your organization's data based on the selected sections.
                </span>
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || success || !email}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Sent!
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

