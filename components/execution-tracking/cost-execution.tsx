'use client'

import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface CostExecutionProps {
    planningData: any
    executionData: any
    onUpdate: (itemId: string, field: string, value: string) => void
}

export function CostExecution({ planningData, executionData, onUpdate }: CostExecutionProps) {
    const costItems = planningData?.deliverableDetails?.['2']?.costItems || []

    const calculateVariance = (estimated: string, actual: string) => {
        const est = parseFloat(estimated) || 0
        const act = parseFloat(actual) || 0
        return act - est
    }

    const calculatePercentage = (estimated: string, actual: string) => {
        const est = parseFloat(estimated) || 0
        const act = parseFloat(actual) || 0
        if (est === 0) return 0
        return ((act - est) / est) * 100
    }

    return (
        <div className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
                Compare estimated vs actual costs • Add revised budget if needed • Variance auto-calculated
            </div>
            <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted border-b">
                            <tr>
                                <th className="text-left p-3 font-medium">Category</th>
                                <th className="text-left p-3 font-medium">Description</th>
                                <th className="text-left p-3 font-medium">Estimated Cost</th>
                                <th className="text-left p-3 font-medium">Actual Cost</th>
                                <th className="text-left p-3 font-medium">Revised Budget</th>
                                <th className="text-left p-3 font-medium">Variance</th>
                                <th className="text-left p-3 font-medium">% Variance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {costItems.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center p-8 text-muted-foreground">
                                        No cost items in planning. Add costs in the Planning tab first.
                                    </td>
                                </tr>
                            ) : (
                                costItems.map((cost: any) => (
                                    <tr key={cost.id} className="border-b hover:bg-muted/50">
                                        <td className="p-2 font-medium">{cost.category || 'N/A'}</td>
                                        <td className="p-2 text-muted-foreground text-sm">{cost.description || '—'}</td>
                                        <td className="p-2 text-muted-foreground">₹{cost.estimatedCost || '0'}</td>
                                        <td className="p-2">
                                            <Input
                                                value={executionData?.['2']?.items?.find((i: any) => i.id === cost.id)?.actualCost || ''}
                                                onChange={(e) => onUpdate(cost.id, 'actualCost', e.target.value)}
                                                placeholder="Enter actual"
                                                className="h-8"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <Input
                                                value={executionData?.['2']?.items?.find((i: any) => i.id === cost.id)?.revisedBudget || ''}
                                                onChange={(e) => onUpdate(cost.id, 'revisedBudget', e.target.value)}
                                                placeholder="Revised"
                                                className="h-8"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <Badge variant="outline" className={
                                                calculateVariance(cost.estimatedCost, executionData?.['2']?.items?.find((i: any) => i.id === cost.id)?.actualCost || '0') > 0
                                                    ? 'bg-red-50 text-red-700 border-red-200'
                                                    : calculateVariance(cost.estimatedCost, executionData?.['2']?.items?.find((i: any) => i.id === cost.id)?.actualCost || '0') < 0
                                                        ? 'bg-green-50 text-green-700 border-green-200'
                                                        : 'bg-gray-50 text-gray-700'
                                            }>
                                                ₹{calculateVariance(cost.estimatedCost, executionData?.['2']?.items?.find((i: any) => i.id === cost.id)?.actualCost || '0').toFixed(0)}
                                            </Badge>
                                        </td>
                                        <td className="p-2">
                                            <span className={
                                                calculatePercentage(cost.estimatedCost, executionData?.['2']?.items?.find((i: any) => i.id === cost.id)?.actualCost || '0') > 0
                                                    ? 'text-red-600 font-medium'
                                                    : calculatePercentage(cost.estimatedCost, executionData?.['2']?.items?.find((i: any) => i.id === cost.id)?.actualCost || '0') < 0
                                                        ? 'text-green-600 font-medium'
                                                        : 'text-muted-foreground'
                                            }>
                                                {calculatePercentage(cost.estimatedCost, executionData?.['2']?.items?.find((i: any) => i.id === cost.id)?.actualCost || '0').toFixed(1)}%
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

