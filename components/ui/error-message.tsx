/**
 * Enhanced Error Message Component
 * Provides user-friendly error messages with helpful actions
 */

'use client'

import { AlertCircle, RefreshCw, X } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ErrorMessageProps {
  title?: string
  message: string
  onRetry?: () => void
  onDismiss?: () => void
  variant?: 'default' | 'destructive' | 'warning'
  className?: string
}

export function ErrorMessage({
  title,
  message,
  onRetry,
  onDismiss,
  variant = 'destructive',
  className,
}: ErrorMessageProps) {
  return (
    <Alert variant={variant} className={cn('relative', className)}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        <span>{title || 'Error'}</span>
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            aria-label="Dismiss error"
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </AlertTitle>
      <AlertDescription>
        <div className="flex items-start justify-between gap-4">
          <p>{message}</p>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="shrink-0"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}

