'use client'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

interface ResourceExecutionProps {
    planningData: any
    executionData: any
    onUpdate: (resourceId: string, field: string, value: any) => void
}

export function ResourceExecution({ planningData, executionData, onUpdate }: ResourceExecutionProps) {
    const resourceItems = planningData?.deliverableDetails?.['6']?.resourceItems || []

    const calculateAllocationVariance = (planned: string, actual: string) => {
        const p = parseFloat(planned?.replace('%', '')) || 0
        const a = parseFloat(actual?.replace('%', '')) || 0
        return a - p
    }

    return (
        <div className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
                Track actual resource allocation vs planned • Monitor utilization and costs
            </div>
            <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted border-b">
                            <tr>
                                <th className="text-left p-3 font-medium">Resource Name</th>
                                <th className="text-left p-3 font-medium">Role</th>
                                <th className="text-left p-3 font-medium">Planned Allocation</th>
                                <th className="text-left p-3 font-medium">Actual Allocation</th>
                                <th className="text-left p-3 font-medium">Variance</th>
                                <th className="text-left p-3 font-medium">Planned Cost</th>
                                <th className="text-left p-3 font-medium">Actual Cost</th>
                                <th className="text-left p-3 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {resourceItems.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center p-8 text-muted-foreground">
                                        No resources in planning. Add resources in the Planning tab first.
                                    </td>
                                </tr>
                            ) : (
                                resourceItems.map((resource: any) => (
                                    <tr key={resource.id} className="border-b hover:bg-muted/50">
                                        <td className="p-2 font-medium">{resource.resourceName}</td>
                                        <td className="p-2 text-sm text-muted-foreground">{resource.role}</td>
                                        <td className="p-2 text-muted-foreground">{resource.allocation}</td>
                                        <td className="p-2">
                                            <Input
                                                value={executionData?.['6']?.items?.find((i: any) => i.id === resource.id)?.actualAllocation || ''}
                                                onChange={(e) => onUpdate(resource.id, 'actualAllocation', e.target.value)}
                                                placeholder="e.g., 100%"
                                                className="h-8 w-24"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <Badge variant="outline" className={
                                                calculateAllocationVariance(
                                                    resource.allocation,
                                                    executionData?.['6']?.items?.find((i: any) => i.id === resource.id)?.actualAllocation || '0'
                                                ) > 0
                                                    ? 'bg-red-50 text-red-700 border-red-200'
                                                    : calculateAllocationVariance(
                                                        resource.allocation,
                                                        executionData?.['6']?.items?.find((i: any) => i.id === resource.id)?.actualAllocation || '0'
                                                    ) < 0
                                                        ? 'bg-green-50 text-green-700 border-green-200'
                                                        : 'bg-gray-50 text-gray-700'
                                            }>
                                                {calculateAllocationVariance(
                                                    resource.allocation,
                                                    executionData?.['6']?.items?.find((i: any) => i.id === resource.id)?.actualAllocation || '0'
                                                ).toFixed(0)}%
                                            </Badge>
                                        </td>
                                        <td className="p-2 text-muted-foreground">{resource.costRate}</td>
                                        <td className="p-2">
                                            <Input
                                                value={executionData?.['6']?.items?.find((i: any) => i.id === resource.id)?.actualCost || ''}
                                                onChange={(e) => onUpdate(resource.id, 'actualCost', e.target.value)}
                                                placeholder="Actual cost"
                                                className="h-8"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <Select
                                                value={executionData?.['6']?.items?.find((i: any) => i.id === resource.id)?.actualStatus || resource.status}
                                                onValueChange={(value) => onUpdate(resource.id, 'actualStatus', value)}
                                            >
                                                <SelectTrigger className="h-8">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Available">Available</SelectItem>
                                                    <SelectItem value="Allocated">Allocated</SelectItem>
                                                    <SelectItem value="Overallocated">Overallocated</SelectItem>
                                                    <SelectItem value="Unavailable">Unavailable</SelectItem>
                                                    <SelectItem value="Released">Released</SelectItem>
                                                </SelectContent>
                                            </Select>
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

