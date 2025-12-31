# Testing Setup Guide

## Overview

This document describes the testing infrastructure for the Reporting Platform.

## Testing Framework

- **Unit & Integration Tests**: Jest + React Testing Library
- **E2E Tests**: Playwright
- **Coverage**: Jest Coverage Reports

## Installation

```bash
# Install testing dependencies
npm install --save-dev jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @playwright/test
npm install --save-dev @types/jest ts-node
```

## Running Tests

### Unit Tests
```bash
# Run all tests
npm test

# Run in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### E2E Tests
```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

## Test Structure

```
__tests__/
  ├── api/              # API route tests
  ├── components/       # Component tests
  └── setup/            # Test utilities
lib/
  └── __tests__/        # Utility function tests
e2e/                    # E2E tests
```

## Writing Tests

### Unit Test Example

```typescript
import { render, screen } from '@testing-library/react'
import { MyComponent } from '@/components/MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

### Integration Test Example

```typescript
import { GET } from '@/app/api/my-route/route'

describe('/api/my-route', () => {
  it('should return data', async () => {
    const request = new NextRequest('http://localhost:3000/api/my-route')
    const response = await GET(request)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data).toBeDefined()
  })
})
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test'

test('should navigate to page', async ({ page }) => {
  await page.goto('/my-page')
  await expect(page.locator('h1')).toBeVisible()
})
```

## Coverage Goals

- **Target**: > 80% coverage
- **Branches**: > 70%
- **Functions**: > 70%
- **Lines**: > 70%
- **Statements**: > 70%

## Next Steps

1. Install dependencies: `npm install --save-dev jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @playwright/test @types/jest ts-node`
2. Run initial tests: `npm test`
3. Add more test coverage for critical paths
4. Set up CI/CD pipeline with test automation

