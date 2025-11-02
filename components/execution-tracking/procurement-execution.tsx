'use client'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { differenceInDays, parseISO } from 'date-fns'

interface ProcurementExecutionProps {
    planningData: any
    executionData: any
    onUpdate: (procurementId: string, field: string, value: any) => void
}

export function ProcurementExecution({ planningData, executionData, onUpdate }: ProcurementExecutionProps) {
    const procurementItems = planningData?.deliverableDetails?.['7']?.procurementItems || []

    const calculateCostVariance = (estimated: string, actual: string) => {
        const est = parseFloat(estimated?.replace(/[₹,]/g, '')) || 0
        const act = parseFloat(actual?.replace(/[₹,]/g, '')) || 0
        return act - est
    }

    const calculateDateVariance = (plannedDate: string, actualDate: string) => {
        if (!plannedDate || !actualDate) return 0
        try {
            const planned = parseISO(plannedDate)
            const actual = parseISO(actualDate)
            return differenceInDays(actual, planned)
        } catch {
            return 0
        }
    }

    return (
        <div className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
                Track procurement actuals vs estimates • Monitor delivery dates and contract status
            </div>
            <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted border-b">
                            <tr>
                                <th className="text-left p-3 font-medium">Item/Service</th>
                                <th className="text-left p-3 font-medium">Vendor</th>
                                <th className="text-left p-3 font-medium">Estimated Cost</th>
                                <th className="text-left p-3 font-medium">Actual Cost</th>
                                <th className="text-left p-3 font-medium">Cost Variance</th>
                                <th className="text-left p-3 font-medium">Planned Delivery</th>
                                <th className="text-left p-3 font-medium">Actual Delivery</th>
                                <th className="text-left p-3 font-medium">Date Variance</th>
                                <th className="text-left p-3 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {procurementItems.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="text-center p-8 text-muted-foreground">
                                        No procurement items in planning. Add procurement plans in the Planning tab first.
                                    </td>
                                </tr>
                            ) : (
                                procurementItems.map((procurement: any) => (
                                    <tr key={procurement.id} className="border-b hover:bg-muted/50">
                                        <td className="p-2 font-medium">{procurement.itemService}</td>
                                        <td className="p-2 text-sm text-muted-foreground">{procurement.vendorSupplier}</td>
                                        <td className="p-2 text-muted-foreground">{procurement.estimatedCost}</td>
                                        <td className="p-2">
                                            <Input
                                                value={executionData?.['7']?.items?.find((i: any) => i.id === procurement.id)?.actualCost || ''}
                                                onChange={(e) => onUpdate(procurement.id, 'actualCost', e.target.value)}
                                                placeholder="Actual cost"
                                                className="h-8"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <Badge variant="outline" className={
                                                calculateCostVariance(
                                                    procurement.estimatedCost,
                                                    executionData?.['7']?.items?.find((i: any) => i.id === procurement.id)?.actualCost || '0'
                                                ) > 0
                                                    ? 'bg-red-50 text-red-700 border-red-200'
                                                    : calculateCostVariance(
                                                        procurement.estimatedCost,
                                                        executionData?.['7']?.items?.find((i: any) => i.id === procurement.id)?.actualCost || '0'
                                                    ) < 0
                                                        ? 'bg-green-50 text-green-700 border-green-200'
                                                        : 'bg-gray-50 text-gray-700'
                                            }>
                                                ₹{calculateCostVariance(
                                                    procurement.estimatedCost,
                                                    executionData?.['7']?.items?.find((i: any) => i.id === procurement.id)?.actualCost || '0'
                                                ).toFixed(0)}
                                            </Badge>
                                        </td>
                                        <td className="p-2 text-muted-foreground">{procurement.deliveryDate || '—'}</td>
                                        <td className="p-2">
                                            <Input
                                                type="date"
                                                value={executionData?.['7']?.items?.find((i: any) => i.id === procurement.id)?.actualDelivery || ''}
                                                onChange={(e) => onUpdate(procurement.id, 'actualDelivery', e.target.value)}
                                                className="h-8"
                                            />
                                        </td>
                                        <td className="p-2">
                                            {executionData?.['7']?.items?.find((i: any) => i.id === procurement.id)?.actualDelivery && procurement.deliveryDate ? (
                                                <Badge variant="outline" className={
                                                    calculateDateVariance(
                                                        procurement.deliveryDate,
                                                        executionData?.['7']?.items?.find((i: any) => i.id === procurement.id)?.actualDelivery
                                                    ) > 0
                                                        ? 'bg-red-50 text-red-700 border-red-200'
                                                        : calculateDateVariance(
                                                            procurement.deliveryDate,
                                                            executionData?.['7']?.items?.find((i: any) => i.id === procurement.id)?.actualDelivery
                                                        ) < 0
                                                            ? 'bg-green-50 text-green-700 border-green-200'
                                                            : 'bg-gray-50 text-gray-700'
                                                }>
                                                    {calculateDateVariance(
                                                        procurement.deliveryDate,
                                                        executionData?.['7']?.items?.find((i: any) => i.id === procurement.id)?.actualDelivery
                                                    )} days
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">—</span>
                                            )}
                                        </td>
                                        <td className="p-2">
                                            <Select
                                                value={executionData?.['7']?.items?.find((i: any) => i.id === procurement.id)?.actualStatus || procurement.contractStatus}
                                                onValueChange={(value) => onUpdate(procurement.id, 'actualStatus', value)}
                                            >
                                                <SelectTrigger className="h-8">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Not Started">Not Started</SelectItem>
                                                    <SelectItem value="In Negotiation">In Negotiation</SelectItem>
                                                    <SelectItem value="Approved">Approved</SelectItem>
                                                    <SelectItem value="Ordered">Ordered</SelectItem>
                                                    <SelectItem value="Delivered">Delivered</SelectItem>
                                                    <SelectItem value="Completed">Completed</SelectItem>
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

