# Push Code to wrkportal/wrkportal_app

## Problem

You're authenticated as `sandeep200680` but trying to push to `wrkportal/wrkportal_app`. You need to authenticate with the `wrkportal` account.

---

## Solution: Authenticate with wrkportal Account

### Option 1: Use GitHub Personal Access Token (Recommended)

1. **Create Personal Access Token for wrkportal account:**
   - Go to https://github.com/settings/tokens (make sure you're logged in as `wrkportal` account)
   - Click "Generate new token" → "Generate new token (classic)"
   - Name: `Vercel Deployment`
   - Expiration: 90 days (or your preference)
   - Scopes: Check **`repo`** (full control of private repositories)
   - Click "Generate token"
   - **Copy the token** (you won't see it again!)

2. **Push using the token:**
   ```bash
   git push -u origin main
   ```
   - When asked for username: Enter `wrkportal`
   - When asked for password: **Paste the Personal Access Token** (not your password)

### Option 2: Use SSH (Alternative)

1. **Generate SSH key for wrkportal account:**
   ```bash
   ssh-keygen -t ed25519 -C "wrkportal@github.com"
   ```

2. **Add SSH key to GitHub:**
   - Copy the public key: `cat ~/.ssh/id_ed25519.pub`
   - Go to https://github.com/settings/keys (as `wrkportal` account)
   - Click "New SSH key"
   - Paste the key and save

3. **Update remote to use SSH:**
   ```bash
   git remote set-url origin git@github.com:wrkportal/wrkportal_app.git
   git push -u origin main
   ```

### Option 3: Use GitHub Desktop

1. Install GitHub Desktop
2. Sign in with `wrkportal` account
3. Add the repository
4. Push from GitHub Desktop

---

## Quick Fix: Use Token Now

Run this command and use the token when prompted:

```bash
git push -u origin main
```

**When prompted:**
- Username: `wrkportal`
- Password: **Paste your Personal Access Token**

---

## After Successful Push

1. ✅ Verify on GitHub: https://github.com/wrkportal/wrkportal_app
2. ✅ You should see all your files and commits
3. ✅ Then proceed to Vercel deployment

---

## Vercel Deployment (After Push)

1. Go to https://vercel.com
2. Sign in with GitHub (make sure it's the `wrkportal` account)
3. Click "Add New" → "Project"
4. Search for: `wrkportal/wrkportal_app`
5. Click "Import"
6. **Root Directory**: Leave as `./` (default)
7. Add environment variables
8. Deploy

---

**Create a Personal Access Token for the `wrkportal` account and use it to push!** 🔑
