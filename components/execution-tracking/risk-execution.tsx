'use client'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'

interface RiskExecutionProps {
    planningData: any
    executionData: any
    onUpdate: (riskId: string, field: string, value: any) => void
}

export function RiskExecution({ planningData, executionData, onUpdate }: RiskExecutionProps) {
    const riskItems = planningData?.deliverableDetails?.['3']?.riskItems || []

    return (
        <div className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
                Track risk mitigation progress and update actual impact • Compare planned vs actual risk status
            </div>
            <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted border-b">
                            <tr>
                                <th className="text-left p-3 font-medium">Risk ID</th>
                                <th className="text-left p-3 font-medium">Description</th>
                                <th className="text-left p-3 font-medium">Planned Status</th>
                                <th className="text-left p-3 font-medium">Actual Status</th>
                                <th className="text-left p-3 font-medium">Mitigation Progress</th>
                                <th className="text-left p-3 font-medium">Actual Impact</th>
                                <th className="text-left p-3 font-medium">Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {riskItems.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center p-8 text-muted-foreground">
                                        No risks in planning. Add risks in the Planning tab first.
                                    </td>
                                </tr>
                            ) : (
                                riskItems.map((risk: any) => (
                                    <tr key={risk.id} className="border-b hover:bg-muted/50">
                                        <td className="p-2 font-medium">{risk.riskId}</td>
                                        <td className="p-2 text-sm">{risk.description}</td>
                                        <td className="p-2">
                                            <Badge variant="outline" className={
                                                risk.status === 'Active' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                    risk.status === 'Mitigated' ? 'bg-green-50 text-green-700 border-green-200' :
                                                        'bg-gray-50 text-gray-700'
                                            }>
                                                {risk.status}
                                            </Badge>
                                        </td>
                                        <td className="p-2">
                                            <Select
                                                value={executionData?.['3']?.items?.find((i: any) => i.id === risk.id)?.actualStatus || risk.status}
                                                onValueChange={(value) => onUpdate(risk.id, 'actualStatus', value)}
                                            >
                                                <SelectTrigger className="h-8">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Active">Active</SelectItem>
                                                    <SelectItem value="Mitigated">Mitigated</SelectItem>
                                                    <SelectItem value="Occurred">Occurred</SelectItem>
                                                    <SelectItem value="Closed">Closed</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </td>
                                        <td className="p-2">
                                            <Input
                                                value={executionData?.['3']?.items?.find((i: any) => i.id === risk.id)?.mitigationProgress || ''}
                                                onChange={(e) => onUpdate(risk.id, 'mitigationProgress', e.target.value)}
                                                placeholder="0-100%"
                                                className="h-8 w-24"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <Select
                                                value={executionData?.['3']?.items?.find((i: any) => i.id === risk.id)?.actualImpact || ''}
                                                onValueChange={(value) => onUpdate(risk.id, 'actualImpact', value)}
                                            >
                                                <SelectTrigger className="h-8">
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="None">None</SelectItem>
                                                    <SelectItem value="Low">Low</SelectItem>
                                                    <SelectItem value="Medium">Medium</SelectItem>
                                                    <SelectItem value="High">High</SelectItem>
                                                    <SelectItem value="Critical">Critical</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </td>
                                        <td className="p-2">
                                            <Input
                                                value={executionData?.['3']?.items?.find((i: any) => i.id === risk.id)?.notes || ''}
                                                onChange={(e) => onUpdate(risk.id, 'notes', e.target.value)}
                                                placeholder="Add notes"
                                                className="h-8"
                                            />
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

