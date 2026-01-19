# Quick Instructions to Push Code

## Option 1: Create Personal Access Token (Recommended)

### Step 1: Create Token on GitHub
1. Go to: https://github.com/settings/tokens/new
2. **Note**: `wrkportal` (not sandeep200680)
3. Token name: `Vercel Push`
4. Expiration: `90 days`
5. Check: ✅ **repo** (Full control of private repositories)
6. Click **Generate token**
7. **COPY THE TOKEN** (starts with `ghp_...`)

### Step 2: Use Token to Push
After you have the token, tell me the token and I'll help you push, OR run:

```bash
git remote set-url origin https://YOUR_TOKEN@github.com/wrkportal/wrkportal_app.git
git push origin main
```

Replace `YOUR_TOKEN` with the actual token you copied.

---

## Option 2: Use GitHub Desktop (Easiest)

1. Download GitHub Desktop if you don't have it: https://desktop.github.com/
2. Open GitHub Desktop
3. File → Add Local Repository
4. Browse to: `C:\Users\User\Desktop\KaamKaaj\webApps\codebase\wrkportal`
5. Sign in with `wrkportal` account when prompted
6. Click **Push origin** button

---

## Option 3: Use SSH (Best for long-term)

If you want to set up SSH keys for easier future pushes, I can help with that too.
