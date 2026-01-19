# Quick Guide: Push to GitHub and Deploy to Vercel

## ✅ Good News!

Your Git repository is already set up and connected to GitHub! You just need to:
1. Commit your changes
2. Push to GitHub
3. Connect to Vercel

---

## Step 1: Commit Your Changes

### Option A: Commit Everything (Recommended for First Push)

```bash
# Navigate to your project
cd c:\Users\User\Desktop\KaamKaaj\webApps\codebase\wrkportal

# Add all files (including untracked)
git add .

# Commit with a message
git commit -m "Initial commit: wrkportal project with tier-based infrastructure"

# Push to GitHub
git push origin main
```

### Option B: Commit Staged Changes First, Then Add Others

```bash
# Commit already staged changes
git commit -m "Initial commit: wrkportal project with tier-based infrastructure"

# Add untracked files
git add .

# Commit untracked files
git commit -m "Add remaining files: docs, scripts, and new features"

# Push to GitHub
git push origin main
```

---

## Step 2: Verify Push to GitHub

1. Go to [github.com](https://github.com)
2. Navigate to your repository: `your-username/wrkportal`
3. Verify all files are there

---

## Step 3: Connect to Vercel

### 3.1 Import Project

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New"** → **"Project"**
3. Click **"Import Git Repository"**
4. Select **GitHub** (authorize if first time)
5. Find your repository: `wrkportal`
6. Click **"Import"**

### 3.2 Configure Project

Vercel will auto-detect Next.js. Verify:
- **Framework Preset**: Next.js ✅
- **Root Directory**: `./`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### 3.3 Add Environment Variables

**Before deploying**, add these in Vercel:

1. Scroll to **"Environment Variables"** section
2. Click **"Add"** for each:

**Required**:
```
DATABASE_URL = postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/wrkportal?sslmode=require
DATABASE_URL_NEON = postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/wrkportal?sslmode=require
NEXTAUTH_URL = https://your-app.vercel.app (update after first deploy)
NEXTAUTH_SECRET = your-secret-key-here
```

**AI Variables** (if using):
```
AI_PROVIDER = azure-openai
AZURE_OPENAI_ENDPOINT = https://your-resource.openai.azure.com
AZURE_OPENAI_API_KEY = your-api-key
AZURE_OPENAI_API_VERSION = 2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT_NAME = gpt-4
```

**Important**: 
- Select **all environments** (Production, Preview, Development)
- You can update `NEXTAUTH_URL` after first deployment

### 3.4 Deploy

1. Click **"Deploy"**
2. Wait 2-5 minutes for build
3. Vercel will give you a URL: `https://your-app.vercel.app`

---

## 🚨 Important Notes

### Before Pushing

**Make sure `.env` is in `.gitignore`** (it already is! ✅)

Your `.gitignore` includes:
- `.env` ✅
- `node_modules/` ✅
- `.next/` ✅

**Never commit sensitive data!**

### After First Deployment

1. **Update `NEXTAUTH_URL`**:
   - Go to Vercel → Settings → Environment Variables
   - Update `NEXTAUTH_URL` to your actual Vercel URL
   - Redeploy

2. **Test Your Application**:
   - Visit your Vercel URL
   - Test login/signup
   - Test database connection

---

## 📋 Quick Checklist

- [ ] Commit all changes: `git add .` then `git commit -m "message"`
- [ ] Push to GitHub: `git push origin main`
- [ ] Verify code is on GitHub
- [ ] Import project in Vercel
- [ ] Add environment variables
- [ ] Deploy
- [ ] Update `NEXTAUTH_URL` after first deploy
- [ ] Test application

---

## 🛠️ Troubleshooting

### Git Push Issues

**Problem**: "Authentication failed"
- **Solution**: Use Personal Access Token (see below)

**Problem**: "Branch not found"
- **Solution**: Check branch name: `git branch` (should be `main`)

### Vercel Deployment Issues

**Problem**: "Build failed"
- **Solution**: Check build logs in Vercel dashboard

**Problem**: "Environment variables not found"
- **Solution**: Make sure you added them in Vercel → Settings → Environment Variables

---

## 🔐 GitHub Authentication (If Needed)

If Git asks for credentials:

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click **"Generate new token (classic)"**
3. Name: "Vercel Deployment"
4. Select scope: ✅ **repo**
5. Click **"Generate token"**
6. **Copy the token** (you won't see it again!)
7. When Git asks for password, **paste the token** instead

---

**You're almost there!** 🚀

Just commit, push, and connect to Vercel!
