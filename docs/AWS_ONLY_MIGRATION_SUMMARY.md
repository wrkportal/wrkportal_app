# AWS-Only Migration Summary

## Overview

The codebase has been updated to use **AWS infrastructure exclusively** for all tiers (Free, Starter, Professional, Business, Enterprise). This simplifies the architecture and provides consistent, enterprise-grade infrastructure across all customer tiers.

---

## What Changed

### 1. Infrastructure Routing (`lib/infrastructure/routing.ts`)

**Before:**
- Free tier: Supabase Free database, Supabase Storage, Vercel hosting
- Starter/Professional: Neon.tech database, S3 storage, AWS Amplify hosting
- Business/Enterprise: AWS Aurora database, S3 storage, AWS Amplify hosting

**After:**
- **All tiers**: AWS Aurora Serverless v2 database, AWS S3 storage, AWS Amplify hosting

### 2. Tier Utilities (`lib/utils/tier-utils.ts`)

**Changes:**
- Removed `supabase-free` and `neon` infrastructure options
- All tiers now use `aws-aurora` infrastructure
- Tier limits (AI, automations, storage, users) remain the same
- Only infrastructure provider changed

### 3. Environment Variables (`env.template`)

**Removed:**
- `DATABASE_URL_SUPABASE_FREE`
- `DATABASE_URL_NEON`

**Added:**
- `DATABASE_URL_AURORA` (primary database URL)
- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `S3_BUCKET_NAME`

### 4. New Files Created

1. **`lib/storage/s3-storage.ts`**
   - S3 utility functions for file uploads, downloads, and deletions
   - Functions: `uploadFile()`, `getFileUrl()`, `deleteFile()`, `fileExists()`, `generateS3Key()`

2. **`amplify.yml`**
   - AWS Amplify build configuration
   - Handles Prisma generation and Next.js build

3. **`docs/AWS_ONLY_DEPLOYMENT_GUIDE.md`**
   - Comprehensive step-by-step deployment guide
   - Covers Aurora, S3, Amplify setup
   - Includes troubleshooting and cost estimates

---

## Next Steps to Go Live

### Step 1: Set Up AWS Aurora Serverless v2 (Day 1-2)

1. Create Aurora PostgreSQL cluster
2. Configure RDS Proxy (recommended)
3. Set up security groups
4. Get connection string
5. Run Prisma migrations

**Reference**: See `docs/AWS_ONLY_DEPLOYMENT_GUIDE.md` Step 1

### Step 2: Set Up AWS S3 (Day 2)

1. Create S3 bucket for file uploads
2. Configure bucket policy
3. Create IAM user/role for S3 access
4. Get access keys

**Reference**: See `docs/AWS_ONLY_DEPLOYMENT_GUIDE.md` Step 2

### Step 3: Set Up AWS Amplify (Day 3-4)

1. Connect GitHub repository
2. Configure build settings (use `amplify.yml`)
3. Add environment variables
4. Deploy application

**Reference**: See `docs/AWS_ONLY_DEPLOYMENT_GUIDE.md` Step 3

### Step 4: Install Dependencies

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### Step 5: Update File Upload Routes

Update existing file upload routes to use S3 instead of local file system:

**Example Migration:**

**Before (local file system):**
```typescript
import { writeFile } from 'fs/promises'
import { join } from 'path'

const filePath = join(process.cwd(), 'uploads', fileName)
await writeFile(filePath, buffer)
```

**After (S3):**
```typescript
import { uploadFile, generateS3Key } from '@/lib/storage/s3-storage'

const s3Key = generateS3Key('uploads', file.name)
await uploadFile(s3Key, buffer, file.type)
```

**Files to Update:**
- `app/api/finance/files/upload/route.ts`
- `app/api/upload/video/route.ts`
- `app/api/collaborations/[id]/files/route.ts`
- `app/api/sales/products/upload/route.ts`
- `app/api/sales/accounts/upload/route.ts`
- Any other file upload routes

### Step 6: Update File Download Routes

Update file download routes to use S3 presigned URLs:

**Example Migration:**

**Before:**
```typescript
const filePath = join(process.cwd(), 'uploads', fileName)
return NextResponse.json({ url: `/uploads/${fileName}` })
```

**After:**
```typescript
import { getFileUrl } from '@/lib/storage/s3-storage'

const url = await getFileUrl(s3Key, 3600) // 1 hour expiry
return NextResponse.json({ url })
```

### Step 7: Run Prisma Migrations

```bash
# Set DATABASE_URL to Aurora
export DATABASE_URL="$DATABASE_URL_AURORA"

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy
```

### Step 8: Test Application

1. Test file uploads (should go to S3)
2. Test file downloads (should use presigned URLs)
3. Test database operations (should connect to Aurora)
4. Test authentication and user flows
5. Monitor CloudWatch logs for errors

### Step 9: Set Up Monitoring

1. Configure CloudWatch alarms
2. Set up SNS notifications
3. Monitor Aurora performance
4. Monitor S3 usage and costs
5. Monitor Amplify build times

---

## Cost Estimates

### Monthly Costs (Conservative)

- **AWS Aurora Serverless v2**: ~$150/month
- **AWS S3**: ~$10-50/month (depends on usage)
- **AWS Amplify**: ~$20-100/month (depends on builds/traffic)
- **AWS RDS Proxy**: ~$10-30/month
- **CloudWatch**: ~$10-30/month

**Total: ~$200-360/month**

*Note: Costs scale with usage. Aurora Serverless v2 automatically scales down during low usage periods.*

---

## Benefits of AWS-Only Architecture

1. **Consistency**: All tiers use the same infrastructure stack
2. **Scalability**: Aurora Serverless v2 auto-scales based on demand
3. **Reliability**: Enterprise-grade infrastructure with multi-AZ support
4. **Security**: AWS security best practices and compliance options
5. **Monitoring**: Unified CloudWatch monitoring across all services
6. **Cost Optimization**: Pay only for what you use with serverless options
7. **Simplified Operations**: Single cloud provider, easier to manage

---

## Migration Checklist

- [x] Update tier utilities to use AWS Aurora for all tiers
- [x] Update infrastructure routing to use AWS for all tiers
- [x] Create S3 storage utility
- [x] Update environment variables template
- [x] Create Amplify build configuration
- [x] Create deployment guide
- [ ] Set up AWS Aurora Serverless v2
- [ ] Set up AWS S3 bucket
- [ ] Set up AWS Amplify
- [ ] Install AWS SDK dependencies
- [ ] Update file upload routes to use S3
- [ ] Update file download routes to use S3 presigned URLs
- [ ] Run Prisma migrations
- [ ] Test application end-to-end
- [ ] Set up monitoring and alerts
- [ ] Configure custom domain (optional)
- [ ] Go live! 🚀

---

## Support and Troubleshooting

For detailed troubleshooting, see `docs/AWS_ONLY_DEPLOYMENT_GUIDE.md` section "Troubleshooting".

Common issues:
- Connection issues: Check security groups and VPC configuration
- S3 upload issues: Verify IAM permissions and bucket policy
- Amplify build failures: Check build logs and environment variables
- Performance issues: Monitor Performance Insights and adjust ACU scaling

---

## Questions?

If you encounter any issues during deployment, refer to:
1. `docs/AWS_ONLY_DEPLOYMENT_GUIDE.md` - Comprehensive deployment guide
2. `docs/AWS_AURORA_SETUP_GUIDE.md` - Detailed Aurora setup (if needed)
3. AWS documentation for specific services

---

**Ready to deploy!** Follow the steps above to get your application live on AWS. 🎉
