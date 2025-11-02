'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

interface EditUserDialogProps {
    open: boolean
    onClose: () => void
    onSuccess: () => void
    user: {
        id: string
        firstName: string
        lastName: string
        email: string
        role: string
        department?: string
        phone?: string
        location?: string
        status: string
    } | null
}

const ROLES = [
    { value: 'TENANT_SUPER_ADMIN', label: 'Tenant Super Admin' },
    { value: 'ORG_ADMIN', label: 'Organization Admin' },
    { value: 'PMO_LEAD', label: 'PMO Lead' },
    { value: 'PROJECT_MANAGER', label: 'Project Manager' },
    { value: 'TEAM_MEMBER', label: 'Team Member' },
    { value: 'EXECUTIVE', label: 'Executive' },
    { value: 'RESOURCE_MANAGER', label: 'Resource Manager' },
    { value: 'FINANCE_CONTROLLER', label: 'Finance Controller' },
    { value: 'CLIENT_STAKEHOLDER', label: 'Client Stakeholder' },
    { value: 'COMPLIANCE_AUDITOR', label: 'Compliance Auditor' },
    { value: 'INTEGRATION_ADMIN', label: 'Integration Admin' },
]

const STATUSES = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
    { value: 'INVITED', label: 'Invited' },
    { value: 'SUSPENDED', label: 'Suspended' },
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

export function EditUserDialog({ open, onClose, onSuccess, user }: EditUserDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        role: 'TEAM_MEMBER',
        department: '',
        phone: '',
        location: '',
        status: 'ACTIVE',
    })

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                role: user.role || 'TEAM_MEMBER',
                department: user.department || '',
                phone: user.phone || '',
                location: user.location || '',
                status: user.status || 'ACTIVE',
            })
            setErrors({})
        }
    }, [user])

    const validateForm = () => {
        const newErrors: Record<string, string> = {}

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
        if (!user) return

        if (!validateForm()) {
            return
        }

        setIsLoading(true)

        try {
            const response = await fetch(`/api/organization/users/${user.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            })

            if (response.ok) {
                onSuccess()
                onClose()
            } else {
                const error = await response.json()
                alert(error.error || 'Failed to update user')
            }
        } catch (error) {
            console.error('Error updating user:', error)
            alert('Failed to update user. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    if (!user) return null

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Edit User</DialogTitle>
                    <DialogDescription>
                        Update user information, role, and status
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        {/* Basic Info */}
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
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                                disabled
                                className="bg-muted"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Email cannot be changed
                            </p>
                        </div>

                        {/* Role and Status */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="role">Role *</Label>
                                <Select
                                    value={formData.role}
                                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                                >
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
                                <Label htmlFor="status">Status *</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {STATUSES.map((status) => (
                                            <SelectItem key={status.value} value={status.value}>
                                                {status.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Additional Info */}
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

                        <div className="grid grid-cols-2 gap-4">
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
                            <div>
                                <Label htmlFor="location">Location</Label>
                                <Input
                                    id="location"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="e.g., New York, USA"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="mt-6">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

