# Vercel Post-Deployment Setup Guide

## ✅ You're Connected! Next Steps

Since you deployed via CLI, you're all set! Now let's configure your project properly.

---

## Step 1: Add Environment Variables in Vercel

### 1.1 Navigate to Environment Variables

1. In Vercel Dashboard, you should be on your `wrkportal` project
2. Click **"Settings"** (top navigation)
3. Click **"Environment Variables"** (left sidebar)

### 1.2 Add Required Variables

Click **"Add"** for each of these:

#### Database Variables (Neon.tech)

```
Key: DATABASE_URL
Value: postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/wrkportal?sslmode=require
Environment: Production, Preview, Development (select all)
```

```
Key: DATABASE_URL_NEON
Value: postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/wrkportal?sslmode=require
Environment: Production, Preview, Development (select all)
```

**Important**: 
- Use your **pooler connection string** from Neon (has `-pooler` in hostname)
- Replace `user`, `pass`, `ep-xxx`, `region` with your actual Neon values
- Select **all three environments** (Production, Preview, Development)

#### Authentication Variables

```
Key: NEXTAUTH_URL
Value: https://your-app.vercel.app (your actual Vercel URL)
Environment: Production, Preview, Development (select all)
```

```
Key: NEXTAUTH_SECRET
Value: your-secret-key-here (generate with: openssl rand -base64 32)
Environment: Production, Preview, Development (select all)
```

**Note**: You can find your Vercel URL in the project overview page (e.g., `https://wrkportal.vercel.app`)

#### AI Variables (If Using)

```
Key: AI_PROVIDER
Value: azure-openai
Environment: Production, Preview, Development (select all)
```

```
Key: AZURE_OPENAI_ENDPOINT
Value: https://your-resource.openai.azure.com
Environment: Production, Preview, Development (select all)
```

```
Key: AZURE_OPENAI_API_KEY
Value: your-api-key-here
Environment: Production, Preview, Development (select all)
```

```
Key: AZURE_OPENAI_API_VERSION
Value: 2024-02-15-preview
Environment: Production, Preview, Development (select all)
```

```
Key: AZURE_OPENAI_DEPLOYMENT_NAME
Value: gpt-4
Environment: Production, Preview, Development (select all)
```

#### Other Required Variables

Add any other variables from your local `.env` file that are needed for production.

---

## Step 2: Get Your Neon Connection String

### 2.1 From Neon Dashboard

1. Go to [console.neon.tech](https://console.neon.tech)
2. Select your project: `wrkportal`
3. Go to **"Connection Details"** or **"Dashboard"**
4. Copy the **pooler connection string** (has `-pooler` in hostname)
   - Example: `postgresql://user:pass@ep-xxx-pooler.us-east-1.aws.neon.tech/wrkportal?sslmode=require`

### 2.2 Verify Connection String Format

Should look like:
```
postgresql://[user]:[password]@[host]-pooler.[region].aws.neon.tech/[database]?sslmode=require
```

**Important**: Make sure it has `-pooler` in the hostname!

---

## Step 3: Run Prisma Migrations

### 3.1 Option A: Via Vercel Build (Automatic)

Vercel will automatically run `prisma generate` during build, but you need to run migrations manually.

### 3.2 Option B: Run Migrations Locally (Recommended)

Since your local environment is connected to Neon:

```bash
# Make sure DATABASE_URL is set in your local .env
# It should point to your Neon database

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Or for development
npx prisma migrate dev
```

### 3.3 Option C: Run Migrations via Vercel CLI

```bash
# Set environment variable locally
export DATABASE_URL="your-neon-connection-string"

# Run migrations
npx prisma migrate deploy
```

---

## Step 4: Redeploy After Adding Environment Variables

### 4.1 Trigger New Deployment

After adding environment variables, you need to redeploy:

**Option A: Via Vercel Dashboard**
1. Go to **"Deployments"** tab
2. Click **"..."** (three dots) on latest deployment
3. Click **"Redeploy"**
4. Wait for build to complete

**Option B: Via CLI**
```bash
vercel --prod
```

**Option C: Push a Commit**
```bash
# Make a small change (or just commit the docs)
git add .
git commit -m "Update: Add deployment configuration"
git push origin main
```

This will trigger a new deployment with the environment variables.

---

## Step 5: Verify Deployment

### 5.1 Check Build Logs

1. Go to Vercel → Your Project → **"Deployments"**
2. Click on the latest deployment
3. Check **"Build Logs"** for any errors
4. Look for:
   - ✅ Prisma Client generated successfully
   - ✅ Build completed
   - ❌ Any errors (fix them)

### 5.2 Test Your Application

1. Visit your Vercel URL (e.g., `https://wrkportal.vercel.app`)
2. Test:
   - ✅ Homepage loads
   - ✅ Sign up / Login works
   - ✅ Database connection works
   - ✅ Features function correctly

### 5.3 Check Database Connection

If you see database errors:
- Verify `DATABASE_URL` is correct in Vercel
- Check Neon dashboard for connection issues
- Verify migrations ran successfully

---

## Step 6: Update NEXTAUTH_URL

### 6.1 Get Your Vercel URL

1. In Vercel Dashboard → Your Project → **"Overview"**
2. Find your **Production URL** (e.g., `https://wrkportal.vercel.app`)
3. Copy it

### 6.2 Update Environment Variable

1. Go to **Settings** → **Environment Variables**
2. Find `NEXTAUTH_URL`
3. Click **"Edit"**
4. Update value to your actual Vercel URL
5. Select all environments
6. Click **"Save"**

### 6.3 Redeploy

Redeploy to apply the change (see Step 4).

---

## Step 7: Set Up Custom Domain (Optional)

### 7.1 Add Domain

1. Go to **Settings** → **Domains**
2. Click **"Add"**
3. Enter your domain (e.g., `wrkportal.com`)
4. Follow DNS configuration instructions

### 7.2 Update NEXTAUTH_URL

After domain is configured, update `NEXTAUTH_URL` to your custom domain.

---

## 📋 Quick Checklist

- [ ] Added `DATABASE_URL` (Neon pooler connection string)
- [ ] Added `DATABASE_URL_NEON` (same as above)
- [ ] Added `NEXTAUTH_URL` (your Vercel URL)
- [ ] Added `NEXTAUTH_SECRET` (generated secret)
- [ ] Added AI variables (if using)
- [ ] Selected all environments for each variable
- [ ] Ran Prisma migrations locally
- [ ] Redeployed application
- [ ] Verified build succeeded
- [ ] Tested application
- [ ] Updated `NEXTAUTH_URL` with actual domain

---

## 🚨 Common Issues

### Issue: Build Fails

**Solution**:
- Check build logs in Vercel
- Verify all environment variables are set
- Check Prisma migrations ran successfully

### Issue: Database Connection Fails

**Solution**:
- Verify `DATABASE_URL` is correct (pooler connection string)
- Check Neon dashboard for connection issues
- Make sure database exists in Neon

### Issue: Authentication Doesn't Work

**Solution**:
- Verify `NEXTAUTH_URL` matches your Vercel domain
- Check `NEXTAUTH_SECRET` is set
- Redeploy after updating variables

---

## 🎯 Next Steps Summary

1. ✅ **Add Environment Variables** in Vercel Settings
2. ✅ **Run Prisma Migrations** (locally or via CLI)
3. ✅ **Redeploy** to apply environment variables
4. ✅ **Test** your application
5. ✅ **Update NEXTAUTH_URL** with actual domain
6. ✅ **Redeploy** again

---

**You're almost there!** 🚀

Once you add the environment variables and redeploy, your application should be fully functional!
