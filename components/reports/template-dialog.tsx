'use client'

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { X } from "lucide-react"

interface TemplateDialogProps {
    open: boolean
    onClose: () => void
    onSubmit: (data: any) => void
    initialData?: any
}

export function TemplateDialog({ open, onClose, onSubmit, initialData }: TemplateDialogProps) {
    const [name, setName] = useState(initialData?.name || '')
    const [description, setDescription] = useState(initialData?.description || '')
    const [category, setCategory] = useState(initialData?.category || 'project')
    const [frequency, setFrequency] = useState(initialData?.frequency || 'weekly')
    const [metrics, setMetrics] = useState<string[]>(initialData?.metrics || [])
    const [customMetric, setCustomMetric] = useState('')

    const availableMetrics = [
        { id: 'budget', label: 'Budget Utilization' },
        { id: 'progress', label: 'Overall Progress' },
        { id: 'tasks', label: 'Task Completion Rate' },
        { id: 'risks', label: 'Risk Status' },
        { id: 'resources', label: 'Resource Allocation' },
        { id: 'timeline', label: 'Timeline Adherence' },
        { id: 'milestones', label: 'Milestone Achievement' },
        { id: 'team', label: 'Team Performance' },
    ]

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        onSubmit({
            name,
            description,
            category,
            frequency,
            metrics,
            createdAt: initialData?.createdAt || new Date(),
            updatedAt: new Date(),
        })
    }

    const handleMetricToggle = (metricId: string) => {
        setMetrics(prev =>
            prev.includes(metricId)
                ? prev.filter(m => m !== metricId)
                : [...prev, metricId]
        )
    }

    const addCustomMetric = () => {
        if (customMetric && !metrics.includes(customMetric)) {
            setMetrics([...metrics, customMetric])
            setCustomMetric('')
        }
    }

    const removeCustomMetric = (metric: string) => {
        setMetrics(metrics.filter(m => m !== metric))
    }

    const customMetrics = metrics.filter(m => !availableMetrics.some(am => am.id === m))

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{initialData ? 'Edit Template' : 'Create Report Template'}</DialogTitle>
                    <DialogDescription>
                        {initialData ? 'Update your report template' : 'Create a custom report template to reuse across projects'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Template Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Template Name *</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Weekly Executive Summary"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe the purpose of this template..."
                            rows={3}
                        />
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                        <Label htmlFor="category">Report Category *</Label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="project">Project Status</SelectItem>
                                <SelectItem value="program">Program Overview</SelectItem>
                                <SelectItem value="portfolio">Portfolio Summary</SelectItem>
                                <SelectItem value="financial">Financial Report</SelectItem>
                                <SelectItem value="resource">Resource Utilization</SelectItem>
                                <SelectItem value="risk">Risk Assessment</SelectItem>
                                <SelectItem value="executive">Executive Summary</SelectItem>
                                <SelectItem value="custom">Custom Report</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Frequency */}
                    <div className="space-y-2">
                        <Label htmlFor="frequency">Report Frequency *</Label>
                        <Select value={frequency} onValueChange={setFrequency}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="biweekly">Bi-weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="quarterly">Quarterly</SelectItem>
                                <SelectItem value="adhoc">Ad-hoc</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Metrics Selection */}
                    <div className="space-y-3">
                        <Label>Metrics to Include</Label>
                        <div className="grid grid-cols-2 gap-3">
                            {availableMetrics.map((metric) => (
                                <div key={metric.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={metric.id}
                                        checked={metrics.includes(metric.id)}
                                        onCheckedChange={() => handleMetricToggle(metric.id)}
                                    />
                                    <Label
                                        htmlFor={metric.id}
                                        className="text-sm font-normal cursor-pointer"
                                    >
                                        {metric.label}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Custom Metrics */}
                    <div className="space-y-2">
                        <Label htmlFor="customMetric">Add Custom Metric</Label>
                        <div className="flex gap-2">
                            <Input
                                id="customMetric"
                                value={customMetric}
                                onChange={(e) => setCustomMetric(e.target.value)}
                                placeholder="e.g., Customer Satisfaction Score"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault()
                                        addCustomMetric()
                                    }
                                }}
                            />
                            <Button type="button" variant="outline" onClick={addCustomMetric}>
                                Add
                            </Button>
                        </div>

                        {customMetrics.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {customMetrics.map((metric) => (
                                    <div
                                        key={metric}
                                        className="flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full text-sm"
                                    >
                                        <span>{metric}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeCustomMetric(metric)}
                                            className="hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!name || metrics.length === 0}>
                            {initialData ? 'Update Template' : 'Create Template'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

