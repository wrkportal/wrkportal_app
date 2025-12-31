'use client'

import { Button, ButtonProps } from '@/components/ui/button'
import { useWorkflowTerminology } from '@/hooks/useWorkflowTerminology'
import { forwardRef } from 'react'

interface TerminologyAwareButtonProps extends Omit<ButtonProps, 'children'> {
  action: 'create' | 'view' | 'edit' | 'delete'
  entity: 'project' | 'task' | 'issue' | 'program'
  children?: React.ReactNode
}

/**
 * Example component showing how to use workflow terminology in buttons
 * This is a reference implementation - you can use the hook directly in your components
 */
export const TerminologyAwareButton = forwardRef<HTMLButtonElement, TerminologyAwareButtonProps>(
  ({ action, entity, children, ...props }, ref) => {
    const { getTerm } = useWorkflowTerminology()

    const getButtonText = () => {
      if (children) return children

      const entityTerm = getTerm(entity === 'project' ? 'project' : entity === 'task' ? 'task' : 'issue')
      
      switch (action) {
        case 'create':
          return `Create ${entityTerm}`
        case 'view':
          return `View ${entityTerm}`
        case 'edit':
          return `Edit ${entityTerm}`
        case 'delete':
          return `Delete ${entityTerm}`
        default:
          return children
      }
    }

    return (
      <Button ref={ref} {...props}>
        {getButtonText()}
      </Button>
    )
  }
)

TerminologyAwareButton.displayName = 'TerminologyAwareButton'

