/**
 * Test Utilities
 * Helper functions and components for testing
 */

import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Create a test query client
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  })

// Custom render function with providers
interface AllTheProvidersProps {
  children: React.ReactNode
}

function AllTheProviders({ children }: AllTheProvidersProps) {
  const queryClient = createTestQueryClient()

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Mock data factories
export const createMockUser = (overrides = {}) => ({
  id: 'user-1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  tenantId: 'tenant-1',
  ...overrides,
})

export const createMockSchedule = (overrides = {}) => ({
  id: 'schedule-1',
  name: 'Test Schedule',
  resourceType: 'REPORT',
  resourceId: 'report-1',
  frequency: 'DAILY',
  isActive: true,
  status: 'ACTIVE',
  deliveryChannels: ['EMAIL'],
  recipients: ['test@example.com'],
  tenantId: 'tenant-1',
  createdById: 'user-1',
  ...overrides,
})

export const createMockReport = (overrides = {}) => ({
  id: 'report-1',
  name: 'Test Report',
  description: 'Test description',
  tenantId: 'tenant-1',
  ...overrides,
})

// Wait for async operations
export const waitForAsync = () => new Promise((resolve) => setTimeout(resolve, 0))

