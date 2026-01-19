# Deployment Guide

## 📋 Current Application Structure

### Technology Stack
- **Framework**: Next.js 16.1.1 (React 18.3.1)
- **Database**: PostgreSQL (via Prisma ORM)
- **Authentication**: NextAuth.js 5.0
- **Styling**: Tailwind CSS
- **Type Safety**: TypeScript
- **Build System**: SWC (Next.js default)

### Key Features
- ✅ Server-Side Rendering (SSR)
- ✅ API Routes (`/app/api`)
- ✅ Database Integration (Prisma)
- ✅ Authentication (NextAuth)
- ✅ File Uploads (Vercel Blob)
- ✅ Cron Jobs (configured in `vercel.json`)
- ✅ Webhook Endpoints (GitHub, Jenkins)
- ✅ Electron Support (Desktop app)

### Build Configuration
- **Build Command**: `prisma generate && prisma db push && next build`
- **Start Command**: `next start`
- **Output**: `standalone` mode (for production)
- **Prisma**: Auto-generates on build

---

## 🚀 Recommended Deployment Platforms

### 1. **Vercel** (⭐ Recommended - Best for Next.js)

**Why Vercel?**
- Built by the creators of Next.js
- Zero-config deployment
- Automatic HTTPS and CDN
- Built-in CI/CD
- Serverless functions
- Cron jobs support (already configured)
- Free tier available

**Best For:**
- Production deployments
- Quick setup
- Automatic scaling
- Global CDN distribution

---

### 2. **Railway** (Good Alternative)

**Why Railway?**
- Full-stack deployment (app + database)
- Simple PostgreSQL setup
- Good developer experience
- One-click deployments

**Best For:**
- When you need database included
- Simpler all-in-one solution

---

### 3. **AWS / AWS Amplify** (Enterprise)

**Why AWS?**
- Full control and customization
- Enterprise-grade infrastructure
- High scalability
- Custom domain and networking

**Best For:**
- Enterprise requirements
- Compliance needs
- Custom infrastructure requirements

---

### 4. **Docker + Cloud** (Maximum Control)

**Why Docker?**
- Consistent deployment across environments
- Easy to migrate between platforms
- Full control over environment

**Best For:**
- Self-hosting
- Custom cloud providers
- Maximum control

---

## 📦 Deployment Steps

### Option 1: Deploy to Vercel (Recommended)

#### Prerequisites
1. GitHub/GitLab/Bitbucket account
2. Vercel account (free at [vercel.com](https://vercel.com))
3. PostgreSQL database (Neon, Supabase, or Railway)

#### Step 1: Prepare Your Repository
```bash
# Ensure all changes are committed
git add .
git commit -m "Prepare for deployment"
git push origin main
```

#### Step 2: Deploy to Vercel

**Method A: Via Vercel Dashboard (Easiest)**
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"New Project"**
3. Import your Git repository
4. Configure project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `npm install`

5. Add Environment Variables (see [Environment Variables](#environment-variables) section)

6. Click **"Deploy"**

**Method B: Via Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (production)
vercel --prod

# Or link to existing project
vercel link
vercel deploy --prod
```

#### Step 3: Configure Environment Variables
See [Environment Variables](#environment-variables) section below.

#### Step 4: Set Up Database
1. Create a PostgreSQL database:
   - **Neon.tech** (Recommended): [neon.tech](https://neon.tech)
   - **Supabase**: [supabase.com](https://supabase.com)
   - **Railway**: [railway.app](https://railway.app)

2. Get connection string (use **pooler** connection for better performance)

3. Add `DATABASE_URL` to Vercel environment variables

4. Run migrations:
   ```bash
   # Via Vercel CLI
   vercel env pull .env.production
   npx prisma migrate deploy
   
   # Or via Vercel dashboard (add build command):
   # prisma generate && prisma migrate deploy && next build
   ```

#### Step 5: Configure Custom Domain (Optional)
1. Go to your project settings in Vercel
2. Navigate to **"Domains"**
3. Add your custom domain
4. Update DNS records as instructed

---

### Option 2: Deploy to Railway

#### Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub

#### Step 2: Create New Project
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your repository

#### Step 3: Add PostgreSQL Database
1. Click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway will automatically provide `DATABASE_URL`

#### Step 4: Configure Environment Variables
1. Go to your service settings
2. Navigate to **"Variables"**
3. Add all environment variables (see below)

#### Step 5: Deploy
1. Railway will auto-deploy on git push
2. Or click **"Deploy"** manually

---

### Option 3: Deploy with Docker

#### Step 1: Create Dockerfile
```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci

# Generate Prisma Client
COPY prisma ./prisma
RUN npx prisma generate

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Build application
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### Step 2: Build and Run
```bash
# Build image
docker build -t your-app-name .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="your-database-url" \
  -e NEXTAUTH_URL="http://localhost:3000" \
  -e NEXTAUTH_SECRET="your-secret" \
  your-app-name
```

---

## 🔐 Environment Variables

### Required Variables

Add these in your deployment platform's environment variable settings:

```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"

# NextAuth
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="generate-using-openssl-rand-base64-32"

# OAuth (if using Google)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Email (for password reset, notifications)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"
EMAIL_FROM="noreply@yourcompany.com"

# AI Services (if using)
AZURE_OPENAI_ENDPOINT="https://your-resource.openai.azure.com"
AZURE_OPENAI_API_KEY="your-api-key"
AZURE_OPENAI_API_VERSION="2024-02-15-preview"
AZURE_OPENAI_DEPLOYMENT_NAME="gpt-4"

# CI/CD Webhooks
GITHUB_WEBHOOK_SECRET="your-github-webhook-secret"
JENKINS_WEBHOOK_TOKEN="your-jenkins-webhook-token"

# Encryption
REPORTING_STUDIO_ENCRYPTION_KEY="generate-using-openssl-rand-base64-32"
```

### Generate Secrets
```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate REPORTING_STUDIO_ENCRYPTION_KEY
openssl rand -base64 32

# Generate GITHUB_WEBHOOK_SECRET
openssl rand -base64 32
```

### Environment-Specific Variables

**Development:**
```bash
NEXTAUTH_URL="http://localhost:3000"
```

**Production:**
```bash
NEXTAUTH_URL="https://your-production-domain.com"
```

---

## 🗄️ Database Setup

### Step 1: Choose Database Provider

**Recommended Options:**
1. **Neon.tech** (PostgreSQL) - Free tier, serverless, great performance
2. **Supabase** (PostgreSQL) - Free tier, includes auth and storage
3. **Railway** (PostgreSQL) - Simple, included with Railway deployment
4. **AWS RDS** - Enterprise-grade, more complex setup

### Step 2: Create Database
1. Sign up for your chosen provider
2. Create a new PostgreSQL database
3. Copy the connection string

### Step 3: Configure Connection Pooling

**For Neon.tech:**
- Use the **pooler** connection string (contains `-pooler` in hostname)
- Example: `postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/db?sslmode=require`

**For Other Providers:**
- Add connection pool parameters to `DATABASE_URL`:
```
?connection_limit=10&pool_timeout=5&connect_timeout=5&sslmode=require
```

### Step 4: Run Migrations

**Option A: Via Build Command**
Update build command in deployment platform:
```bash
prisma generate && prisma migrate deploy && next build
```

**Option B: Manual Migration**
```bash
# Pull environment variables
vercel env pull .env.production

# Run migrations
npx prisma migrate deploy

# Or push schema (development only)
npx prisma db push
```

---

## ✅ Post-Deployment Checklist

### 1. Verify Application
- [ ] Visit your deployment URL
- [ ] Check that the app loads correctly
- [ ] Test authentication (login/signup)
- [ ] Verify database connection

### 2. Configure Webhooks
- [ ] Update GitHub webhook URL: `https://your-domain.com/api/developer/webhooks/github`
- [ ] Update Jenkins webhook URL: `https://your-domain.com/api/developer/webhooks/jenkins`
- [ ] Test webhook endpoints

### 3. Set Up Custom Domain (Optional)
- [ ] Add custom domain in deployment platform
- [ ] Update DNS records
- [ ] Verify SSL certificate (auto-configured on Vercel)

### 4. Configure OAuth Redirects
- [ ] Update Google OAuth redirect URIs:
  - `https://your-domain.com/api/auth/callback/google`
- [ ] Update other OAuth providers similarly

### 5. Test Critical Features
- [ ] User authentication
- [ ] Database operations
- [ ] File uploads (if applicable)
- [ ] API endpoints
- [ ] Cron jobs (check Vercel cron logs)

### 6. Monitor & Optimize
- [ ] Set up error monitoring (e.g., Sentry)
- [ ] Monitor database connections
- [ ] Check build logs for warnings
- [ ] Optimize environment variables

---

## 🔍 Troubleshooting

### Common Issues

#### 1. Build Fails with Prisma Error
**Problem:** `Error: Can't reach database server`

**Solution:**
- Ensure `DATABASE_URL` is set correctly
- Use pooler connection for serverless (Neon)
- Check database is accessible from deployment platform

#### 2. Authentication Not Working
**Problem:** OAuth redirects fail

**Solution:**
- Update `NEXTAUTH_URL` to production URL
- Update OAuth redirect URIs in provider dashboard
- Check `NEXTAUTH_SECRET` is set

#### 3. Database Connection Pool Exhausted
**Problem:** Too many database connections

**Solution:**
- Use connection pooler (Neon pooler, Supabase pooler)
- Add `connection_limit` parameter to `DATABASE_URL`
- Check for connection leaks in code

#### 4. Cron Jobs Not Running
**Problem:** Scheduled tasks not executing

**Solution (Vercel):**
- Verify `vercel.json` is in root directory
- Check cron job paths are correct
- Verify function is deployed (not excluded)

#### 5. Environment Variables Not Loading
**Problem:** Variables undefined in production

**Solution:**
- Ensure variables are set in deployment platform
- Redeploy after adding new variables
- Check variable names match exactly (case-sensitive)

---

## 📊 Platform Comparison

| Feature | Vercel | Railway | AWS | Docker |
|---------|--------|---------|-----|--------|
| **Ease of Setup** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ |
| **Next.js Optimization** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Database Included** | ❌ | ✅ | ❌ | ❌ |
| **Free Tier** | ✅ | ✅ | ❌ | ✅ |
| **Scaling** | Auto | Auto | Manual | Manual |
| **CDN** | ✅ Built-in | ❌ | ✅ (CloudFront) | ❌ |
| **Cron Jobs** | ✅ | ❌ | ✅ (EventBridge) | Manual |
| **Custom Domain** | ✅ | ✅ | ✅ | ✅ |

---

## 🎯 Quick Start (Vercel - Recommended)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel --prod

# 4. Add environment variables
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_URL production
vercel env add NEXTAUTH_SECRET production
# ... add all required variables

# 5. Redeploy with env vars
vercel --prod
```

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
- [NextAuth.js Configuration](https://next-auth.js.org/configuration/options)

---

## 🆘 Need Help?

If you encounter issues during deployment:
1. Check the deployment logs in your platform dashboard
2. Verify all environment variables are set correctly
3. Ensure database is accessible
4. Check the troubleshooting section above
5. Review platform-specific documentation
