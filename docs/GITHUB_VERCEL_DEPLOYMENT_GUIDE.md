# GitHub + Vercel Deployment Guide

## 🎯 Overview

Vercel requires your code to be in a Git repository (GitHub, GitLab, or Bitbucket) to deploy. This guide will help you:

1. ✅ Push your code to GitHub
2. ✅ Connect GitHub to Vercel
3. ✅ Deploy your application

---

## Step 1: Check if Git is Initialized

### Check Current Status

Open terminal in your project directory and run:

```bash
git status
```

**If you see**: "fatal: not a git repository"
- You need to initialize Git (see Step 2)

**If you see**: List of files and changes
- Git is already initialized (skip to Step 3)

---

## Step 2: Initialize Git Repository (If Needed)

### 2.1 Initialize Git

```bash
# Navigate to your project
cd c:\Users\User\Desktop\KaamKaaj\webApps\codebase\wrkportal

# Initialize Git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: wrkportal project"
```

### 2.2 Verify .gitignore is Working

Make sure `.gitignore` includes:
- `.env` (environment variables - never commit!)
- `node_modules/`
- `.next/`
- Other sensitive files

Your `.gitignore` already has these, so you're good! ✅

---

## Step 3: Create GitHub Repository

### 3.1 Create New Repository on GitHub

1. Go to [github.com](https://github.com)
2. Click **"+"** (top right) → **"New repository"**
3. **Repository name**: `wrkportal` (or your preferred name)
4. **Description**: "AI-Powered Project Management Platform"
5. **Visibility**: 
   - ✅ **Private** (recommended for production code)
   - OR **Public** (if you want it open source)
6. **DO NOT** check:
   - ❌ "Add a README file" (you already have code)
   - ❌ "Add .gitignore" (you already have one)
   - ❌ "Choose a license" (optional, add later if needed)
7. Click **"Create repository"**

### 3.2 Copy Repository URL

After creating, GitHub will show you the repository URL. Copy it:
- **HTTPS**: `https://github.com/your-username/wrkportal.git`
- **SSH**: `git@github.com:your-username/wrkportal.git`

Use **HTTPS** if you're not sure (easier for beginners).

---

## Step 4: Push Code to GitHub

### 4.1 Add Remote Repository

```bash
# Make sure you're in your project directory
cd c:\Users\User\Desktop\KaamKaaj\webApps\codebase\wrkportal

# Add GitHub as remote (replace with your actual URL)
git remote add origin https://github.com/your-username/wrkportal.git

# Verify remote was added
git remote -v
```

### 4.2 Push Code to GitHub

```bash
# Push to GitHub (first time)
git push -u origin main

# If you get error about branch name, try:
git push -u origin master
```

**Note**: If you haven't set up Git credentials, GitHub will prompt you to:
- Use **Personal Access Token** (recommended)
- OR use **GitHub Desktop** (easier GUI option)

### 4.3 Set Up Git Credentials (If Needed)

**Option A: Personal Access Token (Recommended)**

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click **"Generate new token (classic)"**
3. Give it a name: "Vercel Deployment"
4. Select scopes: ✅ **repo** (full control of private repositories)
5. Click **"Generate token"**
6. **Copy the token** (you won't see it again!)
7. When Git asks for password, paste the token instead

**Option B: GitHub Desktop (Easier)**

1. Download [GitHub Desktop](https://desktop.github.com/)
2. Sign in with your GitHub account
3. Add your repository
4. Commit and push through the GUI

---

## Step 5: Connect GitHub to Vercel

### 5.1 Import Project in Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New"** → **"Project"**
3. Click **"Import Git Repository"**
4. Select **GitHub** (or authorize if first time)
5. Find your repository: `wrkportal`
6. Click **"Import"**

### 5.2 Configure Project Settings

Vercel will auto-detect Next.js, but verify:

- **Framework Preset**: Next.js ✅
- **Root Directory**: `./` (default)
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `npm install` (auto-detected)

### 5.3 Add Environment Variables

**Before deploying**, add environment variables:

1. In the project configuration page, scroll to **"Environment Variables"**
2. Click **"Add"** for each variable:

**Required Variables**:
```
DATABASE_URL = postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/wrkportal?sslmode=require
DATABASE_URL_NEON = postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/wrkportal?sslmode=require
NEXTAUTH_URL = https://your-app.vercel.app (will be provided after first deploy)
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

### 5.4 Deploy

1. Click **"Deploy"**
2. Wait for build to complete (2-5 minutes)
3. Vercel will provide you with a URL: `https://your-app.vercel.app`

---

## Step 6: Update NEXTAUTH_URL

### After First Deployment

1. Copy your Vercel deployment URL (e.g., `https://wrkportal.vercel.app`)
2. Go to Vercel → Your Project → Settings → Environment Variables
3. Update `NEXTAUTH_URL` to your actual Vercel URL
4. Redeploy (or push a new commit)

---

## 🔄 Continuous Deployment

### Automatic Deployments

Once connected, Vercel will automatically:
- ✅ Deploy when you push to `main` branch (Production)
- ✅ Create preview deployments for pull requests
- ✅ Rebuild on every commit

### Manual Deployment

You can also trigger deployments manually:
- Vercel Dashboard → Deployments → "Redeploy"

---

## 📋 Quick Checklist

### Before Deployment

- [ ] Code is pushed to GitHub
- [ ] GitHub repository is created
- [ ] Vercel account is created
- [ ] Project is imported in Vercel
- [ ] Environment variables are added
- [ ] Neon database is set up
- [ ] Connection string is ready

### After Deployment

- [ ] Build completed successfully
- [ ] Application is accessible
- [ ] Database connection works
- [ ] Authentication works
- [ ] Update `NEXTAUTH_URL` with actual domain
- [ ] Test all features

---

## 🛠️ Troubleshooting

### Git Push Issues

**Problem**: "Authentication failed"
- **Solution**: Use Personal Access Token instead of password

**Problem**: "Branch not found"
- **Solution**: Check branch name: `git branch` (should be `main` or `master`)

**Problem**: "Remote already exists"
- **Solution**: Remove and re-add: `git remote remove origin` then `git remote add origin [url]`

### Vercel Deployment Issues

**Problem**: "Build failed"
- **Solution**: Check build logs in Vercel dashboard for errors

**Problem**: "Environment variables not found"
- **Solution**: Make sure you added them in Vercel → Settings → Environment Variables

**Problem**: "Database connection failed"
- **Solution**: Verify `DATABASE_URL` is correct and uses pooler connection string

---

## 🎯 Next Steps After Deployment

1. ✅ **Test Your Application**
   - Visit your Vercel URL
   - Test login/signup
   - Test database operations

2. ✅ **Set Up Custom Domain** (Optional)
   - Vercel → Settings → Domains
   - Add your custom domain

3. ✅ **Monitor Deployments**
   - Check Vercel dashboard for deployment status
   - Monitor error logs

4. ✅ **Set Up CI/CD** (Already done!)
   - Every push to `main` = Production deployment
   - Every PR = Preview deployment

---

## 📝 Summary

**What You Need**:
1. ✅ GitHub account
2. ✅ Vercel account
3. ✅ Code pushed to GitHub
4. ✅ Neon database connection string
5. ✅ Environment variables configured

**Steps**:
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy
5. Update `NEXTAUTH_URL`
6. Test!

---

**You're ready to deploy!** 🚀

Once your code is on GitHub, connecting to Vercel is just a few clicks!
