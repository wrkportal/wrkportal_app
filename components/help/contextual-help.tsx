/**
 * Contextual Help Component
 * Shows help tooltips and contextual information
 */

'use client'

import { HelpCircle } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { HelpDialog } from './help-dialog'

interface ContextualHelpProps {
  content: string
  articleId?: string
  variant?: 'icon' | 'text' | 'both'
}

export function ContextualHelp({ content, articleId, variant = 'icon' }: ContextualHelpProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-1">
            {variant === 'icon' || variant === 'both' ? (
              <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
            ) : null}
            {variant === 'text' || variant === 'both' ? (
              <span className="text-sm text-muted-foreground cursor-help">Help</span>
            ) : null}
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-sm">{content}</p>
          {articleId && (
            <div className="mt-2 pt-2 border-t">
              <HelpDialog />
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

