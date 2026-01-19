# Setup wrkportal/wrkportal Repository

## Step 1: Create Repository on GitHub

1. **Go to GitHub**
   - Visit https://github.com/new
   - Make sure you're logged in as the `wrkportal` account (not sandeep200680)

2. **Create New Repository**
   - Repository name: `wrkportal`
   - Description: (optional) "Enterprise Project Management SaaS Application"
   - Visibility: **Private** (recommended) or Public
   - **DO NOT** initialize with README, .gitignore, or license (you already have these)
   - Click **"Create repository"**

3. **Copy the repository URL**
   - GitHub will show you the URL: `https://github.com/wrkportal/wrkportal.git`
   - Keep this page open

---

## Step 2: Push Code to wrkportal/wrkportal

After creating the repository, run these commands:

```bash
# Update remote URL (if not already done)
git remote set-url origin https://github.com/wrkportal/wrkportal.git

# Verify
git remote -v

# Push code
git push -u origin main
```

If you get authentication errors:
- Use GitHub Personal Access Token instead of password
- Or use SSH: `git@github.com:wrkportal/wrkportal.git`

---

## Step 3: Verify on GitHub

1. Go to https://github.com/wrkportal/wrkportal
2. Verify you can see:
   - Your commits
   - All your files
   - Branch `main`

---

## Step 4: Deploy to Vercel

### Vercel Configuration

1. **Go to Vercel**: https://vercel.com
2. **Sign in with GitHub** (make sure it's the `wrkportal` account)
3. **Add New Project**
   - Search for: `wrkportal/wrkportal`
   - Click "Import"

### Root Directory Setting

**Answer: NO, leave it as default (`./`)**

- **Root Directory**: `./` (default - leave this empty or as `./`)
- **Framework Preset**: Next.js (auto-detected)
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` (default)

**Why?** Your `package.json` and `next.config.js` are in the root directory, so `./` is correct.

---

## Step 5: Add Environment Variables

Before deploying, add these in Vercel:

**Environment Variables:**
```
DATABASE_URL=postgresql://neondb_owner:npg_SnpI8CJtT4Xz@ep-royal-frost-ahzg2vyw-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
INFRASTRUCTURE_MODE=neon
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=generate-a-random-32-character-secret
```

**Add for**: Production, Preview, and Development environments

---

## Step 6: Deploy

1. Click **"Deploy"**
2. Wait 2-5 minutes
3. Copy your app URL
4. Update `NEXTAUTH_URL` with actual URL
5. Redeploy

---

## Troubleshooting

### "Repository not found" Error

**Problem**: Can't push to `wrkportal/wrkportal`  
**Solution**:
- Make sure you created the repository on GitHub first
- Verify you're logged into the correct GitHub account (`wrkportal`)
- Check repository name matches exactly: `wrkportal/wrkportal`

### Authentication Issues

**Problem**: Git push asks for credentials  
**Solution**:
- Use GitHub Personal Access Token (not password)
- Or set up SSH keys
- Or use GitHub Desktop

### Vercel Can't See Repository

**Problem**: `wrkportal/wrkportal` doesn't appear in Vercel  
**Solution**:
- Make sure you're signed into Vercel with the `wrkportal` GitHub account
- Go to Vercel Settings → Git → Configure GitHub
- Grant access to `wrkportal` organization/account
- Refresh the import page

---

## Summary

1. ✅ Create `wrkportal/wrkportal` repository on GitHub
2. ✅ Push code to that repository
3. ✅ Import `wrkportal/wrkportal` in Vercel
4. ✅ **Root Directory**: Leave as `./` (default)
5. ✅ Add environment variables
6. ✅ Deploy

**Root Directory**: Just leave it as `./` or empty - that's the default and correct for your setup! ✅
