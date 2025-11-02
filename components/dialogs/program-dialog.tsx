'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface ProgramDialogProps {
    open: boolean
    onClose: () => void
}

export function ProgramDialog({ open, onClose }: ProgramDialogProps) {
    const [users, setUsers] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        ownerId: '',
        budget: '',
        startDate: '',
        endDate: '',
    })

    // Fetch onboarded users for owner selection
    useEffect(() => {
        if (open) {
            fetchUsers()
        }
    }, [open])

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/users/onboarded')
            if (response.ok) {
                const data = await response.json()
                console.log('[Program Dialog] Fetched users:', data.users)
                setUsers(data.users || [])
            } else {
                console.error('[Program Dialog] Failed to fetch users:', response.status)
            }
        } catch (error) {
            console.error('[Program Dialog] Error fetching users:', error)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const response = await fetch('/api/programs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    budget: formData.budget ? parseFloat(formData.budget) : 0,
                }),
            })

            if (response.ok) {
                alert('✅ Program created successfully!')
                onClose()
                setFormData({
                    name: '',
                    code: '',
                    description: '',
                    ownerId: '',
                    budget: '',
                    startDate: '',
                    endDate: '',
                })
            } else {
                const error = await response.json()
                alert(`❌ Error: ${error.error || 'Failed to create program'}`)
            }
        } catch (error) {
            console.error('Error creating program:', error)
            alert('❌ Failed to create program. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Create New Program</DialogTitle>
                    <DialogDescription>
                        Programs group related projects together. Fill in the program details below.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="name">Program Name *</Label>
                                <Input
                                    id="name"
                                    placeholder="Enter program name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="code">Program Code *</Label>
                                <Input
                                    id="code"
                                    placeholder="e.g., PROG-001"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Describe the program objectives..."
                                rows={3}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div>
                            <Label htmlFor="owner">Program Owner *</Label>
                            <Select
                                value={formData.ownerId}
                                onValueChange={(value) => setFormData({ ...formData, ownerId: value })}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={users.length === 0 ? "Loading users..." : "Select owner"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {users.length === 0 ? (
                                        <SelectItem value="no-users" disabled>
                                            No users found
                                        </SelectItem>
                                    ) : (
                                        users.map((user) => (
                                            <SelectItem key={user.id} value={user.id}>
                                                {user.firstName} {user.lastName} ({user.email})
                                                {user.status === 'INVITED' && ' - Invited'}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                            {users.length > 0 && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    {users.length} user{users.length !== 1 ? 's' : ''} available
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="budget">Budget (USD)</Label>
                                <Input
                                    id="budget"
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={formData.budget}
                                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                />
                            </div>

                            <div>
                                <Label htmlFor="startDate">Start Date *</Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    required
                                    className="[color-scheme:light] dark:[color-scheme:dark]"
                                />
                            </div>

                            <div>
                                <Label htmlFor="endDate">End Date *</Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    required
                                    className="[color-scheme:light] dark:[color-scheme:dark]"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="mt-6">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Creating...' : 'Create Program'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

