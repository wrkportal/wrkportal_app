# Quick Start: Deploy via GitHub

## 🚀 5-Minute Setup

### Step 1: Push to GitHub

```bash
# If not already a git repo
git init
git add .
git commit -m "Initial commit"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/wrkportal.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "Add New" → "Project"
4. Select your `wrkportal` repository
5. Click "Import"

### Step 3: Add Environment Variables

In Vercel project settings → Environment Variables, add:

```
DATABASE_URL=postgresql://neondb_owner:npg_SnpI8CJtT4Xz@ep-royal-frost-ahzg2vyw-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-secret-here
INFRASTRUCTURE_MODE=neon
```

*(Add other variables as needed - see full guide)*

### Step 4: Deploy

1. Click "Deploy"
2. Wait 2-5 minutes
3. Visit your app URL!

### Step 5: Run Migrations

```bash
# Set your DATABASE_URL
export DATABASE_URL="your-neon-connection-string"

# Run migrations
npx prisma generate
npx prisma migrate deploy
```

---

## ✅ Done!

Your app is now live at `https://your-app.vercel.app`

**Cost: $0/month** (Neon.tech free tier + Vercel free tier)

---

## 📚 Full Guide

See `docs/GITHUB_DEPLOYMENT_GUIDE.md` for detailed instructions.
