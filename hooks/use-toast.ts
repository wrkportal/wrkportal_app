import { useState } from 'react'

interface Toast {
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

export function useToast() {
  const [toast, setToast] = useState<Toast | null>(null)

  const showToast = (toastData: Toast) => {
    setToast(toastData)
    // Simple alert for now - can be enhanced with a proper toast component
    if (toastData.variant === 'destructive') {
      alert(`Error: ${toastData.title}\n${toastData.description || ''}`)
    } else {
      alert(`Success: ${toastData.title}\n${toastData.description || ''}`)
    }
    setTimeout(() => setToast(null), 3000)
  }

  return {
    toast: showToast,
  }
}

