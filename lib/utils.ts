import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d)
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(d)
}

export function formatCurrency(
  amount: number,
  currency: string = 'USD'
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}

export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`
}

export function getInitials(firstName: string, lastName?: string): string {
  if (!firstName) return '??'
  if (!lastName) {
    // Single string provided (full name or email)
    const parts = firstName.trim().split(/\s+/)
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase()
    }
    return firstName.substring(0, 2).toUpperCase()
  }
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

export function calculateProgress(current: number, target: number): number {
  if (target === 0) return 0
  return Math.min(Math.round((current / target) * 100), 100)
}

export function getRAGStatusColor(status: 'RED' | 'AMBER' | 'GREEN'): string {
  switch (status) {
    case 'RED':
      return 'text-red-600 bg-red-50'
    case 'AMBER':
      return 'text-amber-600 bg-amber-50'
    case 'GREEN':
      return 'text-green-600 bg-green-50'
  }
}

export function getPriorityColor(
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
): string {
  switch (priority) {
    case 'CRITICAL':
      return 'text-red-600 bg-red-50'
    case 'HIGH':
      return 'text-orange-600 bg-orange-50'
    case 'MEDIUM':
      return 'text-yellow-600 bg-yellow-50'
    case 'LOW':
      return 'text-blue-600 bg-blue-50'
  }
}

export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    COMPLETED: 'text-green-600 bg-green-50',
    IN_PROGRESS: 'text-blue-600 bg-blue-50',
    BLOCKED: 'text-red-600 bg-red-50',
    ON_HOLD: 'text-yellow-600 bg-yellow-50',
    CANCELLED: 'text-gray-600 bg-gray-50',
    TODO: 'text-purple-600 bg-purple-50',
    DONE: 'text-green-600 bg-green-50',
  }
  return statusColors[status] || 'text-gray-600 bg-gray-50'
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const group = String(item[key])
    if (!result[group]) {
      result[group] = []
    }
    result[group].push(item)
    return result
  }, {} as Record<string, T[]>)
}

export function sortBy<T>(
  array: T[],
  key: keyof T,
  direction: 'ASC' | 'DESC' = 'ASC'
): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key]
    const bVal = b[key]
    if (aVal < bVal) return direction === 'ASC' ? -1 : 1
    if (aVal > bVal) return direction === 'ASC' ? 1 : -1
    return 0
  })
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.substring(0, length) + '...'
}
