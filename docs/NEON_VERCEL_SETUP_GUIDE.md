# Neon.tech + Vercel Setup Guide

## 🎯 Quick Start: Launch with Neon.tech + Vercel

This guide helps you set up your application with **Neon.tech** (database) and **Vercel** (hosting) for all tiers initially. This is the recommended approach for launching and acquiring customers before scaling to AWS.

**Estimated Time**: 2-3 hours  
**Monthly Cost**: ~$19-38/month (vs $135/month with Aurora)  
**Savings**: 95% cost reduction

---

## Step 1: Set Up Neon.tech Database

### 1.1 Create Neon Account

1. Go to [neon.tech](https://neon.tech)
2. Sign up for free account
3. Verify email

### 1.2 Create Database Project

1. Click "Create Project"
2. **Project Name**: `wrkportal-production`
3. **Cloud Provider**: Choose **AWS** (recommended)
   - ✅ AWS regions are more mature and stable
   - ✅ Better integration with Vercel (which uses AWS)
   - ✅ Lower latency if your app is on AWS/Vercel
   - ⚠️ Azure is newer (beta) and may have limitations
4. **Region**: Choose closest to your users (e.g., `us-east-1` for AWS)
   - **AWS Options**: US East (N. Virginia), US West (Oregon), Europe (Frankfurt), etc.
   - **Azure Options**: East US 2, West US 3, etc. (if you choose Azure)
5. **PostgreSQL Version**: `15` (recommended for Prisma)
6. **Enable Neon Auth**: **DISABLE** (uncheck this option)
   - ❌ You already have NextAuth configured
   - ❌ Neon Auth is beta and may conflict with your existing auth
   - ❌ You don't need it since you have custom auth setup
7. Click "Create Project"

### 1.3 Get Connection String

1. After project creation, you'll see the connection string
2. **Important**: Use the **pooler connection string** (has `-pooler` in hostname)
   - Example: `postgresql://user:pass@ep-xxx-pooler.us-east-1.aws.neon.tech/db?sslmode=require`
3. Copy the connection string

### 1.4 Upgrade to Scale Plan (Optional but Recommended)

**Free Tier**:
- ✅ 500 MB storage
- ✅ 0.5 GB compute
- ✅ Good for testing/development

**Scale Plan** ($19/month):
- ✅ 10 GB storage
- ✅ 1 GB compute (auto-scales)
- ✅ Better performance
- ✅ Recommended for production

**To Upgrade**:
1. Go to Neon Dashboard → Billing
2. Select "Scale" plan
3. Enter payment method
4. Confirm upgrade

---

## Step 2: Configure Environment Variables

### 2.1 Local Development (.env)

Create/update `.env` file:

```bash
# Primary database URL (Neon.tech)
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.us-east-1.aws.neon.tech/db?sslmode=require"

# Tier-based infrastructure (for future migration)
# For now, all tiers use Neon
DATABASE_URL_NEON="postgresql://user:pass@ep-xxx-pooler.us-east-1.aws.neon.tech/db?sslmode=require"

# Optional: Free tier can use Supabase Free later
# DATABASE_URL_SUPABASE_FREE="postgresql://..."

# Optional: Business/Enterprise can use Aurora later
# DATABASE_URL_AURORA="postgresql://..."

# Other environment variables (keep existing)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret"
# ... rest of your env vars
```

### 2.2 Vercel Production

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add/Update:
   - `DATABASE_URL` = Your Neon pooler connection string
   - `DATABASE_URL_NEON` = Same as above (for tier-based routing)
3. Save changes

---

## Step 3: Run Prisma Migrations

### 3.1 Test Connection

```bash
# Test connection to Neon
psql "$DATABASE_URL"
# Or
npx prisma db pull
```

### 3.2 Run Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Or for development
npx prisma migrate dev --name init_neon
```

### 3.3 Verify Schema

```bash
# Open Prisma Studio to verify
npx prisma studio
```

---

## Step 4: Deploy to Vercel

### 4.1 Connect Repository

1. Go to [vercel.com](https://vercel.com)
2. Import your Git repository
3. Configure project settings

### 4.2 Configure Build Settings

**Framework Preset**: Next.js  
**Build Command**: `npm run build` (or `next build`)  
**Output Directory**: `.next`  
**Install Command**: `npm install`

### 4.3 Environment Variables

Add all environment variables in Vercel Dashboard:
- `DATABASE_URL`
- `DATABASE_URL_NEON`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `AI_PROVIDER`
- `AZURE_OPENAI_*` (or `OPENAI_API_KEY`)
- ... all other required env vars

### 4.4 Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Test your application

---

## Step 5: Configure Neon Connection Pooling

### 5.1 Why Connection Pooling?

Neon.tech uses serverless PostgreSQL, which means:
- Connections are ephemeral (can disconnect)
- Connection pooling improves performance
- Reduces connection overhead

### 5.2 Use Pooler Connection String

**Always use the pooler connection string** (has `-pooler` in hostname):
```
postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/db?sslmode=require
```

**NOT the direct connection string**:
```
postgresql://user:pass@ep-xxx.region.aws.neon.tech/db?sslmode=require
```

### 5.3 Connection Parameters

Add these parameters to your connection string for optimal performance:

```bash
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/db?sslmode=require&connection_limit=10&pool_timeout=5"
```

**Parameters**:
- `connection_limit=10` - Max connections in pool (adjust based on load)
- `pool_timeout=5` - Pool timeout in seconds
- `sslmode=require` - Require SSL (security)

---

## Step 6: Monitor and Optimize

### 6.1 Neon Dashboard

Monitor in Neon Dashboard:
- **Storage usage** - Track database size
- **Compute usage** - Monitor CPU/memory
- **Connection count** - Watch for connection limits
- **Query performance** - Identify slow queries

### 6.2 Vercel Analytics

Monitor in Vercel Dashboard:
- **Function execution time** - Optimize slow functions
- **Error rate** - Fix errors quickly
- **Bandwidth usage** - Monitor CDN usage

### 6.3 Cost Optimization

**Neon.tech**:
- Monitor storage usage (upgrade if needed)
- Optimize queries to reduce compute
- Use connection pooling (already configured)

**Vercel**:
- Optimize bundle size
- Enable CDN caching
- Monitor function execution time

---

## Step 7: Prepare for Future Migration

### 7.1 When to Migrate to Aurora

**Migration Triggers**:
- Business/Enterprise revenue > $2,000/month
- 5+ paying Business/Enterprise customers
- Customer requests HIPAA/FedRAMP compliance
- Performance issues with Neon

### 7.2 Migration Preparation

**Code is Already Ready**:
- ✅ Tier-based routing implemented (`lib/infrastructure/routing.ts`)
- ✅ Tier detection works (`lib/utils/tier-utils.ts`)
- ✅ Environment variables configured

**When Ready to Migrate**:
1. Set up AWS Aurora (follow `docs/AWS_AURORA_SETUP_GUIDE.md`)
2. Update `DATABASE_URL_AURORA` in environment
3. Business/Enterprise users will automatically route to Aurora
4. Free/Starter/Professional stay on Neon

**No Code Changes Needed!** 🎉

---

## Troubleshooting

### Connection Issues

**Problem**: Cannot connect to Neon  
**Solution**: 
- Verify connection string (use pooler URL)
- Check SSL mode (`sslmode=require`)
- Verify network access (no firewall blocking)

### Performance Issues

**Problem**: Slow queries  
**Solution**:
- Use connection pooling (pooler URL)
- Optimize queries (add indexes)
- Monitor compute usage in Neon Dashboard
- Consider upgrading to Scale plan

### Migration Issues

**Problem**: Prisma migrations fail  
**Solution**:
- Verify connection string
- Check database permissions
- Run migrations in smaller batches
- Use `prisma migrate dev` for development

---

## Cost Breakdown

### Neon.tech Costs

| Plan | Storage | Compute | Monthly Cost |
|------|---------|---------|--------------|
| Free | 500 MB | 0.5 GB | $0 |
| Scale | 10 GB | 1 GB (auto-scales) | $19 |

**Additional Costs**:
- Storage overage: $0.10/GB/month
- Compute overage: Based on usage

### Vercel Costs

| Plan | Bandwidth | Functions | Monthly Cost |
|------|-----------|-----------|--------------|
| Pro | 1 TB | 100 GB-hours | $20 |

**Total Monthly Cost**: ~$19-39/month (Neon + Vercel)

---

## Security & Compliance

### Neon.tech Security

- ✅ **SOC 2 Type II** compliant
- ✅ **GDPR** compliant
- ✅ **Encryption at rest** (AES-256)
- ✅ **Encryption in transit** (TLS 1.3)
- ✅ **Backups** (continuous, point-in-time recovery)
- ✅ **Access controls** (IAM, VPC isolation)

### Vercel Security

- ✅ **SOC 2 Type II** compliant
- ✅ **GDPR** compliant
- ✅ **DDoS protection**
- ✅ **SSL/TLS** (automatic)
- ✅ **Environment variable encryption**

**Note**: For HIPAA/FedRAMP, you'll need AWS Aurora (migrate when needed).

---

## Next Steps

1. ✅ Set up Neon.tech database
2. ✅ Configure environment variables
3. ✅ Run Prisma migrations
4. ✅ Deploy to Vercel
5. ✅ Test application
6. ✅ Start acquiring customers
7. ⏳ Monitor growth and revenue
8. ⏳ Migrate to Aurora when ready

---

**You're all set!** 🚀

Your application is now running on **Neon.tech + Vercel** with:
- ✅ Low cost ($19-39/month)
- ✅ Fast setup (2-3 hours)
- ✅ Good performance
- ✅ Easy migration path (when ready)
- ✅ Enterprise-grade security (SOC 2, GDPR)

**Focus on acquiring customers, and migrate to Aurora when revenue justifies it!**
