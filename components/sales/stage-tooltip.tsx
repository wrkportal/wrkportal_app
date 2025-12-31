'use client'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Info } from 'lucide-react'
import { pipelineStages, type StageInfo } from './pipeline-stages-guide'

interface StageTooltipProps {
  stage: string
  className?: string
}

export function StageTooltip({ stage, className }: StageTooltipProps) {
  const stageInfo = pipelineStages.find(s => s.stage === stage)

  if (!stageInfo) {
    return null
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={className || "inline-flex items-center justify-center rounded-full hover:bg-muted p-0.5"}
            onClick={(e) => e.stopPropagation()}
          >
            <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
          </button>
        </TooltipTrigger>
        <TooltipContent 
          side="right" 
          className="max-w-sm p-3 bg-popover text-popover-foreground border shadow-lg"
          sideOffset={5}
        >
          <div className="space-y-2">
            <div className="font-semibold text-sm">{stageInfo.name}</div>
            <div className="text-xs text-muted-foreground">{stageInfo.description}</div>
            <div className="pt-2 border-t">
              <div className="text-xs font-medium mb-1">Key Activities:</div>
              <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
                {stageInfo.keyActivities.slice(0, 3).map((activity, idx) => (
                  <li key={idx}>{activity}</li>
                ))}
                {stageInfo.keyActivities.length > 3 && (
                  <li className="text-xs italic">+{stageInfo.keyActivities.length - 3} more...</li>
                )}
              </ul>
            </div>
            <div className="text-xs">
              <span className="font-medium">Probability: </span>
              <span className="text-muted-foreground">{stageInfo.probability}</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

