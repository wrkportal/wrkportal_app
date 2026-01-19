# GitHub Deployment Guide - Hybrid Approach

## Overview

This guide walks you through deploying your WorkPortal application via GitHub using the hybrid approach:
- **Phase 1 (Now)**: Neon.tech database + Vercel hosting (free tier)
- **Phase 2 (Later)**: AWS Aurora + AWS Amplify (when you have paying customers)

---

## Prerequisites

- ✅ GitHub account
- ✅ Neon.tech database (already set up - you have the connection string)
- ✅ Code pushed to GitHub repository
- ✅ Node.js 18+ installed locally (for testing)

---

## Step 1: Push Code to GitHub

### 1.1 Initialize Git (if not already done)

```bash
# Check if git is initialized
git status

# If not initialized, run:
git init
git add .
git commit -m "Initial commit: Hybrid infrastructure setup"
```

### 1.2 Create GitHub Repository

1. **Go to GitHub**
   - Navigate to https://github.com/new
   - Repository name: `wrkportal` (or your preferred name)
   - Visibility: **Private** (recommended) or Public
   - **Don't** initialize with README, .gitignore, or license (you already have these)

2. **Click "Create repository"**

### 1.3 Push Code to GitHub

```bash
# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/wrkportal.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**If you get authentication errors:**
- Use GitHub Personal Access Token instead of password
- Or use SSH: `git@github.com:YOUR_USERNAME/wrkportal.git`

---

## Step 2: Set Up Vercel Deployment (Phase 1 - Free Hosting)

### 2.1 Connect GitHub to Vercel

1. **Go to Vercel**
   - Navigate to https://vercel.com
   - Sign up or log in with GitHub

2. **Import Project**
   - Click "Add New" → "Project"
   - Select your GitHub repository (`wrkportal`)
   - Click "Import"

3. **Configure Project**
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)

4. **Environment Variables**
   - Click "Environment Variables"
   - Add the following variables:

**Required Variables:**
```
DATABASE_URL=postgresql://neondb_owner:npg_SnpI8CJtT4Xz@ep-royal-frost-ahzg2vyw-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=generate-using-openssl-rand-base64-32
INFRASTRUCTURE_MODE=neon
```

**AI Configuration (if using):**
```
AI_PROVIDER=azure-openai
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_KEY=your-azure-openai-api-key
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4
AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME=text-embedding-ada-002
```

**Email Configuration:**
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourcompany.com
```

**OAuth (if using):**
```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 2.2 Deploy

1. **Click "Deploy"**
   - Vercel will build and deploy your application
   - Wait 2-5 minutes for deployment to complete

2. **Get Your URL**
   - After deployment, you'll get a URL like: `https://wrkportal-xxxxx.vercel.app`
   - Update `NEXTAUTH_URL` with this URL
   - Redeploy if needed

### 2.3 Run Prisma Migrations

After first deployment, run migrations:

```bash
# Set DATABASE_URL to your Neon.tech connection string
export DATABASE_URL="postgresql://neondb_owner:npg_SnpI8CJtT4Xz@ep-royal-frost-ahzg2vyw-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy
```

**Or use Vercel CLI:**
```bash
# Install Vercel CLI
npm i -g vercel

# Link to your project
vercel link

# Run migrations via Vercel
vercel env pull .env.local
npx prisma migrate deploy
```

---

## Step 3: Verify Deployment

### 3.1 Test Application

1. **Visit Your URL**
   - Go to `https://your-app.vercel.app`
   - Test signup/login
   - Test database operations

2. **Check Logs**
   - Go to Vercel Dashboard → Your Project → Deployments
   - Click on latest deployment → "View Function Logs"
   - Check for any errors

### 3.2 Monitor Database

1. **Check Neon.tech Dashboard**
   - Go to https://console.neon.tech
   - Verify database is being used
   - Check connection count

---

## Step 4: Set Up GitHub Actions (Optional - CI/CD)

### 4.1 Create GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Generate Prisma Client
        run: npx prisma generate
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
      
      - name: Run tests
        run: npm test
        continue-on-error: true
      
      - name: Build
        run: npm run build
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### 4.2 Add GitHub Secrets

1. **Go to GitHub Repository**
   - Settings → Secrets and variables → Actions
   - Click "New repository secret"

2. **Add Secrets:**
   - `DATABASE_URL`: Your Neon.tech connection string

---

## Step 5: Configure Custom Domain (Optional)

### 5.1 Add Domain in Vercel

1. **Go to Vercel Dashboard**
   - Your Project → Settings → Domains
   - Click "Add Domain"

2. **Enter Domain**
   - Enter your domain (e.g., `app.yourcompany.com`)
   - Click "Add"

3. **Configure DNS**
   - Add CNAME record in your DNS provider
   - Point to Vercel domain (shown in Vercel)

4. **Update NEXTAUTH_URL**
   - Update environment variable with your custom domain
   - Redeploy

---

## Phase 2: Migrate to AWS (When Ready)

### When to Migrate

- ✅ You have 10-20 paying customers
- ✅ Monthly revenue covers AWS costs (~$200-360/month)
- ✅ You need enterprise-grade infrastructure

### Migration Steps

1. **Set Up AWS Aurora** (see `docs/AWS_ONLY_DEPLOYMENT_GUIDE.md` Step 1)
2. **Set Up AWS S3** (see `docs/AWS_ONLY_DEPLOYMENT_GUIDE.md` Step 2)
3. **Set Up AWS Amplify** (see `docs/AWS_ONLY_DEPLOYMENT_GUIDE.md` Step 3)
4. **Update Environment Variables:**
   ```
   INFRASTRUCTURE_MODE=aws
   DATABASE_URL_AURORA=your-aurora-connection-string
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your-access-key
   AWS_SECRET_ACCESS_KEY=your-secret-key
   S3_BUCKET_NAME=your-bucket-name
   ```
5. **Migrate Data** (from Neon to Aurora)
6. **Update File Upload Routes** (to use S3)
7. **Deploy to AWS Amplify**
8. **Test and Switch DNS**

---

## Troubleshooting

### Build Failures

**Problem**: Build fails in Vercel  
**Solution**:
- Check build logs in Vercel Dashboard
- Verify environment variables are set
- Check Node.js version compatibility
- Ensure Prisma migrations run successfully

### Database Connection Issues

**Problem**: Cannot connect to Neon.tech  
**Solution**:
- Verify `DATABASE_URL` is correct
- Check Neon.tech dashboard for connection status
- Ensure IP allowlist allows Vercel IPs (if configured)
- Test connection locally first

### Environment Variables Not Working

**Problem**: Environment variables not available in app  
**Solution**:
- Verify variables are set in Vercel Dashboard
- Redeploy after adding variables
- Check variable names match exactly (case-sensitive)
- Use `process.env.VARIABLE_NAME` in code

### Prisma Migration Issues

**Problem**: Migrations fail  
**Solution**:
- Run migrations locally first
- Check database connection string
- Verify Prisma schema is up to date
- Check migration files in `prisma/migrations/`

---

## Cost Summary

### Phase 1 (Current Setup)

- **Neon.tech**: $0/month (free tier: 500 MB)
- **Vercel**: $0/month (Hobby plan: free)
- **Total**: **$0/month** ✅

### Phase 2 (After Migration)

- **AWS Aurora**: ~$45-180/month
- **AWS S3**: ~$10-50/month
- **AWS Amplify**: ~$20-100/month
- **Total**: ~$75-330/month

---

## Next Steps

1. ✅ Push code to GitHub
2. ✅ Connect GitHub to Vercel
3. ✅ Add environment variables
4. ✅ Deploy to Vercel
5. ✅ Run Prisma migrations
6. ✅ Test application
7. ✅ Set up custom domain (optional)
8. ⏳ Monitor usage and costs
9. ⏳ Migrate to AWS when ready (10-20 paying customers)

---

**You're all set!** 🎉

Your application is now deployed via GitHub and running on Vercel with Neon.tech database. When you're ready to scale, follow the migration guide to move to AWS.
