# Developer Guide

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Git

### Setup

```bash
# Clone repository
git clone <repository-url>
cd wrkportal

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Set up database
npx prisma generate
npx prisma db push

# Start development server
npm run dev
```

## Architecture

### Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **State Management**: Zustand
- **UI Components**: Radix UI + Tailwind CSS

### Project Structure

```
app/
  api/              # API routes
  reporting-studio/ # Reporting Studio pages
components/         # React components
lib/
  performance/      # Performance utilities
  security/         # Security utilities
  scheduling/       # Scheduling engine
  export/           # Export engine
  delivery/         # Delivery engine
prisma/
  schema.prisma     # Database schema
```

## API Development

### Creating API Routes

```typescript
// app/api/my-resource/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

export async function GET(request: NextRequest) {
  return withPermissionCheck(
    request,
    { resource: 'my-resource', action: 'READ' },
    async (req, userInfo) => {
      // Your logic here
      return NextResponse.json({ data: [] })
    }
  )
}
```

### Using Pagination

```typescript
import { parsePaginationParams, createPaginatedResponse } from '@/lib/performance/pagination'

const params = parsePaginationParams(searchParams)
const items = await prisma.model.findMany({
  skip: params.offset,
  take: params.limit,
})
const total = await prisma.model.count()

return NextResponse.json(createPaginatedResponse(items, total, params))
```

### Using Caching

```typescript
import { getOrSet, cacheKeys, cacheTTL } from '@/lib/performance/cache'

const data = await getOrSet(
  cacheKeys.myResource(id),
  () => prisma.model.findUnique({ where: { id } }),
  cacheTTL.medium
)
```

### Rate Limiting

Rate limiting is automatically applied via middleware. Configure in `middleware.ts`.

## Database Development

### Schema Changes

1. Edit `prisma/schema.prisma`
2. Run `npx prisma format`
3. Run `npx prisma db push` (dev) or create migration (prod)
4. Run `npx prisma generate`

### Best Practices

- Use indexes for frequently queried fields
- Add `@@index` for composite queries
- Use `select` instead of `include` when possible
- Paginate large result sets
- Use transactions for multi-step operations

### Query Optimization

```typescript
// Good: Select only needed fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    firstName: true,
  },
})

// Good: Use pagination
const items = await prisma.item.findMany({
  skip: 0,
  take: 20,
})

// Good: Use indexes
const schedules = await prisma.reportSchedule.findMany({
  where: {
    tenantId: 'tenant-1',
    status: 'ACTIVE',
  },
  // Uses index on (tenantId, status)
})
```

## Component Development

### Creating Components

```typescript
// components/my-component.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function MyComponent() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <p>Count: {count}</p>
      <Button onClick={() => setCount(count + 1)}>
        Increment
      </Button>
    </div>
  )
}
```

### Using UI Components

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
```

## Security

### Input Validation

```typescript
import { validateInput, validationSchemas } from '@/lib/security/input-validation'

const result = validateInput(
  validationSchemas.email,
  userInput
)

if (!result.success) {
  return NextResponse.json(
    { error: result.error },
    { status: 400 }
  )
}
```

### Permission Checks

```typescript
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

export async function GET(request: NextRequest) {
  return withPermissionCheck(
    request,
    { resource: 'reports', action: 'READ' },
    async (req, userInfo) => {
      // userInfo contains userId, tenantId, email
      // Permission check passed
    }
  )
}
```

## Performance

### Monitoring

```typescript
import { measureQuery, getPerformanceStats } from '@/lib/performance/monitoring'

const result = await measureQuery('users.findMany', () =>
  prisma.user.findMany()
)

// Get stats
const stats = getPerformanceStats('users.findMany')
console.log(`Average: ${stats.avg}ms`)
```

### Caching

```typescript
import { getOrSet, invalidateCache } from '@/lib/performance/cache'

// Get or set cache
const data = await getOrSet(key, fetcher, ttl)

// Invalidate cache
invalidateCache('schedules:tenant-1')
```

## Testing

### Unit Tests

```typescript
// lib/__tests__/my-function.test.ts
import { myFunction } from '@/lib/my-function'

describe('myFunction', () => {
  it('should work correctly', () => {
    expect(myFunction('input')).toBe('output')
  })
})
```

### Integration Tests

```typescript
// __tests__/api/my-route.test.ts
import { GET } from '@/app/api/my-route/route'

describe('/api/my-route', () => {
  it('should return data', async () => {
    const request = new NextRequest('http://localhost:3000/api/my-route')
    const response = await GET(request)
    const data = await response.json()
    expect(data).toBeDefined()
  })
})
```

## Deployment

### Environment Variables

Required variables:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Secret for NextAuth
- `NEXTAUTH_URL`: Application URL

Optional variables:
- `NODE_ENV`: Environment (development/production)
- Integration API keys
- Email configuration

### Build

```bash
npm run build
npm start
```

### Database Migrations

```bash
# Development
npx prisma db push

# Production
npx prisma migrate deploy
```

## Contributing

### Code Style

- Use TypeScript
- Follow ESLint rules
- Use Prettier for formatting
- Write meaningful commit messages

### Pull Request Process

1. Create feature branch
2. Make changes
3. Write tests
4. Update documentation
5. Submit PR with description

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Radix UI](https://www.radix-ui.com/docs)

