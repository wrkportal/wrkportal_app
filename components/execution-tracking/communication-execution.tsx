'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

interface CommunicationExecutionProps {
    planningData: any
    executionData: any
    onUpdate: (commId: string, field: string, value: any) => void
}

export function CommunicationExecution({ planningData, executionData, onUpdate }: CommunicationExecutionProps) {
    const communicationItems = planningData?.deliverableDetails?.['4']?.communicationItems || []

    return (
        <div className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
                Track communication compliance • Monitor if stakeholders are being engaged as planned
            </div>
            <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted border-b">
                            <tr>
                                <th className="text-left p-3 font-medium">Stakeholder</th>
                                <th className="text-left p-3 font-medium">Role</th>
                                <th className="text-left p-3 font-medium">Planned Frequency</th>
                                <th className="text-left p-3 font-medium">Actual Frequency</th>
                                <th className="text-left p-3 font-medium">Compliance Status</th>
                                <th className="text-left p-3 font-medium">Last Contact</th>
                                <th className="text-left p-3 font-medium">Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {communicationItems.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center p-8 text-muted-foreground">
                                        No communication plan in planning. Add stakeholders in the Planning tab first.
                                    </td>
                                </tr>
                            ) : (
                                communicationItems.map((comm: any) => (
                                    <tr key={comm.id} className="border-b hover:bg-muted/50">
                                        <td className="p-2 font-medium">{comm.stakeholder}</td>
                                        <td className="p-2 text-sm text-muted-foreground">{comm.role}</td>
                                        <td className="p-2 text-muted-foreground">{comm.frequency}</td>
                                        <td className="p-2">
                                            <Input
                                                value={executionData?.['4']?.items?.find((i: any) => i.id === comm.id)?.actualFrequency || ''}
                                                onChange={(e) => onUpdate(comm.id, 'actualFrequency', e.target.value)}
                                                placeholder="e.g., Weekly"
                                                className="h-8"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <Select
                                                value={executionData?.['4']?.items?.find((i: any) => i.id === comm.id)?.complianceStatus || 'On Track'}
                                                onValueChange={(value) => onUpdate(comm.id, 'complianceStatus', value)}
                                            >
                                                <SelectTrigger className="h-8">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="On Track">
                                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                            On Track
                                                        </Badge>
                                                    </SelectItem>
                                                    <SelectItem value="Delayed">
                                                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                                            Delayed
                                                        </Badge>
                                                    </SelectItem>
                                                    <SelectItem value="At Risk">
                                                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                                            At Risk
                                                        </Badge>
                                                    </SelectItem>
                                                    <SelectItem value="Exceeded">
                                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                            Exceeded
                                                        </Badge>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </td>
                                        <td className="p-2">
                                            <Input
                                                type="date"
                                                value={executionData?.['4']?.items?.find((i: any) => i.id === comm.id)?.lastContact || ''}
                                                onChange={(e) => onUpdate(comm.id, 'lastContact', e.target.value)}
                                                className="h-8"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <Input
                                                value={executionData?.['4']?.items?.find((i: any) => i.id === comm.id)?.notes || ''}
                                                onChange={(e) => onUpdate(comm.id, 'notes', e.target.value)}
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

