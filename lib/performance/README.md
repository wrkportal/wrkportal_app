# Performance Optimization Guide

## Overview

This directory contains utilities for optimizing application performance, including caching, pagination, query optimization, and performance monitoring.

## Features

### 1. Caching (`cache.ts`)

In-memory caching for frequently accessed data.

```typescript
import { getOrSet, cacheKeys, cacheTTL } from '@/lib/performance/cache'

// Cache a database query
const schedules = await getOrSet(
  cacheKeys.schedules(tenantId),
  () => prisma.reportSchedule.findMany({ where: { tenantId } }),
  cacheTTL.medium // 5 minutes
)

// Invalidate cache
invalidateCache(`schedules:${tenantId}`)
```

### 2. Pagination (`pagination.ts`)

Consistent pagination for large datasets.

```typescript
import { parsePaginationParams, createPaginatedResponse } from '@/lib/performance/pagination'

// Parse pagination from request
const params = parsePaginationParams(searchParams)

// Get paginated data
const items = await prisma.model.findMany({
  skip: params.offset,
  take: params.limit,
})

const total = await prisma.model.count()

// Create paginated response
return createPaginatedResponse(items, total, params)
```

### 3. Query Optimization (`query-optimization.ts`)

Optimize database queries for better performance.

```typescript
import { optimizedSelects, measureQuery } from '@/lib/performance/query-optimization'

// Use optimized select
const users = await prisma.user.findMany({
  select: optimizedSelects.userList,
})

// Measure query performance
const result = await measureQuery('users.findMany', () =>
  prisma.user.findMany()
)
```

### 4. Performance Monitoring (`monitoring.ts`)

Track and measure application performance.

```typescript
import { measureApiRoute, getPerformanceStats } from '@/lib/performance/monitoring'

// Measure API route
const response = await measureApiRoute('GET /api/schedules', async () => {
  // ... route handler
})

// Get performance stats
const stats = getPerformanceStats('schedules.findMany')
console.log(`Average query time: ${stats.avg}ms`)
```

## Best Practices

### Database Queries

1. **Use Select Instead of Include**: Select only necessary fields
2. **Paginate Large Results**: Use pagination for lists
3. **Index Frequently Queried Fields**: Add database indexes
4. **Cache Expensive Queries**: Cache queries that don't change often
5. **Batch Operations**: Group multiple operations together

### Caching Strategy

1. **Short TTL for Dynamic Data**: 1-5 minutes
2. **Medium TTL for Semi-Static Data**: 5-30 minutes
3. **Long TTL for Static Data**: 30+ minutes
4. **Invalidate on Updates**: Clear cache when data changes

### Performance Monitoring

1. **Monitor Slow Queries**: Track queries > 1000ms
2. **Set Performance Budgets**: Define acceptable response times
3. **Regular Performance Reviews**: Review stats weekly
4. **Optimize Hot Paths**: Focus on frequently used endpoints

## Performance Targets

- **API Response Time**: < 200ms for cached, < 500ms for uncached
- **Database Query Time**: < 100ms for simple queries, < 500ms for complex
- **Page Load Time**: < 2s for initial load, < 500ms for navigation
- **Cache Hit Rate**: > 80% for frequently accessed data

## Monitoring

View performance metrics:

```typescript
import { getPerformanceStats, getSlowQueries } from '@/lib/performance/monitoring'

// Get all stats
const stats = getPerformanceStats()

// Get slow queries
const slowQueries = getSlowQueries(1000) // Queries > 1 second
```

## Database Indexing

Ensure these indexes exist for optimal performance:

```sql
-- Schedules
CREATE INDEX idx_schedules_tenant_status ON "ReportSchedule"(tenantId, status);
CREATE INDEX idx_schedules_next_run ON "ReportSchedule"(nextRunAt) WHERE isActive = true;

-- Deliveries
CREATE INDEX idx_deliveries_schedule ON "ReportDelivery"(scheduleId);
CREATE INDEX idx_deliveries_status ON "ReportDelivery"(status);

-- Users
CREATE INDEX idx_users_tenant ON "User"(tenantId);
CREATE INDEX idx_users_email ON "User"(email);
```

