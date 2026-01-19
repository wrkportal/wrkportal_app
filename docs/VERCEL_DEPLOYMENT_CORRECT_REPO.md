# Vercel Deployment - Correct Repository

## Repository Information

Based on what you're seeing on GitHub, your repository is likely:
- **Organization/Username**: `wrkportal`
- **Repository Name**: `wrkportal`
- **Full Path**: `wrkportal/wrkportal`

---

## Step-by-Step Vercel Deployment

### Step 1: Go to Vercel

1. Visit https://vercel.com
2. Sign in with GitHub (use the same GitHub account that has access to `wrkportal/wrkportal`)

### Step 2: Import Project

1. Click **"Add New"** → **"Project"**
2. You should see a list of your GitHub repositories
3. **Look for**: `wrkportal/wrkportal` (not `sandeep200680/wrkportal`)
4. Click **"Import"** next to `wrkportal/wrkportal`

### Step 3: Configure Project

Vercel should auto-detect Next.js. Verify:
- **Framework Preset**: Next.js ✅
- **Root Directory**: `./` (default)
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` (default)

### Step 4: Add Environment Variables

**Before clicking Deploy**, add these environment variables:

Go to: **Environment Variables** section (or add them after import in Project Settings)

**Required Variables:**

```
DATABASE_URL=postgresql://neondb_owner:npg_SnpI8CJtT4Xz@ep-royal-frost-ahzg2vyw-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
INFRASTRUCTURE_MODE=neon
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-secret-here
```

**How to generate NEXTAUTH_SECRET:**
- Windows PowerShell: `[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))`
- Or use: https://generate-secret.vercel.app/32

**Important**: Add these for **all environments** (Production, Preview, Development)

### Step 5: Deploy

1. Click **"Deploy"**
2. Wait 2-5 minutes for build to complete
3. **Copy your app URL** (e.g., `https://wrkportal-xxxxx.vercel.app`)

### Step 6: Update NEXTAUTH_URL

1. After deployment, go to **Project Settings** → **Environment Variables**
2. Update `NEXTAUTH_URL` with your actual Vercel URL
3. Click **"Redeploy"** (or it will auto-redeploy)

---

## If You Can't Find the Repository

### Option 1: Check Repository Visibility

1. Go to GitHub: https://github.com/wrkportal/wrkportal
2. Make sure the repository is:
   - **Public**, OR
   - **Private** and you've granted Vercel access to your private repositories

### Option 2: Grant Vercel Access

1. In Vercel, go to **Settings** → **Git**
2. Click **"Configure"** next to GitHub
3. Make sure **"All repositories"** or **"wrkportal/wrkportal"** is selected
4. Click **"Save"**

### Option 3: Update Git Remote (If Needed)

If your repository is actually under a different path, update the remote:

```bash
# Check current remote
git remote -v

# If you need to update it:
git remote set-url origin https://github.com/wrkportal/wrkportal.git

# Verify
git remote -v
```

---

## Verification

After deployment, verify:
- ✅ Application is accessible at Vercel URL
- ✅ No build errors in Vercel logs
- ✅ Database connection works (check Vercel function logs)
- ✅ Can access the application

---

## Next Steps After Deployment

1. ✅ Test the application at your Vercel URL
2. ✅ Check Vercel logs for any errors
3. ✅ Verify database connection in Neon.tech dashboard
4. ✅ Test signup/login functionality

---

**You're ready to deploy!** Use `wrkportal/wrkportal` as your repository in Vercel. 🚀
