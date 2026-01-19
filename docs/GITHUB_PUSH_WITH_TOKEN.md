# Push to GitHub using Personal Access Token

## Step 1: Create a Personal Access Token (PAT)

1. Go to GitHub.com and sign in with your `wrkportal` account
2. Click your profile picture (top right) → **Settings**
3. Scroll down to **Developer settings** (bottom left)
4. Click **Personal access tokens** → **Tokens (classic)**
5. Click **Generate new token** → **Generate new token (classic)**
6. Give it a name: `Vercel Deployment`
7. Select expiration: **90 days** (or your preference)
8. Check these scopes:
   - ✅ `repo` (Full control of private repositories)
9. Click **Generate token**
10. **COPY THE TOKEN IMMEDIATELY** (you won't see it again!)

## Step 2: Update Git Remote with Token

After you have the token, run this command (replace `YOUR_TOKEN` with the actual token):

```bash
git remote set-url origin https://YOUR_TOKEN@github.com/wrkportal/wrkportal_app.git
```

Then push:
```bash
git push origin main
```

## Alternative: Use GitHub Desktop

If you have GitHub Desktop installed:
1. Open GitHub Desktop
2. File → Clone Repository → URL tab
3. Enter: `https://github.com/wrkportal/wrkportal_app.git`
4. Choose a local path
5. Click Clone
6. GitHub Desktop will handle authentication automatically
7. Commit and push from there

## Alternative: Use SSH (Recommended for long-term)

1. Generate SSH key (if you don't have one):
   ```bash
   ssh-keygen -t ed25519 -C "wrkportal26@gmail.com"
   ```
2. Add SSH key to GitHub:
   - Copy public key: `cat ~/.ssh/id_ed25519.pub`
   - GitHub → Settings → SSH and GPG keys → New SSH key
3. Update remote to use SSH:
   ```bash
   git remote set-url origin git@github.com:wrkportal/wrkportal_app.git
   ```
4. Push:
   ```bash
   git push origin main
   ```
