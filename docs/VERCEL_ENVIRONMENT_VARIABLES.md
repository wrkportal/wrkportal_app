# Vercel Environment Variables - Complete List

## 📋 Copy-Paste Ready for Vercel

Add these in **Vercel → Your Project → Settings → Environment Variables**

**Important**: Add for **all environments** (Production, Preview, Development)

---

## ✅ REQUIRED Variables (Must Have)

These are **essential** for the app to work:

```
DATABASE_URL=postgresql://neondb_owner:npg_SnpI8CJtT4Xz@ep-royal-frost-ahzg2vyw-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

```
INFRASTRUCTURE_MODE=neon
```

```
NEXTAUTH_URL=https://your-app.vercel.app
```
**Note**: Update this AFTER first deployment with your actual Vercel URL

```
NEXTAUTH_SECRET=your-random-32-character-secret-here
```
**Generate**: Use https://generate-secret.vercel.app/32 or PowerShell:
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

---

## 📧 EMAIL Configuration (Recommended)

Required for password reset, email verification, notifications:

```
EMAIL_HOST=smtp.gmail.com
```

```
EMAIL_PORT=587
```

```
EMAIL_SECURE=false
```

```
EMAIL_USER=your-email@gmail.com
```
**Example**: `wrkportal26@gmail.com`

```
EMAIL_PASSWORD=your-gmail-app-password
```
**How to get**: 
1. Go to Google Account → Security
2. Enable 2-Step Verification
3. Go to "App passwords"
4. Generate password for "Mail"
5. Copy the 16-character password

```
EMAIL_FROM=noreply@wrkportal.com
```
**Or**: `wrkportal26@gmail.com`

---

## 🔐 GOOGLE OAUTH (Optional - For Google Sign-In)

Only needed if you want users to sign in with Google:

```
GOOGLE_CLIENT_ID=your-google-client-id
```

```
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**How to get**:
1. Go to https://console.cloud.google.com
2. Create project or select existing
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Authorized redirect URI: `https://your-app.vercel.app/api/auth/callback/google`

---

## 🤖 AI Configuration (Optional - For AI Features)

Only needed if you're using AI features (chat assistant, risk prediction, etc.):

```
AI_PROVIDER=azure-openai
```

```
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
```

```
AZURE_OPENAI_API_KEY=your-azure-openai-api-key
```

```
AZURE_OPENAI_API_VERSION=2024-02-15-preview
```

```
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4
```

```
AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME=text-embedding-ada-002
```

**AI Feature Toggles** (Optional):
```
AI_FEATURES_ENABLED=true
AI_CHAT_ASSISTANT_ENABLED=true
AI_RISK_PREDICTION_ENABLED=true
AI_BUDGET_FORECASTING_ENABLED=true
```

---

## 🔒 REPORTING STUDIO (Optional)

Only needed if using Reporting Studio features:

```
REPORTING_STUDIO_ENCRYPTION_KEY=your-32-character-encryption-key
```
**Generate**: Same as NEXTAUTH_SECRET

---

## 📝 CI/CD (Optional - For Webhooks)

Only needed if using GitHub Actions or Jenkins webhooks:

```
GITHUB_WEBHOOK_SECRET=your-github-webhook-secret
```

```
JENKINS_WEBHOOK_TOKEN=your-jenkins-webhook-token
```

---

## 🚀 MINIMUM REQUIRED SET (To Get Started)

If you want to deploy quickly, start with just these **4 variables**:

```
DATABASE_URL=postgresql://neondb_owner:npg_SnpI8CJtT4Xz@ep-royal-frost-ahzg2vyw-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

```
INFRASTRUCTURE_MODE=neon
```

```
NEXTAUTH_URL=https://your-app.vercel.app
```

```
NEXTAUTH_SECRET=generate-32-character-secret
```

**Then add email configuration** for password reset and notifications to work.

---

## 📋 Quick Copy-Paste (Minimum Setup)

Copy these into Vercel:

```
DATABASE_URL=postgresql://neondb_owner:npg_SnpI8CJtT4Xz@ep-royal-frost-ahzg2vyw-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
INFRASTRUCTURE_MODE=neon
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=CHANGE_THIS_TO_RANDOM_32_CHARACTERS
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=wrkportal26@gmail.com
EMAIL_PASSWORD=YOUR_GMAIL_APP_PASSWORD
EMAIL_FROM=noreply@wrkportal.com
```

---

## ✅ After First Deployment

1. **Get your Vercel URL** (e.g., `https://wrkportal-xxxxx.vercel.app`)
2. **Update `NEXTAUTH_URL`** with your actual URL
3. **Redeploy** (or it will auto-redeploy on next push)

---

## 🔍 How to Add in Vercel

1. Go to **Vercel Dashboard** → Your Project
2. Click **Settings** → **Environment Variables**
3. Click **Add New**
4. Enter **Name** and **Value**
5. Select **Environment** (Production, Preview, Development - or all)
6. Click **Save**
7. **Redeploy** if needed

---

## 📝 Notes

- **NEXTAUTH_URL**: Update after first deployment with actual Vercel URL
- **NEXTAUTH_SECRET**: Generate a random 32-character string (never share this!)
- **EMAIL_PASSWORD**: Use Gmail App Password (not your regular password)
- **GOOGLE_OAUTH**: Only needed if using Google Sign-In
- **AI_CONFIG**: Only needed if using AI features

---

**Start with the minimum 4 variables, then add email configuration!** 🚀
