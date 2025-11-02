'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UserPlus, Loader2 } from 'lucide-react'

interface AddUserDialogProps {
    open: boolean
    onClose: () => void
    onSuccess: () => void
}

const ROLES = [
    { value: 'TEAM_MEMBER', label: 'Team Member' },
    { value: 'PROJECT_MANAGER', label: 'Project Manager' },
    { value: 'RESOURCE_MANAGER', label: 'Resource Manager' },
    { value: 'PMO_LEAD', label: 'PMO Lead' },
    { value: 'ORG_ADMIN', label: 'Org Admin' },
    { value: 'FINANCE_CONTROLLER', label: 'Finance Controller' },
    { value: 'EXECUTIVE', label: 'Executive' },
    { value: 'CLIENT_STAKEHOLDER', label: 'Client Stakeholder' },
    { value: 'COMPLIANCE_AUDITOR', label: 'Compliance Auditor' },
]

const DEPARTMENTS = [
    { value: 'Engineering', label: 'Engineering' },
    { value: 'Product', label: 'Product' },
    { value: 'Design', label: 'Design' },
    { value: 'Marketing', label: 'Marketing' },
    { value: 'Sales', label: 'Sales' },
    { value: 'Customer Success', label: 'Customer Success' },
    { value: 'Finance', label: 'Finance' },
    { value: 'Human Resources', label: 'Human Resources' },
    { value: 'Operations', label: 'Operations' },
    { value: 'Legal', label: 'Legal' },
    { value: 'IT', label: 'IT' },
    { value: 'Quality Assurance', label: 'Quality Assurance' },
    { value: 'Research & Development', label: 'Research & Development' },
    { value: 'Business Development', label: 'Business Development' },
    { value: 'Executive', label: 'Executive' },
]

export function AddUserDialog({ open, onClose, onSuccess }: AddUserDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [orgUnits, setOrgUnits] = useState<any[]>([])
    const [departmentLeads, setDepartmentLeads] = useState<any[]>([])
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [formData, setFormData] = useState({
        email: '',
        firstName: '',
        lastName: '',
        role: 'TEAM_MEMBER',
        department: '',
        orgUnitId: '',
        reportsToId: '',
        phone: '',
        location: '',
    })

    useEffect(() => {
        if (open) {
            fetchOrgUnits()
            fetchDepartmentLeads()
        }
    }, [open])

    const fetchOrgUnits = async () => {
        try {
            const response = await fetch('/api/organization/org-units')
            if (response.ok) {
                const data = await response.json()
                setOrgUnits(data.orgUnits || [])
            }
        } catch (error) {
            console.error('Error fetching org units:', error)
        }
    }

    const fetchDepartmentLeads = async () => {
        try {
            const response = await fetch('/api/organization/users?leadsOnly=true')
            if (response.ok) {
                const data = await response.json()
                setDepartmentLeads(data.users || [])
            }
        } catch (error) {
            console.error('Error fetching department leads:', error)
        }
    }

    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address'
        }

        // Validate phone format (if provided)
        if (formData.phone) {
            // Allow formats: +1234567890, (123) 456-7890, 123-456-7890, 1234567890
            const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/
            if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
                newErrors.phone = 'Please enter a valid phone number'
            }
        }

        // Validate first name (letters, spaces, hyphens only)
        const nameRegex = /^[a-zA-Z\s\-']+$/
        if (!nameRegex.test(formData.firstName)) {
            newErrors.firstName = 'First name can only contain letters, spaces, hyphens, and apostrophes'
        }

        // Validate last name
        if (!nameRegex.test(formData.lastName)) {
            newErrors.lastName = 'Last name can only contain letters, spaces, hyphens, and apostrophes'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!validateForm()) {
            return
        }

        setIsLoading(true)

        try {
            const response = await fetch('/api/organization/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            if (response.ok) {
                onSuccess()
                resetForm()
                onClose()
            } else {
                const error = await response.json()
                alert(error.error || 'Failed to add user')
            }
        } catch (error) {
            console.error('Error adding user:', error)
            alert('Failed to add user')
        } finally {
            setIsLoading(false)
        }
    }

    const resetForm = () => {
        setFormData({
            email: '',
            firstName: '',
            lastName: '',
            role: 'TEAM_MEMBER',
            department: '',
            orgUnitId: '',
            reportsToId: '',
            phone: '',
            location: '',
        })
        setErrors({})
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-blue-600" />
                        Add New User
                    </DialogTitle>
                    <DialogDescription>
                        Add a new user to your organization. They will receive an invitation email.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="firstName">First Name *</Label>
                            <Input
                                id="firstName"
                                value={formData.firstName}
                                onChange={(e) => {
                                    setFormData({ ...formData, firstName: e.target.value })
                                    if (errors.firstName) setErrors({ ...errors, firstName: '' })
                                }}
                                required
                                className={errors.firstName ? 'border-red-500' : ''}
                            />
                            {errors.firstName && (
                                <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>
                            )}
                        </div>
                        <div>
                            <Label htmlFor="lastName">Last Name *</Label>
                            <Input
                                id="lastName"
                                value={formData.lastName}
                                onChange={(e) => {
                                    setFormData({ ...formData, lastName: e.target.value })
                                    if (errors.lastName) setErrors({ ...errors, lastName: '' })
                                }}
                                required
                                className={errors.lastName ? 'border-red-500' : ''}
                            />
                            {errors.lastName && (
                                <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => {
                                setFormData({ ...formData, email: e.target.value })
                                if (errors.email) setErrors({ ...errors, email: '' })
                            }}
                            required
                            className={errors.email ? 'border-red-500' : ''}
                        />
                        {errors.email && (
                            <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="role">Role *</Label>
                            <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {ROLES.map((role) => (
                                        <SelectItem key={role.value} value={role.value}>
                                            {role.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="department">Department</Label>
                            <Select value={formData.department || undefined} onValueChange={(value) => setFormData({ ...formData, department: value })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select department (optional)" />
                                </SelectTrigger>
                                <SelectContent>
                                    {DEPARTMENTS.map((dept) => (
                                        <SelectItem key={dept.value} value={dept.value}>
                                            {dept.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="reportsTo">Reports To (Manager/Lead)</Label>
                        <Select value={formData.reportsToId || undefined} onValueChange={(value) => setFormData({ ...formData, reportsToId: value === 'NONE' ? '' : value })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select manager (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="NONE">None (Department Lead)</SelectItem>
                                {departmentLeads.map((lead) => (
                                    <SelectItem key={lead.id} value={lead.id}>
                                        {lead.firstName} {lead.lastName} {lead.department ? `- ${lead.department}` : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                            Leave as "None" to make this user a department lead
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="orgUnit">Organizational Unit</Label>
                            <Select value={formData.orgUnitId || undefined} onValueChange={(value) => setFormData({ ...formData, orgUnitId: value })}>
                                <SelectTrigger>
                                    <SelectValue placeholder={orgUnits.length === 0 ? "No units available" : "Select unit (optional)"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {orgUnits.length === 0 ? (
                                        <div className="p-2 text-sm text-muted-foreground text-center">
                                            No organizational units yet
                                        </div>
                                    ) : (
                                        orgUnits.map((unit) => (
                                            <SelectItem key={unit.id} value={unit.id}>
                                                {unit.name}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                            {orgUnits.length === 0 && (
                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                    💡 Create org units from the Organization page first
                                </p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="location">Location</Label>
                            <Input
                                id="location"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                placeholder="E.g., New York, Remote"
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => {
                                setFormData({ ...formData, phone: e.target.value })
                                if (errors.phone) setErrors({ ...errors, phone: '' })
                            }}
                            placeholder="+1 (555) 000-0000"
                            className={errors.phone ? 'border-red-500' : ''}
                        />
                        {errors.phone && (
                            <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                            Accepted formats: +1234567890, (123) 456-7890, 123-456-7890
                        </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Adding...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Add User
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

