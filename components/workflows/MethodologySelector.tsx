'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  MethodologyType,
  getMethodologyConfig,
  getCompatibleMethodologies,
  methodologyConfigs,
} from '@/lib/workflows/methodologies'
import { WorkflowType } from '@/lib/workflows/terminology'

interface MethodologySelectorProps {
  workflowType: WorkflowType | null
  value?: MethodologyType | null
  onChange: (methodologyType: MethodologyType | null) => void
  showPreview?: boolean
  label?: string
}

export function MethodologySelector({
  workflowType,
  value,
  onChange,
  showPreview = false,
  label = 'Methodology',
}: MethodologySelectorProps) {
  const compatibleMethodologies = workflowType
    ? getCompatibleMethodologies(workflowType)
    : Object.values(methodologyConfigs)

  const selectedMethodology = value || MethodologyType.NONE
  const methodologyConfig = getMethodologyConfig(selectedMethodology)

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="methodology-select">{label}</Label>
        <Select
          value={selectedMethodology}
          onValueChange={(val) => onChange(val === MethodologyType.NONE ? null : (val as MethodologyType))}
          disabled={!workflowType}
        >
          <SelectTrigger id="methodology-select">
            <SelectValue placeholder="Select methodology" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={MethodologyType.NONE}>None (Default)</SelectItem>
            {compatibleMethodologies
              .filter((m) => m.id !== MethodologyType.NONE)
              .map((methodology) => (
                <SelectItem key={methodology.id} value={methodology.id}>
                  {methodology.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        {!workflowType && (
          <p className="text-xs text-muted-foreground">
            Select a workflow first to see compatible methodologies
          </p>
        )}
      </div>

      {showPreview && selectedMethodology !== MethodologyType.NONE && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{methodologyConfig.name}</CardTitle>
            <CardDescription>{methodologyConfig.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium mb-2">Features:</p>
                <div className="flex flex-wrap gap-2">
                  {methodologyConfig.features.slice(0, 4).map((feature: string) => (
                    <Badge key={feature} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Available Views:</p>
                <div className="flex flex-wrap gap-2">
                  {methodologyConfig.views.map((view: string) => (
                    <Badge key={view} variant="outline" className="text-xs">
                      {view}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

