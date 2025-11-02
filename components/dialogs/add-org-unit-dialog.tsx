'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building2, Loader2 } from 'lucide-react'

interface AddOrgUnitDialogProps {
    open: boolean
    onClose: () => void
    onSuccess: () => void
}

export function AddOrgUnitDialog({ open, onClose, onSuccess }: AddOrgUnitDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [orgUnits, setOrgUnits] = useState<any[]>([])
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        parentId: null as string | null,
    })

    useEffect(() => {
        if (open) {
            fetchOrgUnits()
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const response = await fetch('/api/organization/org-units', {
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
                alert(error.error || 'Failed to create organizational unit')
            }
        } catch (error) {
            console.error('Error creating org unit:', error)
            alert('Failed to create organizational unit')
        } finally {
            setIsLoading(false)
        }
    }

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            parentId: null,
        })
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-purple-600" />
                        Add Organizational Unit
                    </DialogTitle>
                    <DialogDescription>
                        Create a new department, division, or team in your organization
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="name">Unit Name *</Label>
                        <Input
                            id="name"
                            placeholder="e.g., Engineering, Sales, Marketing"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Brief description of this unit's purpose..."
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div>
                        <Label htmlFor="parent">Parent Unit (Optional)</Label>
                        <Select
                            value={formData.parentId || undefined}
                            onValueChange={(value) => setFormData({ ...formData, parentId: value || null })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={orgUnits.length === 0 ? "None (Root level)" : "Select parent unit (optional)"} />
                            </SelectTrigger>
                            <SelectContent>
                                {orgUnits.length === 0 ? (
                                    <div className="p-2 text-sm text-muted-foreground text-center">
                                        No parent units available - will create as root
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
                        <p className="text-xs text-muted-foreground mt-1">
                            {orgUnits.length === 0
                                ? "This will be a root-level unit (no parent)"
                                : "Leave empty to create a root-level unit"}
                        </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-purple-600 to-blue-600">
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Building2 className="h-4 w-4 mr-2" />
                                    Create Unit
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

