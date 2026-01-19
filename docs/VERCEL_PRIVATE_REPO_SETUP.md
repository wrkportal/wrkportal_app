# Vercel Setup for Private GitHub Repository

## 🎯 Issue: Private Repository Access

Your repository is **private**, so Vercel needs explicit permission to access it.

---

## Step 1: Authorize Vercel to Access Private Repositories

### Option A: During Project Import (Recommended)

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New"** → **"Project"**
3. Click **"Import Git Repository"**
4. If you see **"Authorize GitHub"** or **"Install Vercel"**, click it
5. **Important**: When authorizing, you'll see repository access options:
   - ✅ Select **"All repositories"** (recommended)
   - OR select **"Only select repositories"** → Choose `wrkportal`
6. Click **"Authorize"** or **"Install"**

### Option B: Via GitHub Settings (If Already Connected)

1. Go to [github.com](https://github.com) → **Settings**
2. Click **"Applications"** → **"Authorized OAuth Apps"** (or **"Installed GitHub Apps"**)
3. Find **"Vercel"** in the list
4. Click **"Configure"** or the gear icon
5. Under **"Repository access"**:
   - Select **"All repositories"** (recommended)
   - OR select **"Only select repositories"** → Add `wrkportal`
6. Click **"Save"** or **"Update"**

---

## Step 2: Import Project in Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New"** → **"Project"**
3. Click **"Import Git Repository"**
4. You should now see `sandeep200680/wrkportal` in the list
5. Click **"Import"** next to your repository

**If you still don't see it**:
- Make sure you authorized Vercel to access private repositories
- Try disconnecting and reconnecting GitHub in Vercel settings

---

## Step 3: Configure Project Settings

Vercel will auto-detect Next.js. Verify:

- **Framework Preset**: Next.js ✅
- **Root Directory**: `./`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

---

## Step 4: Add Environment Variables

**Before deploying**, add environment variables:

1. In the project configuration page, scroll to **"Environment Variables"**
2. Click **"Add"** for each variable:

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

---

## Step 5: Deploy

1. Click **"Deploy"**
2. Wait 2-5 minutes for build
3. Vercel will provide a URL: `https://your-app.vercel.app`

---

## 🔧 Troubleshooting: Still Can't Access?

### Issue: Repository Not Showing in Vercel

**Solution 1: Reconnect GitHub**

1. Go to Vercel → **Settings** → **Git**
2. Find **GitHub** in connected providers
3. Click **"Disconnect"**
4. Click **"Connect GitHub"** again
5. **Important**: When authorizing, select **"All repositories"** or specifically select `wrkportal`
6. Click **"Authorize"**

**Solution 2: Check GitHub App Permissions**

1. Go to GitHub → **Settings** → **Applications** → **Installed GitHub Apps**
2. Find **"Vercel"**
3. Click on it
4. Check **"Repository access"**:
   - Should be **"All repositories"** or include `wrkportal`
5. If not, click **"Configure"** and update permissions

**Solution 3: Use GitHub OAuth App Instead**

1. Go to GitHub → **Settings** → **Applications** → **Authorized OAuth Apps**
2. Find **"Vercel"**
3. Click **"Configure"**
4. Under **"Repository access"**, select:
   - ✅ **"All repositories"** (recommended)
   - OR **"Only select repositories"** → Add `wrkportal`
5. Click **"Save"**

---

## 📋 Quick Checklist

- [ ] Repository exists on GitHub (✅ You confirmed this)
- [ ] Repository is private (✅ You confirmed this)
- [ ] Vercel is authorized to access private repositories
- [ ] `wrkportal` is selected in Vercel's repository access
- [ ] Repository appears in Vercel's import list
- [ ] Project imported successfully
- [ ] Environment variables added
- [ ] Deployment successful

---

## 🎯 Most Common Issue

**"Can't access this project" usually means**:
- Vercel doesn't have permission to access your private repository
- You need to authorize Vercel during the import process
- OR update permissions in GitHub settings

**Fix**: Make sure Vercel has access to **all repositories** or specifically `wrkportal` in GitHub settings.

---

## 🚀 Next Steps After Setup

1. ✅ **First Deployment**: Wait for build to complete
2. ✅ **Update NEXTAUTH_URL**: Go to Vercel → Settings → Environment Variables → Update `NEXTAUTH_URL` to your actual Vercel URL
3. ✅ **Redeploy**: Trigger a new deployment (or push a commit)
4. ✅ **Test**: Visit your Vercel URL and test the application

---

**The key is authorizing Vercel to access your private repository!** 🎉

Once that's done, you should be able to import and deploy without issues.
