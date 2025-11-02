'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, X } from 'lucide-react'
import { mockProjects } from '@/lib/mock-data'

interface TimesheetEntry {
    id: string
    projectId: string
    date: string
    hours: number
    description: string
    billable: boolean
}

interface TimesheetDialogProps {
    open: boolean
    onClose: () => void
    onSubmit: (data: any) => void
}

export function TimesheetDialog({ open, onClose, onSubmit }: TimesheetDialogProps) {
    const [entries, setEntries] = useState<TimesheetEntry[]>([
        {
            id: '1',
            projectId: '',
            date: new Date().toISOString().split('T')[0],
            hours: 0,
            description: '',
            billable: true,
        }
    ])

    const addRow = () => {
        setEntries([
            ...entries,
            {
                id: Date.now().toString(),
                projectId: '',
                date: new Date().toISOString().split('T')[0],
                hours: 0,
                description: '',
                billable: true,
            }
        ])
    }

    const removeRow = (id: string) => {
        if (entries.length > 1) {
            setEntries(entries.filter(e => e.id !== id))
        }
    }

    const updateEntry = (id: string, field: keyof TimesheetEntry, value: any) => {
        setEntries(entries.map(e => e.id === id ? { ...e, [field]: value } : e))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0)
        onSubmit({
            entries,
            totalHours,
            weekStartDate: entries[0]?.date || new Date().toISOString(),
            status: 'DRAFT'
        })
        onClose()
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>New Timesheet</DialogTitle>
                    <DialogDescription>
                        Add your time entries for the week. You can add multiple rows for different projects.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        {/* Entries Table */}
                        <div className="border rounded-lg overflow-hidden">
                            <div className="bg-slate-50 dark:bg-slate-800 grid grid-cols-12 gap-2 p-3 text-sm font-semibold">
                                <div className="col-span-3">Project</div>
                                <div className="col-span-2">Date</div>
                                <div className="col-span-1">Hours</div>
                                <div className="col-span-4">Description</div>
                                <div className="col-span-1">Billable</div>
                                <div className="col-span-1"></div>
                            </div>

                            {entries.map((entry) => (
                                <div key={entry.id} className="grid grid-cols-12 gap-2 p-3 border-t items-center">
                                    <div className="col-span-3">
                                        <Select
                                            value={entry.projectId}
                                            onValueChange={(value) => updateEntry(entry.id, 'projectId', value)}
                                            required
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select project" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {mockProjects.map((project) => (
                                                    <SelectItem key={project.id} value={project.id}>
                                                        {project.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="col-span-2">
                                        <Input
                                            type="date"
                                            value={entry.date}
                                            onChange={(e) => updateEntry(entry.id, 'date', e.target.value)}
                                            required
                                            className="[color-scheme:light] dark:[color-scheme:dark]"
                                        />
                                    </div>

                                    <div className="col-span-1">
                                        <Input
                                            type="number"
                                            min="0"
                                            max="24"
                                            step="0.5"
                                            value={entry.hours}
                                            onChange={(e) => updateEntry(entry.id, 'hours', parseFloat(e.target.value) || 0)}
                                            required
                                        />
                                    </div>

                                    <div className="col-span-4">
                                        <Input
                                            type="text"
                                            placeholder="What did you work on?"
                                            value={entry.description}
                                            onChange={(e) => updateEntry(entry.id, 'description', e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="col-span-1 flex justify-center">
                                        <input
                                            type="checkbox"
                                            checked={entry.billable}
                                            onChange={(e) => updateEntry(entry.id, 'billable', e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300"
                                        />
                                    </div>

                                    <div className="col-span-1 flex justify-center">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeRow(entry.id)}
                                            disabled={entries.length === 1}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Button type="button" variant="outline" onClick={addRow} className="w-full">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Row
                        </Button>

                        {/* Summary */}
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold">Total Hours:</span>
                                <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                    {entries.reduce((sum, e) => sum + e.hours, 0)} hours
                                </span>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="mt-6">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            Create Timesheet
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

