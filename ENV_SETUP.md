# Environment Variables Setup

## Required Environment Variables

### Development (.env.local)
```env
# Database
DATABASE_URL="your_database_url"

# Auth
AUTH_SECRET="your_auth_secret"
AUTH_URL="http://localhost:3000"

# OpenAI (for AI features)
OPENAI_API_KEY="your_openai_key"

# Vercel Blob Storage (Production only - optional in development)
BLOB_READ_WRITE_TOKEN="your_blob_token"
```

### Production (Vercel Dashboard)

All the above variables should be set in your Vercel project settings.

#### Setting up Vercel Blob Storage:

1. Go to your Vercel Dashboard
2. Select your project
3. Go to **Storage** tab
4. Click **Create Database** → **Blob**
5. Give it a name (e.g., "reporting-files")
6. Click **Create**

**Important**: The `BLOB_READ_WRITE_TOKEN` will be automatically added to your environment variables once you create the Blob store.

#### Manual Setup (if needed):
1. Go to **Settings** → **Environment Variables**
2. Add the following variables:
   - `DATABASE_URL` (from your database provider)
   - `AUTH_SECRET` (generate with: `openssl rand -base64 32`)
   - `AUTH_URL` (your production URL, e.g., `https://www.managerbook.in`)
   - `OPENAI_API_KEY` (from OpenAI dashboard)
   - `BLOB_READ_WRITE_TOKEN` (auto-added when creating Blob store)

## Testing in Development

The app will automatically use local filesystem storage in development, so you don't need Vercel Blob configured for local testing.

## Verifying Setup

After deployment, check:
1. Can you upload files in the Database tab?
2. Can you preview uploaded files?
3. Check Vercel logs for any errors

If you see "read-only file system" errors, it means the Blob storage isn't configured properly.

