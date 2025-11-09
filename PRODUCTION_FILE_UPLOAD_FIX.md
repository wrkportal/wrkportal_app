# File Upload Issue in Production

## Problem
The reporting studio file upload fails in production because:

1. **Vercel's serverless functions have read-only filesystem**
2. Cannot create or write to `uploads/` directory
3. Files need to be stored in cloud storage, not local filesystem

## Error in Production
```
EROFS: read-only file system, mkdir '/var/task/uploads/reporting-studio'
```

## Solution Options

### Option 1: Vercel Blob Storage (Recommended - Easiest)
**Pros:**
- Native Vercel integration
- Simple setup
- Free tier available
- Automatic CDN

**Setup:**
1. Install: `npm install @vercel/blob`
2. Add env var: `BLOB_READ_WRITE_TOKEN` (auto-generated in Vercel dashboard)
3. Update upload route to use blob storage

### Option 2: AWS S3
**Pros:**
- Industry standard
- Highly reliable
- More control

**Cons:**
- More configuration
- Requires AWS account setup

### Option 3: Cloudflare R2
**Pros:**
- No egress fees
- S3-compatible API
- Good pricing

**Cons:**
- Requires Cloudflare account

### Option 4: Uploadthing
**Pros:**
- Very easy to use
- Good free tier
- Built for Next.js

**Cons:**
- Third-party service

## Recommended Fix: Use Vercel Blob

### 1. Install Package
```bash
npm install @vercel/blob
```

### 2. Get Blob Token
- Go to Vercel Dashboard → Your Project → Storage → Create Blob Store
- Token will be automatically added to environment variables

### 3. Update Upload Route
Replace filesystem operations with blob storage operations.

## Temporary Workaround (Dev Only)
For development, keep using filesystem. Detect environment:
```typescript
const isDevelopment = process.env.NODE_ENV === 'development'
```

## Files That Need Updates
1. `app/api/reporting-studio/upload/route.ts` - Main upload
2. `app/api/reporting-studio/files/[fileId]/update/route.ts` - File update
3. `app/api/reporting-studio/preview/[fileId]/route.ts` - File preview
4. Any other routes that read uploaded files

