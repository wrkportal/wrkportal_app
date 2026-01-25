'use client'

import type { ReactNode } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { differenceInDays, parseISO } from 'date-fns'

interface WBSExecutionProps {
    planningData: any
    executionData: any
    onUpdate: (taskId: string, field: string, value: any) => void
}

export function WBSExecution({ planningData, executionData, onUpdate }: WBSExecutionProps) {
    const wbsTasks = planningData?.deliverableDetails?.['1']?.wbsTasks || []

    const calculateDateVariance = (plannedEnd: string, actualEnd: string) => {
        if (!plannedEnd || !actualEnd) return 0
        try {
            const planned = parseISO(plannedEnd)
            const actual = parseISO(actualEnd)
            return differenceInDays(actual, planned)
        } catch {
            return 0
        }
    }

    const renderTasks = (tasks: any[], depth = 0): ReactNode => {
        return tasks.map((task) => (
            <>
                <tr key={task.id} className="border-b hover:bg-muted/50">
                    <td className="p-2" style={{ paddingLeft: `${depth * 20 + 12}px` }}>
                        <span className="font-medium">{task.task || task.milestone}</span>
                    </td>
                    <td className="p-2 text-muted-foreground text-sm">{task.start || '—'}</td>
                    <td className="p-2">
                        <Input
                            type="date"
                            value={executionData?.['1']?.items?.find((i: any) => i.id === task.id)?.actualStart || ''}
                            onChange={(e) => onUpdate(task.id, 'actualStart', e.target.value)}
                            className="h-8"
                        />
                    </td>
                    <td className="p-2 text-muted-foreground text-sm">{task.end || '—'}</td>
                    <td className="p-2">
                        <Input
                            type="date"
                            value={executionData?.['1']?.items?.find((i: any) => i.id === task.id)?.actualEnd || ''}
                            onChange={(e) => onUpdate(task.id, 'actualEnd', e.target.value)}
                            className="h-8"
                        />
                    </td>
                    <td className="p-2">
                        <Badge variant="outline" className="bg-gray-50 text-gray-700">
                            {task.status}
                        </Badge>
                    </td>
                    <td className="p-2">
                        <Select
                            value={executionData?.['1']?.items?.find((i: any) => i.id === task.id)?.actualStatus || 'Pending'}
                            onValueChange={(value) => onUpdate(task.id, 'actualStatus', value)}
                        >
                            <SelectTrigger className="h-8">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Done">Done</SelectItem>
                                <SelectItem value="In Progress">In Progress</SelectItem>
                                <SelectItem value="Planned">Planned</SelectItem>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Delayed">Delayed</SelectItem>
                            </SelectContent>
                        </Select>
                    </td>
                    <td className="p-2">
                        {executionData?.['1']?.items?.find((i: any) => i.id === task.id)?.actualEnd && task.end ? (
                            <Badge variant="outline" className={
                                calculateDateVariance(task.end, executionData?.['1']?.items?.find((i: any) => i.id === task.id)?.actualEnd) > 0
                                    ? 'bg-red-50 text-red-700 border-red-200'
                                    : calculateDateVariance(task.end, executionData?.['1']?.items?.find((i: any) => i.id === task.id)?.actualEnd) < 0
                                        ? 'bg-green-50 text-green-700 border-green-200'
                                        : 'bg-gray-50 text-gray-700'
                            }>
                                {calculateDateVariance(task.end, executionData?.['1']?.items?.find((i: any) => i.id === task.id)?.actualEnd)} days
                            </Badge>
                        ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                        )}
                    </td>
                </tr>
                {task.subtasks && task.subtasks.length > 0 && renderTasks(task.subtasks, depth + 1)}
            </>
        ))
    }

    return (
        <div className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
                Track actual task completion dates and status vs planned • Variance shows delays (red) or early completion (green)
            </div>
            <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted border-b">
                            <tr>
                                <th className="text-left p-3 font-medium">Task</th>
                                <th className="text-left p-3 font-medium">Planned Start</th>
                                <th className="text-left p-3 font-medium">Actual Start</th>
                                <th className="text-left p-3 font-medium">Planned End</th>
                                <th className="text-left p-3 font-medium">Actual End</th>
                                <th className="text-left p-3 font-medium">Planned Status</th>
                                <th className="text-left p-3 font-medium">Actual Status</th>
                                <th className="text-left p-3 font-medium">Variance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {wbsTasks.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center p-8 text-muted-foreground">
                                        No WBS tasks in planning. Add tasks in the Planning tab first.
                                    </td>
                                </tr>
                            ) : (
                                renderTasks(wbsTasks)
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

