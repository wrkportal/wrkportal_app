# Scalability Best Practices

## Database Optimization

### 1. Connection Pooling

**Configuration:**
- Set `connection_limit` in DATABASE_URL based on provider limits
- Recommended: 10-20 connections for small-medium apps
- Monitor connection usage and adjust as needed

**Example:**
```
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=5"
```

### 2. Database Indexes

**Critical Indexes to Add:**
```sql
-- Schedules
CREATE INDEX idx_schedules_tenant_status ON "ReportSchedule"(tenantId, status);
CREATE INDEX idx_schedules_next_run ON "ReportSchedule"(nextRunAt) WHERE isActive = true;
CREATE INDEX idx_schedules_tenant_active ON "ReportSchedule"(tenantId, isActive);

-- Deliveries
CREATE INDEX idx_deliveries_schedule ON "ReportDelivery"(scheduleId);
CREATE INDEX idx_deliveries_status ON "ReportDelivery"(status);
CREATE INDEX idx_deliveries_created ON "ReportDelivery"(createdAt DESC);

-- Users
CREATE INDEX idx_users_tenant ON "User"(tenantId);
CREATE INDEX idx_users_email ON "User"(email);
CREATE INDEX idx_users_role ON "User"(role);
```

### 3. Query Optimization

**Best Practices:**
- Use `select` instead of `include` when possible
- Paginate large result sets (limit: 20-100 items per page)
- Use indexes for frequently queried fields
- Cache expensive queries
- Avoid N+1 queries by using `include` strategically

### 4. Caching Strategy

**Cache Layers:**
1. **In-Memory Cache**: For frequently accessed data (1-5 min TTL)
2. **Database Query Cache**: For expensive queries (5-30 min TTL)
3. **CDN Cache**: For static assets and API responses

**Cache Invalidation:**
- Invalidate on data updates
- Use cache keys with versioning
- Implement cache warming for critical data

## API Performance

### 1. Response Time Targets

- **Cached Responses**: < 50ms
- **Simple Queries**: < 200ms
- **Complex Queries**: < 500ms
- **Heavy Operations**: < 2000ms (with progress indicators)

### 2. Pagination

**Always paginate:**
- List endpoints should return paginated results
- Default page size: 20-50 items
- Maximum page size: 100 items
- Include pagination metadata in responses

### 3. Rate Limiting

**Tiers:**
- **Public APIs**: 60 requests/minute
- **Authenticated APIs**: 100 requests/minute
- **Admin APIs**: 200 requests/minute

### 4. Response Compression

- Enable gzip compression for API responses
- Compress large JSON payloads
- Use compression for static assets

## Frontend Optimization

### 1. Code Splitting

- Lazy load routes
- Split large components
- Use dynamic imports for heavy libraries

### 2. Asset Optimization

- Optimize images (WebP format)
- Minify CSS and JavaScript
- Use CDN for static assets
- Implement image lazy loading

### 3. State Management

- Cache API responses in client state
- Use optimistic updates
- Implement proper loading states
- Debounce search and filter inputs

## Monitoring & Observability

### 1. Performance Metrics

Track:
- API response times (p50, p95, p99)
- Database query times
- Cache hit rates
- Error rates
- Request throughput

### 2. Alerts

Set up alerts for:
- Response time > 1 second (p95)
- Error rate > 1%
- Database connection pool exhaustion
- Cache hit rate < 70%

### 3. Logging

- Log slow queries (> 500ms)
- Log errors with context
- Log performance metrics
- Use structured logging

## Scaling Strategies

### Horizontal Scaling

1. **Stateless API Design**
   - No session storage in memory
   - Use external session store (Redis/Database)
   - All instances can handle any request

2. **Database Read Replicas**
   - Use read replicas for read-heavy operations
   - Route reads to replicas
   - Keep writes on primary

3. **CDN for Static Assets**
   - Serve static files from CDN
   - Reduce server load
   - Improve global performance

### Vertical Scaling

1. **Database Resources**
   - Increase database CPU/RAM
   - Optimize database configuration
   - Use connection pooling

2. **Application Server**
   - Increase server resources
   - Optimize application code
   - Use efficient algorithms

## Performance Checklist

### Before Launch
- [ ] Database indexes created
- [ ] Connection pooling configured
- [ ] Caching implemented
- [ ] Pagination on all list endpoints
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] Performance monitoring set up
- [ ] Load testing completed

### Ongoing Optimization
- [ ] Monitor performance metrics weekly
- [ ] Review slow queries monthly
- [ ] Update indexes based on query patterns
- [ ] Adjust cache TTLs based on data freshness needs
- [ ] Optimize hot paths based on usage patterns

## Load Testing

### Recommended Tools
- **k6**: Load testing tool
- **Artillery**: Performance testing
- **Apache Bench**: Simple load testing

### Test Scenarios
1. **Normal Load**: Expected daily traffic
2. **Peak Load**: 2-3x normal traffic
3. **Stress Test**: Find breaking point
4. **Spike Test**: Sudden traffic increase

### Metrics to Track
- Requests per second (RPS)
- Response time percentiles
- Error rate
- Resource utilization (CPU, memory, connections)

