'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Play, X, Clock } from 'lucide-react'

interface TimerNotesDialogProps {
    open: boolean
    onClose: () => void
    onSubmit: (notes: string) => void
    taskTitle?: string
}

export function TimerNotesDialog({ open, onClose, onSubmit, taskTitle }: TimerNotesDialogProps) {
    const [notes, setNotes] = useState('')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit(notes)
        setNotes('')
        onClose()
    }

    const handleCancel = () => {
        setNotes('')
        onClose()
    }

    return (
        <Dialog open={open} onOpenChange={handleCancel}>
            <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                <Clock className="h-6 w-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-semibold text-white">Start Timer</DialogTitle>
                                {taskTitle && (
                                    <p className="text-sm text-white/90 mt-1">{taskTitle}</p>
                                )}
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleCancel}
                            className="text-white hover:bg-white/20 rounded-full"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                                What will you be working on? <span className="text-gray-400">(Optional)</span>
                            </label>
                            <Textarea
                                id="notes"
                                placeholder="E.g., Implementing user authentication, fixing navigation bug, code review..."
                                rows={4}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="resize-none focus:ring-2 focus:ring-green-500 border-gray-300"
                                autoFocus
                            />
                            <p className="text-xs text-gray-500 mt-2 flex items-start gap-1">
                                <span className="mt-0.5">💡</span>
                                <span>Add notes to track what you worked on for better time reporting</span>
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancel}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/30"
                        >
                            <Play className="h-4 w-4 mr-2 fill-current" />
                            Start Timer
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

