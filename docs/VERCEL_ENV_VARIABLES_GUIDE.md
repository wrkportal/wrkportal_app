# How to Set Environment Variables in Vercel

## 🎯 Quick Guide: Where to Find Environment Variables in Vercel

### Step 1: Navigate to Your Project

1. Go to [vercel.com](https://vercel.com)
2. **Sign in** to your account
3. Click on your **project** (or create a new one if you haven't)

### Step 2: Find Environment Variables Section

**Option A: Via Project Settings (Recommended)**

1. In your project dashboard, click on **"Settings"** (top navigation bar)
2. In the left sidebar, click on **"Environment Variables"**
3. You'll see a list of existing variables (if any)
4. Click **"Add New"** or **"Add"** button to add a new variable

**Option B: Via Project Overview**

1. In your project dashboard
2. Click on the **"Settings"** tab (next to Deployments, Analytics, etc.)
3. Click on **"Environment Variables"** in the left sidebar

**Visual Path**:
```
Vercel Dashboard → Your Project → Settings → Environment Variables
```

---

## 📝 How to Add Environment Variables

### Step-by-Step:

1. **Click "Add New"** or **"Add"** button
2. **Key**: Enter the variable name (e.g., `DATABASE_URL`)
3. **Value**: Enter the variable value (e.g., your Neon connection string)
4. **Environment**: Select which environments to apply to:
   - ✅ **Production** (for production deployments)
   - ✅ **Preview** (for preview deployments)
   - ✅ **Development** (for local development with `vercel dev`)
5. Click **"Save"**

### Example: Adding DATABASE_URL

1. **Key**: `DATABASE_URL`
2. **Value**: `postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/wrkportal?sslmode=require`
3. **Environment**: Select all three (Production, Preview, Development)
4. Click **"Save"**

---

## 🔍 If You Can't Find It

### Check These Things:

1. **Are you in the right project?**
   - Make sure you're viewing your project, not the dashboard
   - Click on your project name if you're on the main dashboard

2. **Do you have the right permissions?**
   - You need to be the project owner or have admin access
   - If you're a team member, ask the owner to add you as admin

3. **Is the project deployed?**
   - You can add environment variables even if the project isn't deployed yet
   - If you haven't created a project, create one first

4. **Try the direct URL**:
   - Go to: `https://vercel.com/[your-username]/[your-project]/settings/environment-variables`
   - Replace `[your-username]` and `[your-project]` with your actual values

---

## 📋 Required Environment Variables for Your App

### Database Variables

```bash
# Primary database (Neon.tech)
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/wrkportal?sslmode=require"

# Tier-based infrastructure (for future migration)
DATABASE_URL_NEON="postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/wrkportal?sslmode=require"
```

### Authentication Variables

```bash
NEXTAUTH_URL="https://your-domain.vercel.app"
NEXTAUTH_SECRET="your-secret-key-here"
```

### AI Variables (if using)

```bash
AI_PROVIDER="azure-openai"
AZURE_OPENAI_ENDPOINT="https://your-resource.openai.azure.com"
AZURE_OPENAI_API_KEY="your-api-key"
AZURE_OPENAI_API_VERSION="2024-02-15-preview"
AZURE_OPENAI_DEPLOYMENT_NAME="gpt-4"
```

### Other Variables

Add all other environment variables from your `.env` file that are needed for production.

---

## 🖼️ Visual Guide

### Where to Click:

```
┌─────────────────────────────────────┐
│  Vercel Dashboard                   │
│                                     │
│  [Projects] [Teams] [Settings]     │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Your Project Name             │  │
│  │                               │  │
│  │ [Overview] [Deployments]      │  │
│  │ [Analytics] [Settings] ←───┐  │  │
│  │                    ┌────────┘  │
│  └────────────────────┼───────────┘
│                       │
│  ┌────────────────────▼───────────┐
│  │ Settings                        │
│  │                                 │
│  │ • General                       │
│  │ • Environment Variables ←───┐  │
│  │ • Domains                    │  │
│  │ • Integrations               │  │
│  │                    ┌─────────┘  │
│  └────────────────────┼────────────┘
│                       │
│  ┌────────────────────▼────────────┐
│  │ Environment Variables            │
│  │                                  │
│  │ [Add New] button                │
│  │                                  │
│  │ Key: DATABASE_URL                │
│  │ Value: [your connection string]  │
│  │ Environment: ☑ Production        │
│  │            ☑ Preview             │
│  │            ☑ Development        │
│  │                                  │
│  │ [Save]                           │
│  └──────────────────────────────────┘
```

---

## 🔄 After Adding Variables

### Important Steps:

1. **Redeploy Your Project**
   - Environment variables are only applied to **new deployments**
   - Go to **Deployments** tab
   - Click **"Redeploy"** on your latest deployment
   - Or push a new commit to trigger a new deployment

2. **Verify Variables Are Set**
   - In your deployment logs, you should see the variables are loaded
   - You can also check in your app code (but don't log sensitive values!)

3. **Test Your Application**
   - Make sure your app connects to the database
   - Test authentication
   - Verify all features work

---

## 🛠️ Alternative: Using Vercel CLI

If you prefer command line:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link your project
vercel link

# Add environment variable
vercel env add DATABASE_URL production
# Then paste your connection string when prompted
```

---

## 📝 Local Development (.env file)

For local development, create a `.env` file in your project root:

```bash
# .env (local development)
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/wrkportal?sslmode=require"
DATABASE_URL_NEON="postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/wrkportal?sslmode=require"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret"
# ... other variables
```

**Note**: Never commit `.env` to Git! It should be in `.gitignore`.

---

## ❓ Still Can't Find It?

### Troubleshooting:

1. **Check if you're logged in**
   - Make sure you're signed in to Vercel

2. **Check if project exists**
   - If you haven't created a project yet, create one first
   - Go to Dashboard → "Add New" → "Project"

3. **Check browser console**
   - Open browser DevTools (F12)
   - Check for any JavaScript errors

4. **Try different browser**
   - Sometimes browser extensions can interfere

5. **Contact Support**
   - If nothing works, contact Vercel support
   - They're usually very responsive

---

## 🎯 Quick Checklist

- [ ] Logged into Vercel
- [ ] Selected your project
- [ ] Clicked "Settings" tab
- [ ] Found "Environment Variables" in left sidebar
- [ ] Clicked "Add New" button
- [ ] Added `DATABASE_URL` with your Neon connection string
- [ ] Selected all environments (Production, Preview, Development)
- [ ] Clicked "Save"
- [ ] Redeployed your project

---

**If you're still stuck, let me know what you see on your screen and I'll help you navigate!** 🚀
