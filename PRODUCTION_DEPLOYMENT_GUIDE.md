# 🚀 Production Deployment Guide - From Scratch

**Application**: ProjectHub - Project Management System  
**Stack**: Next.js 14 + PostgreSQL + Prisma  
**Date**: November 2, 2025

---

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Database Preparation](#database-preparation)
4. [Deployment Options](#deployment-options)
5. [Step-by-Step Deployment (Vercel)](#vercel-deployment)
6. [Post-Deployment Steps](#post-deployment-steps)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

---

## 🔍 Pre-Deployment Checklist

### Code Readiness
- [ ] All code committed to Git
- [ ] `.env` file NOT committed (in `.gitignore`)
- [ ] No hardcoded secrets or API keys
- [ ] `npm run build` succeeds locally
- [ ] No console errors in production build
- [ ] All dependencies in `package.json`

### Database
- [ ] PostgreSQL database ready (production instance)
- [ ] Database credentials available
- [ ] Backup strategy in place
- [ ] Migration files ready

### Environment Variables
- [ ] All required env vars documented
- [ ] Production values prepared
- [ ] No localhost URLs

### Security
- [ ] NEXTAUTH_SECRET generated (use `openssl rand -base64 32`)
- [ ] Strong database password
- [ ] CORS settings configured
- [ ] Rate limiting enabled (if implemented)

---

## 🔧 Environment Setup

### Required Environment Variables

Create a `.env.production` file (for reference, **DO NOT commit**):

```bash
# Database
DATABASE_URL="postgresql://username:password@hostname:5432/database_name?schema=public"

# NextAuth
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your-generated-secret-here"

# Optional: OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Optional: Email (for notifications)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="noreply@yourdomain.com"

# Optional: Storage (if using cloud storage)
AWS_ACCESS_KEY_ID="your-aws-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-bucket-name"

# Application
NODE_ENV="production"
```

### Generate Secrets

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Alternative (if openssl not available)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 🗄️ Database Preparation

### Option 1: Managed PostgreSQL (Recommended)

**Providers:**
- **Neon** (https://neon.tech) - Free tier available, excellent for Next.js
- **Supabase** (https://supabase.com) - Free tier, includes auth
- **Railway** (https://railway.app) - Simple, good pricing
- **AWS RDS** - Enterprise-grade
- **Azure Database** - For Microsoft stack

**Steps for Neon (Recommended):**

1. Go to https://neon.tech
2. Sign up / Log in
3. Create a new project
4. Copy the connection string
5. It will look like: `postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require`

### Option 2: Self-Hosted PostgreSQL

```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE projecthub_prod;
CREATE USER projecthub_user WITH ENCRYPTED PASSWORD 'your-strong-password';
GRANT ALL PRIVILEGES ON DATABASE projecthub_prod TO projecthub_user;
\q
```

### Apply Database Migrations

```bash
# Set DATABASE_URL
export DATABASE_URL="your-production-database-url"

# Generate Prisma Client
npx prisma generate

# Apply migrations
npx prisma migrate deploy

# Optional: Seed initial data
npx prisma db seed (if seed script exists)
```

---

## 🌐 Deployment Options

### Option A: Vercel (Recommended for Next.js)
✅ **Pros**: Fastest, zero-config, built for Next.js, free tier  
❌ **Cons**: Vendor lock-in, serverless limitations

### Option B: Railway
✅ **Pros**: Simple, supports Docker, databases included  
❌ **Cons**: More expensive than Vercel

### Option C: AWS / Azure / GCP
✅ **Pros**: Full control, enterprise features  
❌ **Cons**: Complex setup, expensive

### Option D: Self-Hosted (VPS)
✅ **Pros**: Full control, cost-effective at scale  
❌ **Cons**: Requires DevOps knowledge

---

## 🚢 Vercel Deployment (Step-by-Step)

### Prerequisites
- GitHub/GitLab/Bitbucket account
- Code pushed to repository
- Vercel account (sign up at https://vercel.com)

### Step 1: Push Code to Git

```bash
# If not already initialized
git init
git add .
git commit -m "Initial commit for production"

# Create repository on GitHub, then:
git remote add origin https://github.com/yourusername/projecthub.git
git branch -M main
git push -u origin main
```

### Step 2: Import to Vercel

1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Import your Git repository
4. Select "Next.js" as framework preset
5. **DO NOT** deploy yet

### Step 3: Configure Environment Variables

In Vercel project settings:

1. Go to "Settings" → "Environment Variables"
2. Add each variable:
   - `DATABASE_URL` = your Neon/Supabase connection string
   - `NEXTAUTH_URL` = https://your-project.vercel.app (Vercel will provide this)
   - `NEXTAUTH_SECRET` = your generated secret
   - Add all other required variables
3. Select "Production" for each variable

### Step 4: Configure Build Settings

In Vercel project settings → "General":

```
Build Command: npx prisma generate && next build
Install Command: npm install
Output Directory: .next
```

### Step 5: Deploy

1. Click "Deploy"
2. Wait for build (5-10 minutes first time)
3. Check deployment logs for errors

### Step 6: Run Database Migrations

**Option A: Using Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Run migration
vercel env pull .env.production
npx prisma migrate deploy
```

**Option B: Using Vercel Dashboard**
1. Go to project → "Settings" → "Environment Variables"
2. Add build command: `npx prisma generate && npx prisma migrate deploy && next build`

### Step 7: Verify Deployment

1. Visit your Vercel URL (e.g., https://projecthub.vercel.app)
2. Test signup → creates account
3. Test login → works
4. Check all main pages load
5. Create a test project
6. Verify database has data

---

## 🔄 Alternative: Railway Deployment

### Step 1: Install Railway CLI

```bash
npm i -g @railway/cli
railway login
```

### Step 2: Initialize Project

```bash
railway init
railway link
```

### Step 3: Add PostgreSQL

```bash
railway add postgresql
```

### Step 4: Set Environment Variables

```bash
railway variables set NEXTAUTH_SECRET="your-secret"
railway variables set NEXTAUTH_URL="https://your-app.up.railway.app"
# Add other variables...
```

### Step 5: Deploy

```bash
railway up
```

---

## 🔄 Alternative: Docker Deployment

### Dockerfile

```dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: projecthub
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: projecthub_prod
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  app:
    build: .
    environment:
      DATABASE_URL: postgresql://projecthub:${DB_PASSWORD}@postgres:5432/projecthub_prod
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      NEXTAUTH_URL: ${NEXTAUTH_URL}
    ports:
      - "3000:3000"
    depends_on:
      - postgres

volumes:
  postgres_data:
```

### Deploy

```bash
docker-compose up -d
```

---

## ✅ Post-Deployment Steps

### 1. Create Super Admin Account

```bash
# Connect to production database
npx prisma studio --browser none

# Or use psql
psql $DATABASE_URL

# Update first user to SUPER_ADMIN
UPDATE "User" SET role = 'SUPER_ADMIN' WHERE email = 'admin@yourdomain.com';
```

### 2. Configure Custom Domain (Vercel)

1. Go to Project → "Settings" → "Domains"
2. Add your domain (e.g., `app.yourdomain.com`)
3. Update DNS records:
   - Type: `CNAME`
   - Name: `app` (or `@` for root)
   - Value: `cname.vercel-dns.com`
4. Wait for SSL certificate (5-10 minutes)
5. Update `NEXTAUTH_URL` to your custom domain

### 3. Set Up Monitoring

**Vercel Analytics (Built-in)**
- Go to Project → "Analytics"
- Enable "Web Analytics"
- Enable "Speed Insights"

**External Options:**
- **Sentry** (error tracking): https://sentry.io
- **LogRocket** (session replay): https://logrocket.com
- **Datadog** (full observability): https://datadoghq.com

### 4. Configure Backups

**For Neon:**
- Go to Neon dashboard → "Backups"
- Enable automatic backups (included in free tier)

**For Self-Hosted:**
```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > backup_$DATE.sql
# Upload to S3 or backup storage
EOF

# Schedule with cron
crontab -e
# Add: 0 2 * * * /path/to/backup.sh
```

### 5. Set Up SSL/TLS

**Vercel**: Automatic (Let's Encrypt)  
**Railway**: Automatic  
**Self-Hosted**: Use Certbot

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### 6. Configure Email (Optional)

**Using Gmail:**
1. Enable 2FA on Gmail
2. Create App Password
3. Set `SMTP_PASSWORD` to app password

**Using SendGrid:**
```bash
# Sign up at https://sendgrid.com
# Get API key
# Set SMTP_HOST=smtp.sendgrid.net
# Set SMTP_USER=apikey
# Set SMTP_PASSWORD=your-sendgrid-api-key
```

### 7. Test Critical Flows

- [ ] Sign up new user
- [ ] Login with new user
- [ ] Create a project
- [ ] Create a program
- [ ] Add team members
- [ ] Assign tasks
- [ ] Check audit logs
- [ ] Test data retention
- [ ] Verify SSO (if configured)

---

## 📊 Monitoring & Maintenance

### Daily Checks
- [ ] Application accessible
- [ ] No 5xx errors
- [ ] Database connections stable
- [ ] Disk space sufficient

### Weekly Checks
- [ ] Review error logs
- [ ] Check performance metrics
- [ ] Review audit logs
- [ ] Verify backups running

### Monthly Checks
- [ ] Update dependencies (`npm audit`)
- [ ] Review security settings
- [ ] Check for Prisma updates
- [ ] Review user feedback

### Performance Monitoring

**Key Metrics:**
- Response time (< 2s)
- Error rate (< 1%)
- Database query time (< 500ms)
- Uptime (> 99.9%)

**Tools:**
```bash
# Check response time
curl -o /dev/null -s -w "Time: %{time_total}s\n" https://yourdomain.com

# Monitor logs (Vercel)
vercel logs --follow

# Check database connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"
```

---

## 🔧 Troubleshooting

### Issue: Build Fails

```bash
# Check build logs
vercel logs

# Common fixes:
npm install          # Install dependencies
npx prisma generate  # Generate Prisma client
npm run build        # Test build locally
```

### Issue: Database Connection Error

```bash
# Test connection
psql $DATABASE_URL

# Check:
- Is DATABASE_URL correct?
- Is database accessible from deployment platform?
- Are firewall rules configured?
- Is SSL mode correct? (add ?sslmode=require)
```

### Issue: NextAuth Not Working

```bash
# Check:
1. NEXTAUTH_URL matches deployed URL
2. NEXTAUTH_SECRET is set
3. No trailing slash in NEXTAUTH_URL
4. Cookies not blocked by browser

# Debug mode:
# Add to env: NEXTAUTH_DEBUG=true
```

### Issue: Slow Performance

```bash
# Check:
1. Database indexes created
2. N+1 queries (check with Prisma logs)
3. Large payload sizes
4. Missing caching

# Enable Prisma query logs:
# In schema.prisma:
# generator client {
#   provider = "prisma-client-js"
#   log      = ["query", "info", "warn", "error"]
# }
```

### Issue: 404 on API Routes

```bash
# Check:
1. File structure: app/api/[route]/route.ts
2. Named export (GET, POST, etc.)
3. No syntax errors
4. Build succeeded
```

---

## 🚨 Emergency Procedures

### Rollback Deployment

**Vercel:**
```bash
vercel rollback
# Or from dashboard: Deployments → Previous → Promote
```

**Railway:**
```bash
railway rollback
```

### Database Restore

```bash
# From backup
psql $DATABASE_URL < backup_file.sql

# From Neon (auto-backups)
# Dashboard → Backups → Restore
```

### Scale Up (Traffic Spike)

**Vercel**: Automatic scaling (no action needed)  
**Railway**: Increase resources in dashboard  
**Self-Hosted**: Add more servers, configure load balancer

---

## 📝 Production Checklist Summary

### Before First Deploy
- [ ] Code committed to Git
- [ ] Database created (Neon/Supabase)
- [ ] Environment variables ready
- [ ] `NEXTAUTH_SECRET` generated
- [ ] Build succeeds locally

### During Deploy
- [ ] Repository connected to platform
- [ ] Environment variables set
- [ ] Build command configured
- [ ] First deployment successful
- [ ] Database migrations applied

### After Deploy
- [ ] Application accessible
- [ ] Signup/login works
- [ ] Database connected
- [ ] Create super admin
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active
- [ ] Monitoring enabled
- [ ] Backups configured
- [ ] Team members invited

### Ongoing
- [ ] Monitor errors daily
- [ ] Review logs weekly
- [ ] Update dependencies monthly
- [ ] Test backups quarterly
- [ ] Review security annually

---

## 🎉 Success Criteria

Your application is production-ready when:

✅ Users can sign up and log in  
✅ Projects can be created  
✅ Data persists in database  
✅ SSL/HTTPS working  
✅ Uptime > 99%  
✅ Response time < 3s  
✅ No critical errors  
✅ Backups running  
✅ Monitoring active  
✅ Team can access

---

## 📞 Support Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **Vercel Support**: https://vercel.com/support
- **Neon Docs**: https://neon.tech/docs
- **Community**: https://github.com/vercel/next.js/discussions

---

## 🚀 Quick Start Command Checklist

```bash
# 1. Prepare environment
cp .env .env.production
# Edit .env.production with production values

# 2. Test build locally
npm run build
npm start

# 3. Initialize Git (if not done)
git init
git add .
git commit -m "Production ready"
git push

# 4. Generate secret
openssl rand -base64 32

# 5. Deploy to Vercel
npm i -g vercel
vercel --prod

# 6. Run migrations
vercel env pull
npx prisma migrate deploy

# 7. Test
open https://your-project.vercel.app
```

---

**Last Updated**: November 2, 2025  
**Version**: 1.0  
**Status**: Production Ready ✅

---

## 🎯 Next Steps After Reading This Guide

1. **Choose your hosting platform** (Vercel recommended)
2. **Set up production database** (Neon recommended)
3. **Follow deployment steps** for your chosen platform
4. **Run post-deployment checklist**
5. **Monitor and maintain** your application

**Good luck with your deployment! 🚀**

