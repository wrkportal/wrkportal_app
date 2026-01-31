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
import { Checkbox } from '@/components/ui/checkbox'
import { UserPlus, Loader2, CheckCircle2, AlertCircle, ChevronDown, ChevronRight, Shield, Calendar, Lock, Eye, EyeOff } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

interface InviteUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Function definitions with their sub-sections
interface FunctionSection {
  id: string
  label: string
  description?: string
  href: string
}

interface Function {
  id: string
  label: string
  description: string
  icon?: string
  sections: FunctionSection[]
}

const AVAILABLE_FUNCTIONS: Function[] = [
  {
    id: 'finance',
    label: 'Finance',
    description: 'Financial management, budgeting, and accounting',
    sections: [
      { id: 'finance-dashboard', label: 'Dashboard', href: '/finance-dashboard' },
      { id: 'finance-budget', label: 'Budget Management', href: '/workflows/finance/budget' },
      { id: 'finance-revenue', label: 'Revenue Tracking', href: '/workflows/finance/revenue' },
      { id: 'finance-expenses', label: 'Expenses', href: '/workflows/finance/expenses' },
      { id: 'finance-profitability', label: 'Profitability Analysis', href: '/workflows/finance/profitability' },
      { id: 'finance-rate-cards', label: 'Rate Cards', href: '/workflows/finance/rate-cards' },
      { id: 'finance-invoices', label: 'Vendors & Invoices', href: '/workflows/finance/invoices' },
    ],
  },
  {
    id: 'sales',
    label: 'Sales',
    description: 'Sales pipeline, leads, and customer management',
    sections: [
      { id: 'sales-dashboard', label: 'Dashboard', href: '/sales-dashboard' },
      { id: 'sales-leads', label: 'Leads Management', href: '/sales-dashboard/leads' },
      { id: 'sales-accounts', label: 'Accounts', href: '/sales-dashboard/accounts' },
      { id: 'sales-opportunities', label: 'Opportunities', href: '/sales-dashboard/opportunities' },
      { id: 'sales-forecasting', label: 'Forecasting', href: '/sales-dashboard/forecasting' },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    description: 'Operational management and process optimization',
    sections: [
      { id: 'operations-dashboard', label: 'Dashboard', href: '/operations-dashboard' },
      { id: 'operations-resources', label: 'Resource Management', href: '/operations-dashboard/resources' },
      { id: 'operations-kpi', label: 'KPI Tracking', href: '/operations-dashboard/kpi' },
      { id: 'operations-quality', label: 'Quality Management', href: '/operations-dashboard/quality' },
    ],
  },
  {
    id: 'projects',
    label: 'Projects',
    description: 'Project management and delivery',
    sections: [
      { id: 'projects-dashboard', label: 'Project Dashboard', href: '/product-management' },
      { id: 'projects-backlog', label: 'Backlog', href: '/backlog' },
      { id: 'projects-sprints', label: 'Sprints', href: '/sprints' },
      { id: 'projects-releases', label: 'Releases', href: '/releases' },
      { id: 'projects-roadmap', label: 'Roadmap', href: '/roadmap' },
      { id: 'projects-dependencies', label: 'Dependencies', href: '/dependencies' },
    ],
  },
  {
    id: 'developer',
    label: 'Developer',
    description: 'Development tools and integrations',
    sections: [
      { id: 'developer-dashboard', label: 'Dashboard', href: '/developer-dashboard' },
      { id: 'developer-integrations', label: 'Integrations', href: '/developer-dashboard/integrations' },
      { id: 'developer-apis', label: 'API Management', href: '/developer-dashboard/apis' },
    ],
  },
  {
    id: 'it-services',
    label: 'IT Services',
    description: 'IT support and service management',
    sections: [
      { id: 'it-dashboard', label: 'Dashboard', href: '/it-dashboard' },
      { id: 'it-users', label: 'User Management', href: '/it-dashboard/users' },
      { id: 'it-tickets', label: 'Ticket Management', href: '/it-dashboard/tickets' },
    ],
  },
  {
    id: 'customer-service',
    label: 'Customer Service',
    description: 'Customer support and service management',
    sections: [
      { id: 'customer-service-dashboard', label: 'Dashboard', href: '/customer-service-dashboard' },
      { id: 'customer-service-tickets', label: 'Support Tickets', href: '/customer-service-dashboard/tickets' },
      { id: 'customer-service-analytics', label: 'Analytics', href: '/customer-service-dashboard/analytics' },
    ],
  },
  {
    id: 'recruitment',
    label: 'Recruitment',
    description: 'Talent acquisition and HR management',
    sections: [
      { id: 'recruitment-dashboard', label: 'Dashboard', href: '/recruitment-dashboard' },
      { id: 'recruitment-candidates', label: 'Candidates', href: '/recruitment-dashboard/candidates' },
      { id: 'recruitment-jobs', label: 'Job Postings', href: '/recruitment-dashboard/jobs' },
    ],
  },
]

type AccessLevel = 'read' | 'read-write' | 'full'
type DataScope = 'all' | 'department' | 'project' | 'custom'

interface SelectedFunction {
  functionId: string
  sections: string[]
  accessLevel: AccessLevel
}

interface InviteFormData {
  email: string
  selectedFunctions: Record<string, SelectedFunction>
  accessLevel: AccessLevel
  dataScope: DataScope
  dataScopeValue?: string
  accessExpiresAt?: string
  requireMFA: boolean
  ipRestrictions?: string[]
  enableAuditLog: boolean
  role: string
}

export function InviteUserModal({ open, onOpenChange }: InviteUserModalProps) {
  const user = useAuthStore((state) => state.user)
  const [formData, setFormData] = useState<InviteFormData>({
    email: '',
    selectedFunctions: {},
    accessLevel: 'read',
    dataScope: 'all',
    requireMFA: false,
    enableAuditLog: true,
    role: '',
  })
  const [expandedFunctions, setExpandedFunctions] = useState<Set<string>>(new Set())
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
        console.error('Failed to fetch workspace type:', err)
      }
    }
    if (open) {
      fetchWorkspaceType()
    }
  }, [open])

  const availableRoles = getAvailableRoles(workspaceType)

  // Set default role if not selected
  useEffect(() => {
    if (!formData.role && availableRoles.length > 0) {
      setFormData(prev => ({ ...prev, role: availableRoles[availableRoles.length - 1].value }))
    }
  }, [availableRoles, formData.role])

  const toggleFunction = (functionId: string) => {
    setFormData(prev => {
      const newFunctions = { ...prev.selectedFunctions }
      if (newFunctions[functionId]) {
        delete newFunctions[functionId]
      } else {
        newFunctions[functionId] = {
          functionId,
          sections: [], // Start with no sections selected
          accessLevel: prev.accessLevel,
        }
      }
      return { ...prev, selectedFunctions: newFunctions }
    })
  }

  const toggleFunctionSection = (functionId: string, sectionId: string) => {
    setFormData(prev => {
      const newFunctions = { ...prev.selectedFunctions }
      if (!newFunctions[functionId]) {
        newFunctions[functionId] = {
          functionId,
          sections: [],
          accessLevel: prev.accessLevel,
        }
      }
      const func = newFunctions[functionId]
      if (func.sections.includes(sectionId)) {
        func.sections = func.sections.filter(id => id !== sectionId)
      } else {
        func.sections = [...func.sections, sectionId]
      }
      return { ...prev, selectedFunctions: newFunctions }
    })
  }

  const selectAllSections = (functionId: string) => {
    const func = AVAILABLE_FUNCTIONS.find(f => f.id === functionId)
    if (!func) return

    setFormData(prev => {
      const newFunctions = { ...prev.selectedFunctions }
      if (!newFunctions[functionId]) {
        newFunctions[functionId] = {
          functionId,
          sections: [],
          accessLevel: prev.accessLevel,
        }
      }
      newFunctions[functionId].sections = func.sections.map(s => s.id)
      return { ...prev, selectedFunctions: newFunctions }
    })
  }

  const clearAllSections = (functionId: string) => {
    setFormData(prev => {
      const newFunctions = { ...prev.selectedFunctions }
      if (newFunctions[functionId]) {
        newFunctions[functionId].sections = []
      }
      return { ...prev, selectedFunctions: newFunctions }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Build allowed sections array from selected functions
      const allowedSections: string[] = []
      Object.values(formData.selectedFunctions).forEach(func => {
        if (func.sections.length > 0) {
          // Add function label as prefix for clarity
          const functionLabel = AVAILABLE_FUNCTIONS.find(f => f.id === func.functionId)?.label || func.functionId
          func.sections.forEach(sectionId => {
            const section = AVAILABLE_FUNCTIONS
              .find(f => f.id === func.functionId)
              ?.sections.find(s => s.id === sectionId)
            if (section) {
              allowedSections.push(`${functionLabel}:${section.label}`)
            }
          })
        }
      })

      const payload: any = {
        email: formData.email,
        role: formData.role,
        allowedSections: allowedSections.length > 0 ? allowedSections : null,
        accessLevel: formData.accessLevel,
        dataScope: formData.dataScope,
        dataScopeValue: formData.dataScopeValue,
        accessExpiresAt: formData.accessExpiresAt,
        requireMFA: formData.requireMFA,
        enableAuditLog: formData.enableAuditLog,
        functionAccess: formData.selectedFunctions, // Store detailed function access
      }

      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle 503 Service Unavailable (table doesn't exist)
        if (response.status === 503) {
          throw new Error(
            data.error || 
            'The invitation system is currently unavailable. This feature requires database setup. Please contact your administrator.'
          )
        }
        throw new Error(data.error || 'Failed to send invitation')
      }

      setSuccess(true)
      // Reset form
      setFormData({
        email: '',
        selectedFunctions: {},
        accessLevel: 'read',
        dataScope: 'all',
        requireMFA: false,
        enableAuditLog: true,
        role: availableRoles[availableRoles.length - 1]?.value || '',
      })
      setExpandedFunctions(new Set())

      // Close modal after a short delay
      setTimeout(() => {
        onOpenChange(false)
        setSuccess(false)
      }, 2000)
    } catch (err: any) {
      // Extract error message from response if available
      const errorMessage = err.message || 'Failed to send invitation'
      setError(errorMessage)
      console.error('Error sending invitation:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false)
      setFormData({
        email: '',
        selectedFunctions: {},
        accessLevel: 'read',
        dataScope: 'all',
        requireMFA: false,
        enableAuditLog: true,
        role: '',
      })
      setExpandedFunctions(new Set())
      setError(null)
      setSuccess(false)
    }
  }

  const selectedSectionsCount = Object.values(formData.selectedFunctions).reduce(
    (sum, func) => sum + func.sections.length,
    0
  )

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite User - Configure Access
          </DialogTitle>
          <DialogDescription>
            Set up granular access control for the invited user with function and section-level permissions.
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

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@example.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
                disabled={loading || success}
              />
            </div>

            {/* Function Selection */}
            <div className="space-y-2">
              <Label className="text-sm">Functions & Sections (Optional - leave empty for full access)</Label>
              <div className="text-xs text-muted-foreground mb-2">
                Select functions and specific sections within each function. Expand to see sub-sections. If no sections are selected, the user will have full access.
              </div>
              <div className="border rounded-md max-h-64 overflow-y-auto p-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                {AVAILABLE_FUNCTIONS.map((func) => {
                  const isSelected = !!formData.selectedFunctions[func.id]
                  const selectedSections = formData.selectedFunctions[func.id]?.sections || []
                  const allSectionsSelected = selectedSections.length === func.sections.length
                  const isExpanded = expandedFunctions.has(func.id)

                  return (
                    <div key={func.id} className="border rounded p-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 flex-1">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleFunction(func.id)}
                            disabled={loading || success}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setExpandedFunctions(prev => {
                                const newSet = new Set(prev)
                                if (newSet.has(func.id)) {
                                  newSet.delete(func.id)
                                } else {
                                  newSet.add(func.id)
                                }
                                return newSet
                              })
                            }}
                            className="flex items-center space-x-1 text-xs font-medium hover:text-primary"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <span>{func.label}</span>
                          </button>
                          {isSelected && (
                            <Badge variant="secondary" className="text-[10px]">
                              {selectedSections.length}/{func.sections.length} sections
                            </Badge>
                          )}
                        </div>
                        {isSelected && isExpanded && (
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-[10px]"
                              onClick={() => selectAllSections(func.id)}
                              disabled={allSectionsSelected}
                            >
                              Select All
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-[10px]"
                              onClick={() => clearAllSections(func.id)}
                              disabled={selectedSections.length === 0}
                            >
                              Clear
                            </Button>
                          </div>
                        )}
                      </div>
                      {isExpanded && (
                        <div className="mt-2 ml-6 grid grid-cols-1 sm:grid-cols-2 gap-1">
                          {func.sections.map((section) => (
                            <label
                              key={section.id}
                              className="flex items-center space-x-2 p-1 rounded hover:bg-muted cursor-pointer text-xs"
                            >
                              <Checkbox
                                checked={selectedSections.includes(section.id)}
                                onCheckedChange={() => toggleFunctionSection(func.id, section.id)}
                                disabled={loading || success || !isSelected}
                              />
                              <span>{section.label}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              {selectedSectionsCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedSectionsCount} section(s) selected across {Object.keys(formData.selectedFunctions).length} function(s)
                </p>
              )}
            </div>

            {/* Access Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="accessLevel" className="text-sm">Default Access Level</Label>
                <Select
                  value={formData.accessLevel}
                  onValueChange={(value: AccessLevel) => setFormData(prev => ({ ...prev, accessLevel: value }))}
                  disabled={loading || success}
                >
                  <SelectTrigger id="accessLevel" className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="read">
                      <div className="flex items-center gap-2 text-xs">
                        <Eye className="h-3.5 w-3.5" />
                        <span>Read Only</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="read-write">
                      <div className="flex items-center gap-2 text-xs">
                        <Eye className="h-3.5 w-3.5" />
                        <span>Read & Write</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="full">
                      <div className="flex items-center gap-2 text-xs">
                        <Shield className="h-3.5 w-3.5" />
                        <span>Full Access</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataScope" className="text-sm">Data Scope</Label>
                <Select
                  value={formData.dataScope}
                  onValueChange={(value: DataScope) => setFormData(prev => ({ ...prev, dataScope: value }))}
                  disabled={loading || success}
                >
                  <SelectTrigger id="dataScope" className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Data</SelectItem>
                    <SelectItem value="department">Department Only</SelectItem>
                    <SelectItem value="project">Project Only</SelectItem>
                    <SelectItem value="custom">Custom Scope</SelectItem>
                  </SelectContent>
                </Select>
                {formData.dataScope !== 'all' && (
                  <Input
                    className="h-8 text-xs"
                    placeholder={formData.dataScope === 'department' ? 'Department name' : formData.dataScope === 'project' ? 'Project ID' : 'Custom scope'}
                    value={formData.dataScopeValue || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, dataScopeValue: e.target.value }))}
                    disabled={loading || success}
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="accessExpiresAt" className="text-sm">Access Expires</Label>
                <Input
                  id="accessExpiresAt"
                  type="datetime-local"
                  className="h-8 text-xs"
                  value={formData.accessExpiresAt || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, accessExpiresAt: e.target.value }))}
                  disabled={loading || success}
                />
              </div>
            </div>

            {/* Security Options */}
            <div className="space-y-3 border rounded-md p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <Label className="font-semibold">Security Settings</Label>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <Checkbox
                    checked={formData.requireMFA}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requireMFA: !!checked }))}
                    disabled={loading || success}
                  />
                  <span className="text-sm">Require Multi-Factor Authentication</span>
                </label>
                
                <label className="flex items-center space-x-2 cursor-pointer">
                  <Checkbox
                    checked={formData.enableAuditLog}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enableAuditLog: !!checked }))}
                    disabled={loading || success}
                  />
                  <span className="text-sm">Enable Audit Logging</span>
                </label>
              </div>
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
            <Button type="submit" disabled={loading || success || !formData.email || !formData.role}>
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
