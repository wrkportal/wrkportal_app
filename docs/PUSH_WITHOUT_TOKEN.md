# Push Code Without Personal Access Token

## Option 1: Use GitHub Desktop (Easiest)

1. **Download GitHub Desktop:**
   - Go to https://desktop.github.com
   - Download and install

2. **Sign in with wrkportal account:**
   - Open GitHub Desktop
   - Sign in with your `wrkportal` GitHub account
   - (Not sandeep200680)

3. **Add Repository:**
   - Click "File" → "Add Local Repository"
   - Browse to: `C:\Users\User\Desktop\KaamKaaj\webApps\codebase\wrkportal`
   - Click "Add"

4. **Push:**
   - You should see all your changes
   - Click "Publish repository" or "Push origin"
   - Select: `wrkportal/wrkportal_app`
   - Click "Push"

---

## Option 2: Update Git Credentials (Windows)

### Clear Old Credentials

1. **Open Windows Credential Manager:**
   - Press `Windows Key + R`
   - Type: `control /name Microsoft.CredentialManager`
   - Press Enter

2. **Remove GitHub Credentials:**
   - Go to "Windows Credentials"
   - Find entries for `github.com` or `git:https://github.com`
   - Click on them and click "Remove"

3. **Push Again:**
   ```bash
   git push -u origin main
   ```
   - Windows will prompt for credentials
   - Username: `wrkportal`
   - Password: Your `wrkportal` account password (or create token if 2FA is enabled)

---

## Option 3: Find GitHub Tokens (Step-by-Step)

The tokens page might be in a different location. Try these:

### Method A: Direct URL
1. Go directly to: https://github.com/settings/tokens
2. Make sure you're logged in as `wrkportal` account

### Method B: Through Settings
1. Go to GitHub.com
2. Click your profile picture (top right)
3. Click "Settings"
4. Scroll down in the left sidebar
5. Look for "Developer settings" (at the bottom)
6. Click "Developer settings"
7. Click "Personal access tokens"
8. Click "Tokens (classic)"
9. Click "Generate new token" → "Generate new token (classic)"

### Method C: If You Have 2FA Enabled
If you have Two-Factor Authentication enabled, you MUST use a token (password won't work).

---

## Option 4: Use SSH Instead

### Step 1: Generate SSH Key

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "wrkportal@github.com"

# Press Enter to accept default location
# Press Enter twice for no passphrase (or set one)
```

### Step 2: Copy Public Key

```bash
# Display the public key
cat ~/.ssh/id_ed25519.pub
```

**Copy the entire output** (starts with `ssh-ed25519`)

### Step 3: Add SSH Key to GitHub

1. Go to https://github.com/settings/keys
2. Make sure you're logged in as `wrkportal` account
3. Click "New SSH key"
4. Title: `My Computer`
5. Key: Paste the public key you copied
6. Click "Add SSH key"

### Step 4: Update Git Remote to Use SSH

```bash
# Change remote to SSH
git remote set-url origin git@github.com:wrkportal/wrkportal_app.git

# Verify
git remote -v

# Push
git push -u origin main
```

---

## Option 5: Use Git Credential Helper

```bash
# Configure Git to use Windows Credential Manager
git config --global credential.helper wincred

# Clear cached credentials
git credential-manager erase https://github.com

# Try pushing again
git push -u origin main
```

---

## Recommended: Use GitHub Desktop

**Easiest method** - No tokens needed, just sign in with the `wrkportal` account and push!

1. Download: https://desktop.github.com
2. Sign in with `wrkportal` account
3. Add your local repository
4. Push!

---

## Quick Test: Which Account Are You Using?

Run this to see which GitHub account Git is using:

```bash
git config --global user.name
git config --global user.email
```

If it shows `sandeep200680`, update it:

```bash
git config --global user.name "wrkportal"
git config --global user.email "your-wrkportal-email@example.com"
```

---

**Try GitHub Desktop first - it's the easiest!** 🚀
