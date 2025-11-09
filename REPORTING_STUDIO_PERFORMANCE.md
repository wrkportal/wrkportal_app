# Reporting Studio - Performance & Scalability Guide

## Current Architecture

The Database tab loads and processes data entirely on the **client-side** (browser), which has specific performance implications.

## Performance Limits

### Recommended Limits (Optimal Performance)
- **Rows**: Up to **10,000 rows**
- **Columns**: Up to **50 columns**
- **File Size**: Up to **5 MB**
- **Response Time**: < 2 seconds for initial load

### Maximum Limits (Acceptable Performance)
- **Rows**: Up to **50,000 rows**
- **Columns**: Up to **100 columns**
- **File Size**: Up to **20 MB**
- **Response Time**: 3-8 seconds for initial load

### Beyond These Limits
Files larger than the maximum limits will experience:
- Slow initial loading (10+ seconds)
- Laggy scrolling and interactions
- High memory usage (potential browser crashes)
- Unresponsive UI during operations

## Performance Factors

### 1. **Client-Side Rendering**
- All data is loaded into browser memory
- DOM elements are created for each visible cell
- Real-time calculations happen in JavaScript

### 2. **Current Optimizations**
✅ Only first 100 rows loaded for preview (API endpoint limit)
✅ Virtual scrolling through CSS overflow
✅ Lazy rendering of table cells
✅ localStorage persistence (no server roundtrips)

### 3. **Performance Bottlenecks**
⚠️ Full table re-render on data type changes
⚠️ Calculated field formulas run on every row
⚠️ No pagination or windowing
⚠️ No backend processing

## Production Recommendations

### For Better Performance at Scale

#### 1. **Server-Side Pagination**
```typescript
// Implement API pagination
GET /api/reporting-studio/preview/{id}?page=1&limit=100
```

#### 2. **Virtual Scrolling (Windowing)**
- Use libraries like `react-window` or `react-virtualized`
- Only render visible rows (e.g., 50 rows at a time)
- **Impact**: Can handle 100,000+ rows smoothly

#### 3. **Web Workers for Calculations**
- Move formula evaluation to background threads
- **Impact**: Prevents UI freezing during heavy calculations

#### 4. **Server-Side Processing**
- Move data type conversions and calculated fields to backend
- Use DuckDB or similar for fast columnar processing
- **Impact**: Can handle millions of rows

#### 5. **Lazy Loading Columns**
- Load only visible columns initially
- Fetch additional columns on horizontal scroll
- **Impact**: Reduces initial payload by 50-80%

### Example: Optimized Architecture

```
┌─────────────┐         ┌──────────────┐         ┌──────────┐
│   Browser   │ ◄─────► │  Next.js API │ ◄─────► │  DuckDB  │
│ (React UI)  │         │  (Paginated) │         │ (Dataset)│
└─────────────┘         └──────────────┘         └──────────┘
     ▲                          │
     │                          │
     └──────────────────────────┘
      Load 100 rows at a time
```

## Real-World Usage

### Small Business / Team Use
- **Dataset**: 1,000 - 10,000 rows
- **Users**: 5-20 concurrent
- **Status**: ✅ Current implementation works well

### Medium Enterprise
- **Dataset**: 50,000 - 500,000 rows
- **Users**: 20-100 concurrent
- **Status**: ⚠️ Requires pagination + virtual scrolling

### Large Enterprise / Data Warehousing
- **Dataset**: 1M+ rows
- **Users**: 100+ concurrent
- **Status**: ❌ Requires full backend rewrite with DuckDB/ClickHouse

## Quick Wins for Immediate Performance

### 1. Increase Preview Limit Conditionally
```typescript
// In API route
const limit = parseInt(searchParams.get('limit') || '100')
const maxLimit = 1000 // Safety cap
const rowsToReturn = Math.min(limit, maxLimit)
```

### 2. Add Loading Skeleton
- Show placeholder while data loads
- Improves perceived performance

### 3. Debounce Expensive Operations
- Data type changes
- Column resizing
- Formula calculations

### 4. Optimize Column Width Calculations
- Cache computed widths
- Only recalculate on resize

## Monitoring Performance

### Metrics to Track
1. **Time to First Byte (TTFB)**: < 500ms
2. **File Parse Time**: < 2s for 10MB files
3. **Table Render Time**: < 1s for 10,000 rows
4. **Memory Usage**: < 500MB for typical datasets
5. **Interaction Lag**: < 100ms for user actions

### Browser DevTools
```javascript
// Add to page.tsx for debugging
console.time('File Parse')
// ... parsing code ...
console.timeEnd('File Parse')

console.time('Table Render')
// ... render code ...
console.timeEnd('Table Render')
```

## Conclusion

**Current Implementation**: 
- ✅ Perfect for prototyping and small-medium datasets
- ✅ Fast development and iteration
- ⚠️ Not suitable for enterprise-scale data without modifications

**For Production**: 
- Implement server-side pagination
- Add virtual scrolling (react-window)
- Consider backend processing for calculated fields
- Set up proper monitoring and limits

**Recommended Next Step**: 
Add pagination as the first optimization - it's the highest ROI improvement.

