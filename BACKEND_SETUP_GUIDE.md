# Backend Setup Guide - Authentication System

## Phase 1: Database & Authentication Setup

### Step 1: Install Required Packages

Run these commands in your terminal:

```bash
# Core dependencies
npm install next-auth@beta @auth/prisma-adapter
npm install prisma @prisma/client
npm install bcryptjs
npm install zod

# Type definitions
npm install -D @types/bcryptjs

# Optional: If using PostgreSQL locally
npm install pg
```

### Step 2: Database Choice

**Option A: PostgreSQL (Recommended for Production)**

- Better for relational data
- ACID compliant
- Excellent for complex queries

**Option B: MongoDB**

- Flexible schema
- Good for rapid development
- Easy to scale

**I'll set up PostgreSQL. You can switch to MongoDB if preferred.**

### Step 3: Set Up Environment Variables

Create a `.env` file in your project root:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/projectmanagement?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-change-this-in-production"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Email Provider (SendGrid, AWS SES, etc.)
EMAIL_SERVER="smtp://username:password@smtp.example.com:587"
EMAIL_FROM="noreply@yourapp.com"
```

### Step 4: Generate NEXTAUTH_SECRET

Run this command to generate a secure secret:

```bash
openssl rand -base64 32
```

Copy the output and paste it in your `.env` file as `NEXTAUTH_SECRET`.

### Step 5: Initialize Prisma

```bash
# Initialize Prisma
npx prisma init

# This creates:
# - prisma/schema.prisma
# - .env (if it doesn't exist)
```

### Step 6: Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Set authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://yourdomain.com/api/auth/callback/google` (production)
6. Copy Client ID and Client Secret to `.env`

### Step 7: Database Setup (PostgreSQL)

**Using Docker (Easiest):**

```bash
docker run --name projectmanagement-db \
  -e POSTGRES_USER=username \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=projectmanagement \
  -p 5432:5432 \
  -d postgres:15
```

**Or install PostgreSQL locally:**

- macOS: `brew install postgresql`
- Windows: Download from postgresql.org
- Linux: `sudo apt-get install postgresql`

### Step 8: Run Prisma Migrations

After I create the schema, run:

```bash
# Generate Prisma Client
npx prisma generate

# Create database tables
npx prisma migrate dev --name init

# Open Prisma Studio (database GUI)
npx prisma studio
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Login Page   │  │ Signup Page  │  │ SSO Buttons  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  NextAuth.js (Auth Layer)                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │  • Session Management                              │    │
│  │  • JWT Token Generation                            │    │
│  │  • OAuth Providers (Google, GitHub, etc.)          │    │
│  │  • Credentials Provider (Email/Password)           │    │
│  │  • Middleware for Protected Routes                 │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Database (PostgreSQL)                    │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐          │
│  │   Users    │  │  Accounts  │  │  Sessions  │          │
│  │  Table     │  │   Table    │  │   Table    │          │
│  └────────────┘  └────────────┘  └────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

## Features We'll Implement

### ✅ **Authentication Methods:**

1. **Email/Password** - Traditional signup/login
2. **Google OAuth** - One-click sign in with Google
3. **Magic Link** - Passwordless email authentication (optional)

### ✅ **Security Features:**

1. **Password Hashing** - bcrypt with salt
2. **JWT Tokens** - Secure session management
3. **CSRF Protection** - Built into NextAuth
4. **Rate Limiting** - Prevent brute force attacks
5. **Email Verification** - Verify user emails
6. **Password Reset** - Secure password recovery

### ✅ **User Management:**

1. **User Profiles** - Store user data
2. **Role-Based Access** - Different user roles (ADMIN, PMO, PM, etc.)
3. **Multi-tenancy** - Separate organizations
4. **SSO** - Single Sign-On support

## Next Steps

Once you've completed the setup above, I'll create:

1. ✅ Prisma schema with all tables
2. ✅ NextAuth configuration
3. ✅ Login/Signup pages
4. ✅ Protected route middleware
5. ✅ API routes for authentication
6. ✅ User session management

Let me know when you're ready, and I'll start creating the files!
