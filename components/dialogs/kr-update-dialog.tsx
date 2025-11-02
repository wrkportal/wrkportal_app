'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'

interface KRUpdateDialogProps {
    open: boolean
    onClose: () => void
    keyResult: any
    onSubmit: (data: any) => void
}

export function KRUpdateDialog({ open, onClose, keyResult, onSubmit }: KRUpdateDialogProps) {
    const [formData, setFormData] = useState({
        value: 0,
        confidence: 5,
        narrative: '',
    })

    useEffect(() => {
        if (keyResult && open) {
            setFormData({
                value: Number(keyResult.currentValue) || 0,
                confidence: keyResult.confidence || 5,
                narrative: '',
            })
        }
    }, [keyResult, open])

    if (!keyResult) return null

    const progress = ((formData.value - Number(keyResult.startValue)) / (Number(keyResult.targetValue) - Number(keyResult.startValue))) * 100
    const clampedProgress = Math.max(0, Math.min(progress, 100))

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit(formData)
        setFormData({
            value: 0,
            confidence: 5,
            narrative: '',
        })
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Update Key Result Progress</DialogTitle>
                    <DialogDescription>
                        {keyResult.title}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        {/* Current Status */}
                        <div className="rounded-lg border p-4 bg-muted/50">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Current</span>
                                    <span className="font-semibold">
                                        {Number(keyResult.currentValue)} {keyResult.unit}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Target</span>
                                    <span className="font-semibold">
                                        {Number(keyResult.targetValue)} {keyResult.unit}
                                    </span>
                                </div>
                                <Progress value={clampedProgress} className="h-2 mt-2" />
                                <div className="text-xs text-center text-muted-foreground mt-1">
                                    {clampedProgress.toFixed(1)}% complete
                                </div>
                            </div>
                        </div>

                        {/* New Value */}
                        <div>
                            <Label htmlFor="value">New Value *</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="value"
                                    type="number"
                                    step="any"
                                    value={formData.value}
                                    onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                                    required
                                />
                                <span className="text-sm text-muted-foreground min-w-[3ch]">
                                    {keyResult.unit}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Enter the current value for this key result
                            </p>
                        </div>

                        {/* Confidence */}
                        <div>
                            <Label htmlFor="confidence">Confidence Level (1-10) *</Label>
                            <Input
                                id="confidence"
                                type="number"
                                min="1"
                                max="10"
                                value={formData.confidence}
                                onChange={(e) => setFormData({ ...formData, confidence: parseInt(e.target.value) || 5 })}
                                required
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                How confident are you in achieving the target? (1 = Low, 10 = High)
                            </p>
                        </div>

                        {/* Narrative */}
                        <div>
                            <Label htmlFor="narrative">Progress Update (Optional)</Label>
                            <Textarea
                                id="narrative"
                                placeholder="Share what's been done, what's working, and any blockers..."
                                rows={4}
                                value={formData.narrative}
                                onChange={(e) => setFormData({ ...formData, narrative: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Provide context about the progress made
                            </p>
                        </div>

                        {/* Preview */}
                        {formData.value !== Number(keyResult.currentValue) && (
                            <div className="rounded-lg border p-4 bg-primary/5">
                                <h4 className="text-sm font-semibold mb-2">Preview:</h4>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">New Progress</span>
                                        <span className="font-semibold">
                                            {formData.value} / {Number(keyResult.targetValue)} {keyResult.unit}
                                        </span>
                                    </div>
                                    <Progress
                                        value={Math.max(0, Math.min(
                                            ((formData.value - Number(keyResult.startValue)) /
                                                (Number(keyResult.targetValue) - Number(keyResult.startValue))) * 100,
                                            100
                                        ))}
                                        className="h-2"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="mt-6">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            Update Progress
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

