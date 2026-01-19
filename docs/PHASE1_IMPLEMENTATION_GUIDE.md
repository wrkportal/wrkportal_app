# Phase 1 Implementation Guide: Free Tier Optimization

## 🎯 Overview

Phase 1 focuses on optimizing the free tier infrastructure to reduce costs by 99% while maintaining security and compliance.

**Goal**: Migrate free tier to Supabase + Vercel ($240/year vs $164,340/year)

**Duration**: 7-11 days

**Savings**: **$164,100/year** (99% reduction)

---

## ✅ Completed Implementation

### 1. Tier Utilities Created (`lib/utils/tier-utils.ts`)

✅ **Status**: Implemented

**Features**:
- `getUserTier()`: Gets user's tier from their tenant
- `getTierLimits()`: Gets tier limits (AI, automation, storage)
- `canUseAI()`: Checks if user can use AI features
- `canCreateAutomation()`: Checks if user can create automations
- `getUserInfrastructure()`: Gets infrastructure provider for tier

**Tier Limits**:
- **Free**: No AI, 10 automations/month, 1 GB storage, Supabase Free
- **Starter**: No AI, 100 automations/month, 20 GB storage, Neon.tech
- **Professional**: 50 AI queries/month, 250 automations/month, 50 GB storage, Neon.tech
- **Business**: 500 AI queries/month, unlimited automations, 250 GB storage, AWS Aurora
- **Enterprise**: Unlimited everything, AWS Aurora

---

### 2. Infrastructure Routing Utilities (`lib/infrastructure/routing.ts`)

✅ **Status**: Implemented

**Features**:
- `getDatabaseConnectionString()`: Routes to correct database based on tier
- `getStorageProvider()`: Returns storage provider (Supabase or S3)
- `getHostingProvider()`: Returns hosting provider (Vercel or AWS Amplify)
- `getUserInfrastructureConfig()`: Returns complete infrastructure config

**Environment Variables Needed**:
- `DATABASE_URL_SUPABASE_FREE`: Supabase free tier connection string
- `DATABASE_URL_NEON`: Neon.tech connection string
- `DATABASE_URL_AURORA`: AWS Aurora connection string
- `DATABASE_URL`: Fallback/default connection string

---

### 3. AI Feature Gating (`app/api/ai/chat/route.ts`)

✅ **Status**: Implemented

**Changes**:
- Added tier check using `canUseAI()` before processing AI requests
- Returns 403 with upgrade prompt if user doesn't have AI access
- Error message guides users to upgrade

**Response for Free Tier**:
```json
{
  "error": "AI features are not available on your current plan",
  "message": "Upgrade to Professional or higher to access AI features. Visit your settings to upgrade.",
  "upgradeRequired": true
}
```

---

## 📋 Remaining Tasks

### 4. Automation Limits (In Progress)

**Status**: ⏳ **Pending**

**Tasks**:
1. [ ] Add automation count tracking (per tenant per month)
2. [ ] Add tier check to automation creation routes
3. [ ] Add tier check to automation execution routes
4. [ ] Return 403 with upgrade prompt if limit exceeded

**Files to Update**:
- `app/api/sales/automation/**` routes
- `lib/sales/automation-engine.ts` (optional - can check at API level)

**Implementation**:
```typescript
import { canCreateAutomation } from '@/lib/utils/tier-utils'

// Before creating/executing automation
const canCreate = await canCreateAutomation(userId, currentMonthCount)
if (!canCreate) {
  return NextResponse.json({
    error: 'Automation limit reached',
    message: 'Free tier allows 10 automations/month. Upgrade to increase limits.',
    upgradeRequired: true,
  }, { status: 403 })
}
```

---

### 5. Environment Variables Setup

**Status**: ⏳ **Pending**

**Action Items**:

1. [ ] Add to `.env.local`:
   ```bash
   # Tier-Based Infrastructure (Phase 1)
   DATABASE_URL_SUPABASE_FREE="postgresql://user:pass@host:5432/db?sslmode=require"
   DATABASE_URL_NEON="postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/db?sslmode=require"
   DATABASE_URL_AURORA="postgresql://user:pass@aurora-host:5432/db?sslmode=require"
   ```

2. [ ] Add to `env.template`:
   ```bash
   # Tier-Based Infrastructure
   DATABASE_URL_SUPABASE_FREE="your-supabase-free-tier-connection-string"
   DATABASE_URL_NEON="your-neon-connection-string"
   DATABASE_URL_AURORA="your-aurora-connection-string"
   ```

3. [ ] Update deployment configuration (Vercel, AWS Amplify, etc.) with these variables

---

### 6. Supabase Free Tier Setup

**Status**: ⏳ **Pending - Manual Step**

**Action Items**:

1. [ ] Sign up for Supabase (https://supabase.com)
2. [ ] Create 10 free tier projects (each: 500 MB database, 2 GB bandwidth/month)
3. [ ] Get connection strings from each Supabase project
4. [ ] Store connection strings in environment variables
5. [ ] Test connection with Prisma
6. [ ] Set up automatic backups (already included in Supabase free tier)

**Migration Strategy**:
- Split 2,000 free tier users across 10 Supabase instances (~200 users/instance)
- Each Supabase free tier: 500 MB database (sufficient for ~500 users at basic usage)

---

### 7. Vercel Pro Setup

**Status**: ⏳ **Pending - Manual Step**

**Action Items**:

1. [ ] Sign up for Vercel Pro ($20/month)
2. [ ] Configure Next.js app for Vercel deployment
3. [ ] Set up environment variables in Vercel dashboard
4. [ ] Deploy to Vercel
5. [ ] Configure custom domain (if needed)
6. [ ] Set up CDN (automatic with Vercel)

**Migration Strategy**:
- Route free tier traffic to Vercel
- Use AWS Amplify for paid tiers (Starter, Professional, Business)

---

### 8. Database Migration Script

**Status**: ⏳ **Pending**

**Action Items**:

1. [ ] Create migration script to split free tier users across Supabase instances
2. [ ] Test migration with sample users first
3. [ ] Migrate all free tier users
4. [ ] Verify data integrity
5. [ ] Monitor performance

**Migration Script Structure** (to be created):
```typescript
// scripts/migrate-free-tier-to-supabase.ts
import { prisma } from '@/lib/prisma'

// 1. Get all free tier tenants
// 2. Split across 10 Supabase instances
// 3. Update DATABASE_URL for each tenant
// 4. Run Prisma migrations on each Supabase instance
// 5. Verify data integrity
```

---

## 🔒 Security & Compliance

✅ **All tiers maintain SOC 2, GDPR compliance**

**Free Tier (Supabase + Vercel)**:
- ✅ Encryption at rest (AES-256)
- ✅ Encryption in transit (TLS 1.3)
- ✅ SOC 2 Type II (both providers)
- ✅ GDPR compliant (both providers)
- ✅ Daily backups (automatic with Supabase)

**No security compromises** - same security level as paid tiers, just free tier infrastructure.

---

## 📊 Cost Impact

### Current (Before Phase 1)

**Free Tier (2,000 users)**: $164,340/year
- Database: $24,000/year
- Hosting: $101,700/year
- Storage: $20,340/year
- AI: $16,800/year
- Automation: $1,500/year

### Optimized (After Phase 1)

**Free Tier (2,000 users)**: $240/year
- Database: $0 (Supabase Free Tier)
- Hosting: $240/year (Vercel Pro)
- Storage: $0 (Supabase Storage Free)
- AI: $0 (disabled for free tier)
- Automation: $0 (Vercel Serverless)

**Savings**: **$164,100/year** (99% reduction!)

---

## 🚀 Next Steps

### Week 1-2 (Days 1-7)

1. **Days 1-2**: Set up Supabase free tier instances (manual)
2. **Days 3-4**: Set up Vercel Pro and deploy (manual)
3. **Days 5-6**: Add automation tier checks (code)
4. **Day 7**: Test and verify everything works

### Testing Checklist

- [ ] Free tier users can't access AI features (403 error)
- [ ] Free tier users limited to 10 automations/month
- [ ] Free tier users route to Supabase database
- [ ] Free tier users route to Vercel hosting
- [ ] Paid tier users still use original infrastructure
- [ ] No data loss during migration
- [ ] Performance is acceptable

---

## 📝 Notes

- **No code changes needed** for database routing (Prisma handles DATABASE_URL automatically)
- **Infrastructure routing utilities** are ready to use when needed
- **AI feature gating** is already implemented
- **Automation limits** need to be added to API routes

---

**Ready to proceed with Phase 1 implementation!**
