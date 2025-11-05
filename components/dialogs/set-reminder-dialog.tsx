'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useAuthStore } from '@/stores/authStore'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface SetReminderDialogProps {
    open: boolean
    onClose: () => void
    messageContent: string
    messageId: string
    onSuccess?: () => void
}

interface OnboardedUser {
    id: string
    name?: string
    firstName?: string
    lastName?: string
    email: string
}

export function SetReminderDialog({
    open,
    onClose,
    messageContent,
    messageId,
    onSuccess,
}: SetReminderDialogProps) {
    const currentUser = useAuthStore((state) => state.user)
    const [loading, setLoading] = useState(false)
    const [users, setUsers] = useState<OnboardedUser[]>([])
    const [activeTab, setActiveTab] = useState<'self' | 'others'>('self')

    const [formData, setFormData] = useState({
        title: '',
        description: messageContent,
        remindAt: '',
        userId: '',
    })

    useEffect(() => {
        if (open) {
            // Reset form with message content
            setFormData({
                title: '',
                description: messageContent,
                remindAt: '',
                userId: currentUser?.id || '',
            })

            // Fetch users for "Remind Others" tab
            const fetchUsers = async () => {
                try {
                    const response = await fetch('/api/users/onboarded')
                    if (response.ok) {
                        const data = await response.json()
                        setUsers(data.users || [])
                    }
                } catch (error) {
                    console.error('Error fetching users:', error)
                }
            }
            fetchUsers()
        }
    }, [open, messageContent, currentUser])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const response = await fetch('/api/reminders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: formData.title,
                    description: formData.description,
                    remindAt: new Date(formData.remindAt).toISOString(),
                    userId: activeTab === 'self' ? currentUser?.id : formData.userId,
                    sourceType: 'MESSAGE',
                    sourceId: messageId,
                }),
            })

            if (response.ok) {
                onSuccess?.()
                onClose()
            } else {
                const error = await response.json()
                alert(`Error: ${error.error || 'Failed to create reminder'}`)
            }
        } catch (error) {
            console.error('Error creating reminder:', error)
            alert('Failed to create reminder')
        } finally {
            setLoading(false)
        }
    }

    const getDisplayName = (user: OnboardedUser) => {
        if (user.firstName && user.lastName) {
            return `${user.firstName} ${user.lastName}`
        }
        return user.name || user.email
    }

    // Get minimum datetime (current time)
    const getMinDateTime = () => {
        const now = new Date()
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
        return now.toISOString().slice(0, 16)
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Set Reminder</DialogTitle>
                    <DialogDescription>
                        Create a reminder based on this message
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'self' | 'others')}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="self">For Myself</TabsTrigger>
                        <TabsTrigger value="others">For Others</TabsTrigger>
                    </TabsList>

                    <TabsContent value="self" className="space-y-4 mt-4">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="title-self">Reminder Title *</Label>
                                <Input
                                    id="title-self"
                                    value={formData.title}
                                    onChange={(e) =>
                                        setFormData({ ...formData, title: e.target.value })
                                    }
                                    placeholder="Enter reminder title"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="description-self">Description</Label>
                                <Textarea
                                    id="description-self"
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({ ...formData, description: e.target.value })
                                    }
                                    placeholder="Reminder details"
                                    rows={3}
                                />
                            </div>

                            <div>
                                <Label htmlFor="remindAt-self">Remind Me At *</Label>
                                <Input
                                    id="remindAt-self"
                                    type="datetime-local"
                                    value={formData.remindAt}
                                    min={getMinDateTime()}
                                    onChange={(e) =>
                                        setFormData({ ...formData, remindAt: e.target.value })
                                    }
                                    required
                                />
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onClose}
                                    disabled={loading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading || !formData.title || !formData.remindAt}
                                >
                                    {loading ? 'Creating...' : 'Set Reminder'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </TabsContent>

                    <TabsContent value="others" className="space-y-4 mt-4">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="userId">Remind Who *</Label>
                                <Select
                                    value={formData.userId}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, userId: value })
                                    }
                                    required
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a team member" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {users
                                            .filter((user) => user.id !== currentUser?.id)
                                            .map((user) => (
                                                <SelectItem key={user.id} value={user.id}>
                                                    {getDisplayName(user)}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="title-others">Reminder Title *</Label>
                                <Input
                                    id="title-others"
                                    value={formData.title}
                                    onChange={(e) =>
                                        setFormData({ ...formData, title: e.target.value })
                                    }
                                    placeholder="Enter reminder title"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="description-others">Description</Label>
                                <Textarea
                                    id="description-others"
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({ ...formData, description: e.target.value })
                                    }
                                    placeholder="Reminder details"
                                    rows={3}
                                />
                            </div>

                            <div>
                                <Label htmlFor="remindAt-others">Remind At *</Label>
                                <Input
                                    id="remindAt-others"
                                    type="datetime-local"
                                    value={formData.remindAt}
                                    min={getMinDateTime()}
                                    onChange={(e) =>
                                        setFormData({ ...formData, remindAt: e.target.value })
                                    }
                                    required
                                />
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onClose}
                                    disabled={loading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={
                                        loading ||
                                        !formData.title ||
                                        !formData.remindAt ||
                                        !formData.userId
                                    }
                                >
                                    {loading ? 'Creating...' : 'Set Reminder'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}

