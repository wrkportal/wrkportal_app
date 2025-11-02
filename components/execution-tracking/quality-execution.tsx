'use client'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface QualityExecutionProps {
    planningData: any
    executionData: any
    onUpdate: (qualityId: string, field: string, value: any) => void
}

export function QualityExecution({ planningData, executionData, onUpdate }: QualityExecutionProps) {
    const qualityItems = planningData?.deliverableDetails?.['5']?.qualityItems || []

    const calculateAchievement = (target: string, actual: string) => {
        const t = parseFloat(target) || 0
        const a = parseFloat(actual) || 0
        if (t === 0) return 0
        return Math.min(100, (a / t) * 100)
    }

    return (
        <div className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
                Track quality metrics achievement • Compare target standards vs actual results
            </div>
            <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted border-b">
                            <tr>
                                <th className="text-left p-3 font-medium">Quality Metric</th>
                                <th className="text-left p-3 font-medium">Target/Standard</th>
                                <th className="text-left p-3 font-medium">Actual Result</th>
                                <th className="text-left p-3 font-medium">Achievement %</th>
                                <th className="text-left p-3 font-medium">Planned Status</th>
                                <th className="text-left p-3 font-medium">Actual Status</th>
                                <th className="text-left p-3 font-medium">Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {qualityItems.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center p-8 text-muted-foreground">
                                        No quality metrics in planning. Add quality standards in the Planning tab first.
                                    </td>
                                </tr>
                            ) : (
                                qualityItems.map((quality: any) => {
                                    const actualResult = executionData?.['5']?.items?.find((i: any) => i.id === quality.id)?.actualResult || ''
                                    const achievement = calculateAchievement(quality.targetStandard, actualResult)

                                    return (
                                        <tr key={quality.id} className="border-b hover:bg-muted/50">
                                            <td className="p-2 font-medium">{quality.qualityMetric}</td>
                                            <td className="p-2 text-muted-foreground">{quality.targetStandard}</td>
                                            <td className="p-2">
                                                <Input
                                                    value={actualResult}
                                                    onChange={(e) => onUpdate(quality.id, 'actualResult', e.target.value)}
                                                    placeholder="Enter actual"
                                                    className="h-8"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <div className="flex items-center gap-2">
                                                    <Progress value={achievement} className="w-20 h-2" />
                                                    <span className={
                                                        achievement >= 100 ? 'text-green-600 font-medium' :
                                                            achievement >= 80 ? 'text-blue-600 font-medium' :
                                                                achievement >= 60 ? 'text-orange-600 font-medium' :
                                                                    'text-red-600 font-medium'
                                                    }>
                                                        {achievement.toFixed(0)}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-2">
                                                <Badge variant="outline" className={
                                                    quality.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-200' :
                                                        quality.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                            quality.status === 'Failed' ? 'bg-red-50 text-red-700 border-red-200' :
                                                                'bg-gray-50 text-gray-700'
                                                }>
                                                    {quality.status}
                                                </Badge>
                                            </td>
                                            <td className="p-2">
                                                <Select
                                                    value={executionData?.['5']?.items?.find((i: any) => i.id === quality.id)?.actualStatus || quality.status}
                                                    onValueChange={(value) => onUpdate(quality.id, 'actualStatus', value)}
                                                >
                                                    <SelectTrigger className="h-8">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Not Started">Not Started</SelectItem>
                                                        <SelectItem value="In Progress">In Progress</SelectItem>
                                                        <SelectItem value="Completed">Completed</SelectItem>
                                                        <SelectItem value="Failed">Failed</SelectItem>
                                                        <SelectItem value="Exceeded">Exceeded</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </td>
                                            <td className="p-2">
                                                <Input
                                                    value={executionData?.['5']?.items?.find((i: any) => i.id === quality.id)?.notes || ''}
                                                    onChange={(e) => onUpdate(quality.id, 'notes', e.target.value)}
                                                    placeholder="Add notes"
                                                    className="h-8"
                                                />
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

