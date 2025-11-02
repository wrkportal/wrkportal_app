'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, X } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

interface KeyResult {
    id: string
    title: string
    description?: string
    targetValue: number
    startValue: number
    currentValue: number
    unit: string
    weight: number
    confidence: number
}

interface GoalDialogProps {
    open: boolean
    onClose: () => void
    onSubmit: (data: any) => void
}

export function GoalDialog({ open, onClose, onSubmit }: GoalDialogProps) {
    const user = useAuthStore((state) => state.user)
    const [users, setUsers] = useState<any[]>([])

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        level: 'TEAM',
        quarter: `Q${Math.floor(new Date().getMonth() / 3) + 1}`,
        year: new Date().getFullYear(),
        ownerId: '',
        status: 'ACTIVE',
    })

    const [keyResults, setKeyResults] = useState<KeyResult[]>([
        {
            id: '1',
            title: '',
            description: '',
            targetValue: 0,
            startValue: 0,
            currentValue: 0,
            unit: '%',
            weight: 25,
            confidence: 5,
        }
    ])

    // Fetch users for owner selection
    useEffect(() => {
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
        if (open) {
            fetchUsers()
            // Set current user as default owner
            if (user) {
                setFormData(prev => ({ ...prev, ownerId: user.id }))
            }
        }
    }, [open, user])

    const addKeyResult = () => {
        setKeyResults([
            ...keyResults,
            {
                id: Date.now().toString(),
                title: '',
                description: '',
                targetValue: 0,
                startValue: 0,
                currentValue: 0,
                unit: '%',
                weight: 25,
                confidence: 5,
            }
        ])
    }

    const removeKeyResult = (id: string) => {
        if (keyResults.length > 1) {
            setKeyResults(keyResults.filter(kr => kr.id !== id))
        }
    }

    const updateKeyResult = (id: string, field: keyof KeyResult, value: any) => {
        setKeyResults(keyResults.map(kr => kr.id === id ? { ...kr, [field]: value } : kr))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit({
            ...formData,
            keyResults: keyResults.map(kr => ({
                title: kr.title,
                description: kr.description,
                startValue: kr.startValue,
                targetValue: kr.targetValue,
                currentValue: kr.currentValue,
                unit: kr.unit,
                weight: kr.weight,
                confidence: kr.confidence,
            })),
        })
        // Reset form
        setFormData({
            title: '',
            description: '',
            level: 'TEAM',
            quarter: `Q${Math.floor(new Date().getMonth() / 3) + 1}`,
            year: new Date().getFullYear(),
            ownerId: user?.id || '',
            status: 'ACTIVE',
        })
        setKeyResults([{
            id: '1',
            title: '',
            description: '',
            targetValue: 0,
            startValue: 0,
            currentValue: 0,
            unit: '%',
            weight: 25,
            confidence: 5,
        }])
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Goal / OKR</DialogTitle>
                    <DialogDescription>
                        Define your objective and key results to track progress.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="title">Objective Title *</Label>
                            <Input
                                id="title"
                                placeholder="e.g., Increase customer satisfaction"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Describe your objective..."
                                rows={2}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="level">Level</Label>
                                <Select
                                    value={formData.level}
                                    onValueChange={(value) => setFormData({ ...formData, level: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="COMPANY">Company</SelectItem>
                                        <SelectItem value="DEPARTMENT">Department</SelectItem>
                                        <SelectItem value="TEAM">Team</SelectItem>
                                        <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="owner">Owner *</Label>
                                <Select
                                    value={formData.ownerId}
                                    onValueChange={(value) => setFormData({ ...formData, ownerId: value })}
                                    required
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select owner" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {users.map((u) => (
                                            <SelectItem key={u.id} value={u.id}>
                                                {u.firstName} {u.lastName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="quarter">Quarter</Label>
                                <Select
                                    value={formData.quarter}
                                    onValueChange={(value) => setFormData({ ...formData, quarter: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Q1">Q1</SelectItem>
                                        <SelectItem value="Q2">Q2</SelectItem>
                                        <SelectItem value="Q3">Q3</SelectItem>
                                        <SelectItem value="Q4">Q4</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="year">Year</Label>
                                <Input
                                    id="year"
                                    type="number"
                                    value={formData.year}
                                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <div className="flex items-center justify-between mb-3">
                                <Label className="text-base font-semibold">Key Results</Label>
                                <Button type="button" variant="outline" size="sm" onClick={addKeyResult}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Key Result
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {keyResults.map((kr, index) => (
                                    <div key={kr.id} className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-800">
                                        <div className="flex items-start gap-3">
                                            <div className="flex-1 space-y-3">
                                                <div>
                                                    <Label className="text-xs">Key Result #{index + 1}</Label>
                                                    <Input
                                                        placeholder="e.g., Achieve NPS score of 50+"
                                                        value={kr.title}
                                                        onChange={(e) => updateKeyResult(kr.id, 'title', e.target.value)}
                                                        required
                                                    />
                                                </div>

                                                <div className="grid grid-cols-4 gap-2">
                                                    <div>
                                                        <Label className="text-xs">Start Value</Label>
                                                        <Input
                                                            type="number"
                                                            value={kr.startValue}
                                                            onChange={(e) => updateKeyResult(kr.id, 'startValue', parseFloat(e.target.value) || 0)}
                                                        />
                                                    </div>

                                                    <div>
                                                        <Label className="text-xs">Current Value</Label>
                                                        <Input
                                                            type="number"
                                                            value={kr.currentValue}
                                                            onChange={(e) => updateKeyResult(kr.id, 'currentValue', parseFloat(e.target.value) || 0)}
                                                        />
                                                    </div>

                                                    <div>
                                                        <Label className="text-xs">Target Value *</Label>
                                                        <Input
                                                            type="number"
                                                            value={kr.targetValue}
                                                            onChange={(e) => updateKeyResult(kr.id, 'targetValue', parseFloat(e.target.value) || 0)}
                                                            required
                                                        />
                                                    </div>

                                                    <div>
                                                        <Label className="text-xs">Unit</Label>
                                                        <Select
                                                            value={kr.unit}
                                                            onValueChange={(value) => updateKeyResult(kr.id, 'unit', value)}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="%">Percentage (%)</SelectItem>
                                                                <SelectItem value="$">Dollar ($)</SelectItem>
                                                                <SelectItem value="#">Number (#)</SelectItem>
                                                                <SelectItem value="pts">Points</SelectItem>
                                                                <SelectItem value="score">Score</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <Label className="text-xs">Weight (%)</Label>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            value={kr.weight}
                                                            onChange={(e) => updateKeyResult(kr.id, 'weight', parseInt(e.target.value) || 25)}
                                                        />
                                                    </div>

                                                    <div>
                                                        <Label className="text-xs">Confidence (1-10)</Label>
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            max="10"
                                                            value={kr.confidence}
                                                            onChange={(e) => updateKeyResult(kr.id, 'confidence', parseInt(e.target.value) || 5)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeKeyResult(kr.id)}
                                                disabled={keyResults.length === 1}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="mt-6">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            Create Goal
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

