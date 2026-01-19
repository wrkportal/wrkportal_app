# AWS Amplify Deployment Guide

## 📋 Prerequisites

Before starting, ensure you have:

- ✅ AWS Account (create at [aws.amazon.com](https://aws.amazon.com))
- ✅ Git repository (GitHub, GitLab, or Bitbucket)
- ✅ Next.js application ready (your current app)
- ✅ Environment variables list (from `env.template`)
- ✅ PostgreSQL database ready (see [AWS Database Recommendations](./AWS_DATABASE_RECOMMENDATIONS.md))

---

## 🚀 Step-by-Step Deployment

### Step 1: Prepare Your Repository

#### 1.1 Commit All Changes
```bash
# Ensure all changes are committed
git add .
git commit -m "Prepare for AWS Amplify deployment"
git push origin main
```

#### 1.2 Verify Build Command
Your `package.json` should have:
```json
{
  "scripts": {
    "build": "prisma generate && prisma db push && next build"
  }
}
```

**Note:** For production, use `prisma migrate deploy` instead of `prisma db push`.

#### 1.3 Create `amplify.yml` (Optional - Amplify Auto-Detects Next.js)

Create `amplify.yml` in your project root:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
        - npx prisma generate
    build:
      commands:
        - npx prisma migrate deploy || npx prisma db push
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

**Save as:** `amplify.yml` in project root

---

### Step 2: Deploy to AWS Amplify

#### Method A: Via AWS Console (Recommended for First Time)

1. **Sign in to AWS Console**
   - Go to [console.aws.amazon.com](https://console.aws.amazon.com)
   - Sign in with your AWS account

2. **Open AWS Amplify**
   - Search for "Amplify" in the AWS Console
   - Click "AWS Amplify"
   - Click "New app" → "Host web app"

3. **Connect Repository**
   - Choose your Git provider (GitHub, GitLab, Bitbucket)
   - Authorize AWS Amplify to access your repository
   - Select your repository
   - Select branch (`main` or `master`)

4. **Configure Build Settings**
   - **App name**: Your app name (e.g., `wrkportal`)
   - **Environment**: `production` (or `staging`)

   **Build Settings:**
   - AWS Amplify auto-detects Next.js
   - Verify build command: `npm run build`
   - Verify base directory: `/` (default)

5. **Add Environment Variables**
   - Click "Advanced settings" → "Environment variables"
   - Add each variable from your `env.template`:

   **Required Variables:**
   ```
   DATABASE_URL=postgresql://username:password@host:5432/database?sslmode=require
   NEXTAUTH_URL=https://your-app-id.amplifyapp.com
   NEXTAUTH_SECRET=your-nextauth-secret-here
   ```

   **Add all variables** (see [Environment Variables](#environment-variables) section below)

6. **Review and Deploy**
   - Review configuration
   - Click "Save and deploy"
   - Amplify will start building your app

7. **Wait for Build**
   - Build typically takes 3-5 minutes
   - Monitor progress in the Amplify console
   - Check logs if build fails

---

#### Method B: Via AWS CLI (Advanced)

```bash
# Install AWS CLI (if not installed)
# Windows: Download from aws.amazon.com/cli
# Mac: brew install awscli
# Linux: sudo apt-get install awscli

# Configure AWS credentials
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Enter default region (e.g., us-east-1)
# Enter output format (json)

# Install Amplify CLI
npm install -g @aws-amplify/cli

# Initialize Amplify in your project
amplify init

# Add hosting (Amplify Console)
amplify add hosting

# Push to Amplify
amplify publish
```

---

### Step 3: Configure Environment Variables

#### 3.1 Required Variables

Add these in AWS Amplify Console → Your App → Environment Variables:

```bash
# Database
DATABASE_URL=postgresql://username:password@host:5432/database?sslmode=require

# NextAuth
NEXTAUTH_URL=https://your-app-id.amplifyapp.com
NEXTAUTH_SECRET=generate-using-openssl-rand-base64-32

# Google OAuth (if using)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email Service
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourcompany.com

# AI Services (if using)
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4

# CI/CD Webhooks
GITHUB_WEBHOOK_SECRET=your-github-webhook-secret
JENKINS_WEBHOOK_TOKEN=your-jenkins-webhook-token

# Encryption
REPORTING_STUDIO_ENCRYPTION_KEY=generate-using-openssl-rand-base64-32
```

#### 3.2 Generate Secrets

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate REPORTING_STUDIO_ENCRYPTION_KEY
openssl rand -base64 32

# Generate GITHUB_WEBHOOK_SECRET
openssl rand -base64 32
```

#### 3.3 Update NEXTAUTH_URL

After deployment, update `NEXTAUTH_URL`:
- Development: `http://localhost:3000`
- Production: `https://your-app-id.amplifyapp.com` (Amplify URL)
- Custom Domain: `https://your-domain.com` (if configured)

---

### Step 4: Set Up PostgreSQL Database

#### Option A: Create Database via AWS Console

1. **Open RDS Console**
   - Go to AWS Console → RDS
   - Click "Create database"

2. **Choose Database Configuration**
   - **Engine type**: PostgreSQL
   - **Version**: 15.x or latest
   - **Templates**: Production (for Aurora Serverless v2) or Dev/Test (for RDS)

3. **Configure Settings**
   - **DB instance identifier**: `wrkportal-db` (or your name)
   - **Master username**: `postgres` (or your choice)
   - **Master password**: Strong password (save this!)
   - **DB instance size**: 
     - Aurora Serverless v2: Min 0.5 ACU, Max 32 ACU
     - RDS: db.t3.medium (for production)

4. **Storage & Connectivity**
   - **Storage**: 20 GB minimum (scales automatically)
   - **VPC**: Default VPC or create new
   - **Public access**: Yes (for Amplify) or No (with VPN)
   - **Security group**: Create new or use existing

5. **Database Authentication**
   - **Database authentication**: Password authentication
   - **Encryption**: Enable encryption at rest (recommended)

6. **Backup & Monitoring**
   - **Backup retention**: 7 days (recommended)
   - **Enable enhanced monitoring**: Yes (optional)

7. **Create Database**
   - Review settings
   - Click "Create database"
   - Wait 5-10 minutes for database to be ready

8. **Get Connection String**
   - After database is ready, click on it
   - Copy "Endpoint" (hostname)
   - Format: `your-db-instance.xxxxx.region.rds.amazonaws.com:5432`
   - Update `DATABASE_URL` in Amplify environment variables

#### Option B: Use Existing Database

If you already have a PostgreSQL database (Neon, Supabase, etc.), just update `DATABASE_URL` in Amplify environment variables.

---

### Step 5: Run Database Migrations

#### Option A: Via Build Command (Recommended)

Update your `amplify.yml` (if using):

```yaml
build:
  commands:
    - npx prisma generate
    - npx prisma migrate deploy  # For production
    - npm run build
```

#### Option B: Manual Migration (One-Time Setup)

```bash
# Pull environment variables locally
# (Get DATABASE_URL from Amplify Console → Environment Variables)

# Set DATABASE_URL locally
export DATABASE_URL="postgresql://username:password@host:5432/database?sslmode=require"

# Run migrations
npx prisma migrate deploy

# Or push schema (development only)
npx prisma db push
```

---

### Step 6: Configure Custom Domain (Optional)

#### 6.1 Add Custom Domain in Amplify

1. **Open AWS Amplify Console**
   - Go to your app → "Domain management"
   - Click "Add domain"

2. **Enter Domain**
   - Enter your domain (e.g., `app.yourcompany.com`)
   - Click "Configure domain"

3. **Configure DNS**
   - Amplify provides DNS records (CNAME, A records)
   - Add these to your domain registrar (GoDaddy, Namecheap, etc.)
   - Wait for DNS propagation (5-60 minutes)

4. **SSL Certificate**
   - Amplify automatically provisions SSL certificate via AWS Certificate Manager
   - Wait for SSL validation (usually automatic with DNS validation)
   - Domain is ready when SSL status is "Issued"

#### 6.2 Update Environment Variables

After custom domain is configured:
- Update `NEXTAUTH_URL` to `https://your-domain.com`
- Update `GOOGLE_CLIENT_ID` redirect URIs (if using Google OAuth)

---

### Step 7: Configure Webhooks (CI/CD)

#### 7.1 GitHub Webhook

**After deployment, update webhook URL in GitHub:**

1. **Get Amplify URL**
   - Your app URL: `https://your-app-id.amplifyapp.com`
   - Webhook URL: `https://your-app-id.amplifyapp.com/api/developer/webhooks/github`

2. **Update GitHub Webhook**
   - Go to your GitHub repository → Settings → Webhooks
   - Add webhook or edit existing
   - **Payload URL**: `https://your-app-id.amplifyapp.com/api/developer/webhooks/github`
   - **Content type**: `application/json`
   - **Secret**: Your `GITHUB_WEBHOOK_SECRET` value
   - **Events**: Select "push" and "workflow_run"

#### 7.2 Jenkins Webhook

**Update Jenkins webhook URL:**

1. **Get Amplify URL**
   - Webhook URL: `https://your-app-id.amplifyapp.com/api/developer/webhooks/jenkins`

2. **Configure Jenkins**
   - Update Generic Webhook Trigger plugin
   - **URL**: `https://your-app-id.amplifyapp.com/api/developer/webhooks/jenkins`
   - **Header**: `X-Jenkins-Token: your-jenkins-webhook-token`

---

## ✅ Post-Deployment Checklist

### 1. Verify Application
- [ ] Visit your Amplify URL: `https://your-app-id.amplifyapp.com`
- [ ] Check that app loads correctly
- [ ] Test authentication (login/signup)
- [ ] Verify database connection

### 2. Test Features
- [ ] User authentication works
- [ ] Database operations succeed
- [ ] API endpoints respond correctly
- [ ] File uploads work (if applicable)

### 3. Configure OAuth (If Using)
- [ ] Update Google OAuth redirect URIs:
  - `https://your-app-id.amplifyapp.com/api/auth/callback/google`
- [ ] Update other OAuth providers similarly

### 4. Monitor & Optimize
- [ ] Check CloudWatch logs for errors
- [ ] Monitor database connections
- [ ] Set up CloudWatch alarms (optional)
- [ ] Review build logs for warnings

### 5. Backup & Security
- [ ] Verify database backups are enabled
- [ ] Check SSL certificate is valid
- [ ] Review security group rules
- [ ] Enable CloudWatch monitoring

---

## 🔍 Troubleshooting

### Common Issues

#### 1. Build Fails with Prisma Error
**Problem:** `Error: Can't reach database server`

**Solution:**
- Verify `DATABASE_URL` is correct in Amplify environment variables
- Check database security group allows Amplify IPs
- Ensure database is in same region as Amplify (recommended)
- Check database is accessible (not in private subnet without VPN)

#### 2. Authentication Not Working
**Problem:** OAuth redirects fail

**Solution:**
- Update `NEXTAUTH_URL` to Amplify URL (not localhost)
- Update OAuth redirect URIs in provider dashboard
- Check `NEXTAUTH_SECRET` is set correctly
- Verify environment variables are saved (not just typed)

#### 3. Environment Variables Not Loading
**Problem:** Variables undefined in production

**Solution:**
- Ensure variables are saved in Amplify Console (not just typed)
- Redeploy after adding new environment variables
- Check variable names match exactly (case-sensitive)
- Verify variables are set for correct branch/environment

#### 4. Database Connection Pool Exhausted
**Problem:** Too many database connections

**Solution:**
- Use connection pooler (Aurora has built-in pooling)
- Add `connection_limit=10` to `DATABASE_URL`
- Use RDS Proxy for connection pooling (advanced)
- Check for connection leaks in code

#### 5. Custom Domain Not Working
**Problem:** Domain shows "Not secure" or doesn't load

**Solution:**
- Verify DNS records are correct in domain registrar
- Wait for DNS propagation (can take up to 48 hours)
- Check SSL certificate status in Amplify Console
- Ensure domain is verified (CNAME record must be correct)

---

## 📊 Cost Estimation (Monthly)

### AWS Amplify
- **Hosting**: Free tier available (up to 100 GB bandwidth/month)
- **Build minutes**: Free tier (1000 minutes/month)
- **Beyond free tier**: ~$0.01 per build minute

### AWS RDS (Database)
- **Aurora Serverless v2**: ~$50-300/month (variable)
- **RDS db.t3.medium**: ~$60/month (fixed)
- **Storage**: ~$0.10/GB/month

### Total Estimated Cost
- **Small app**: ~$50-100/month
- **Medium app**: ~$100-300/month
- **Large app**: ~$300-1000/month

**Cost Optimization:**
- Use Amplify free tier (if within limits)
- Use Aurora Serverless (scales to zero)
- Use RDS Reserved Instances (save up to 72%)

---

## 🎯 Quick Reference

### Important URLs

**After Deployment:**
- **App URL**: `https://your-app-id.amplifyapp.com`
- **Custom Domain**: `https://your-domain.com` (if configured)
- **GitHub Webhook**: `https://your-app-id.amplifyapp.com/api/developer/webhooks/github`
- **Jenkins Webhook**: `https://your-app-id.amplifyapp.com/api/developer/webhooks/jenkins`

### Important Commands

```bash
# Check deployment status
aws amplify get-app --app-id your-app-id

# View build logs
aws amplify list-jobs --app-id your-app-id --branch-name main

# Update environment variables
# (Use Amplify Console → Environment Variables)
```

---

## 📚 Additional Resources

- [AWS Amplify Documentation](https://docs.amplify.aws/)
- [Next.js Deployment on AWS](https://nextjs.org/docs/deployment#aws-amplify)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)
- [AWS RDS Documentation](https://docs.aws.amazon.com/rds/)

---

## 🆘 Need Help?

If you encounter issues:

1. **Check Build Logs**: AWS Amplify Console → Your App → Build History
2. **Check CloudWatch Logs**: AWS Console → CloudWatch → Log groups
3. **Review Environment Variables**: Ensure all variables are set correctly
4. **Verify Database Connection**: Test connection string independently
5. **Check AWS Status**: [status.aws.amazon.com](https://status.aws.amazon.com)

---

## ✅ Ready to Deploy?

1. ✅ **Database chosen** (see [AWS Database Recommendations](./AWS_DATABASE_RECOMMENDATIONS.md))
2. ✅ **Repository ready** (all changes committed)
3. ✅ **Environment variables prepared** (secrets generated)
4. ✅ **AWS account created** (console.aws.amazon.com)

**Next Steps:**
1. Follow Step 2 above (Deploy to AWS Amplify)
2. Configure environment variables (Step 3)
3. Set up database (Step 4)
4. Test deployment (Post-Deployment Checklist)

**Let's deploy! 🚀**
