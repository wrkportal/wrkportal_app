# Backend Setup Guide

This guide will help you set up and run the backend for the Project Management application.

## Overview

This application uses **Next.js API Routes** which means the backend runs as part of the Next.js server. You don't need a separate backend server - everything runs together with `npm run dev`.

## Prerequisites

Before you begin, ensure you have:

1. **Node.js 18+** installed
2. **PostgreSQL Database** (local or cloud-hosted)
3. **Git** (for cloning the repository)

## Step-by-Step Setup

### Step 1: Install Dependencies

```bash
npm install
```

This will install all required packages including Prisma, Next.js, and database drivers.

### Step 2: Set Up Database

#### Option A: Local PostgreSQL

1. Install PostgreSQL on your machine:
   - Windows: Download from [postgresql.org](https://www.postgresql.org/download/windows/)
   - Mac: `brew install postgresql`
   - Linux: `sudo apt-get install postgresql`

2. Create a database:
   ```bash
   createdb project_management
   ```

#### Option B: Cloud Database (Recommended for Production)

Use services like:
- **Supabase** (Free tier available)
- **Railway** (Free tier available)
- **Neon** (Free tier available)
- **AWS RDS**
- **Google Cloud SQL**

Get the connection string from your provider.

### Step 3: Configure Environment Variables

1. Create a `.env` file in the root directory:

   ```bash
   cp env.template .env
   ```

2. Edit `.env` and fill in your values:

   ```env
   # Database Connection (PostgreSQL)
   DATABASE_URL="postgresql://username:password@localhost:5432/project_management?sslmode=prefer"

   # NextAuth Configuration
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"

   # Google OAuth (Optional but recommended)
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"

   # Email Service (For contact form, notifications)
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-app-password"

   # AI Configuration (Optional)
   OPENAI_API_KEY="sk-your-openai-api-key"
   OPENAI_MODEL="gpt-4o"
   AI_FEATURES_ENABLED="true"
   ```

#### Generate NEXTAUTH_SECRET

Run this command to generate a secure secret:

```bash
openssl rand -base64 32
```

Or use this online generator: https://generate-secret.vercel.app/32

#### Google OAuth Setup (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret to `.env`

### Step 4: Set Up Database Schema

Run Prisma migrations to create all database tables:

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database (for development)
npx prisma db push

# OR use migrations (for production)
npx prisma migrate dev --name init
```

This will create all the tables defined in `prisma/schema.prisma`.

### Step 5: Verify Database Connection

Check if Prisma can connect to your database:

```bash
npx prisma db pull
```

If this works without errors, your database connection is set up correctly.

### Step 6: Seed Database (Optional)

If you have seed data, run:

```bash
npx prisma db seed
```

### Step 7: Start the Development Server

Now start the Next.js development server (this runs both frontend and backend):

```bash
npm run dev
```

The server will start on `http://localhost:3000`

You should see output like:
```
✓ Ready in 2.5s
○ Compiling / ...
✓ Compiled / in 500ms
```

## Backend API Routes

Once running, your backend API routes are available at:

- **Auth**: `/api/auth/*` (handled by NextAuth)
- **Projects**: `/api/projects`
- **Tasks**: `/api/tasks`
- **Users**: `/api/users`
- **Contact**: `/api/contact`
- And many more...

### Test the Backend

1. Open your browser to `http://localhost:3000`
2. Try accessing an API endpoint: `http://localhost:3000/api/auth/providers`
3. Check the terminal for any errors

## Common Issues & Solutions

### Issue: Database Connection Error

**Error**: `Can't reach database server`

**Solutions**:
1. Verify PostgreSQL is running:
   ```bash
   # Windows
   services.msc (look for PostgreSQL service)

   # Mac/Linux
   sudo service postgresql status
   ```

2. Check your `DATABASE_URL` in `.env`:
   - Verify username, password, host, and port
   - Test connection string format

3. For cloud databases, check:
   - Firewall rules allow your IP
   - SSL mode is correct (`sslmode=require` for cloud)

### Issue: Prisma Client Not Generated

**Error**: `PrismaClient is not configured`

**Solution**:
```bash
npx prisma generate
```

### Issue: Port 3000 Already in Use

**Solution**: Use a different port:
```bash
PORT=3001 npm run dev
```

Then access at `http://localhost:3001`

### Issue: Migration Errors

**Error**: `Migration failed`

**Solutions**:
1. Reset database (⚠️ **WARNING**: This deletes all data):
   ```bash
   npx prisma migrate reset
   ```

2. Or manually fix schema conflicts:
   ```bash
   npx prisma db pull  # Pull current schema
   npx prisma db push  # Push new schema
   ```

### Issue: Missing Environment Variables

**Error**: `Environment variable not found`

**Solution**: Make sure your `.env` file exists and has all required variables. Check `env.template` for the list.

### Issue: SMTP/Email Errors

**Error**: `Email send failed`

**Solutions**:
1. For Gmail, use an App Password (not your regular password)
2. Enable "Less secure app access" (not recommended)
3. Or use a dedicated email service like SendGrid, Mailgun

## Database Management

### View Database with Prisma Studio

Open a visual database browser:

```bash
npx prisma studio
```

This opens at `http://localhost:5555` where you can view/edit data.

### Reset Database

⚠️ **WARNING**: This will delete all data!

```bash
npx prisma migrate reset
```

### Create New Migration

After changing `prisma/schema.prisma`:

```bash
npx prisma migrate dev --name your_migration_name
```

## Production Deployment

### Build for Production

```bash
npm run build
```

This command:
1. Generates Prisma Client
2. Pushes schema to database
3. Builds Next.js application

### Start Production Server

```bash
npm start
```

### Environment Variables for Production

Make sure to set environment variables on your hosting platform:
- Vercel: Project Settings → Environment Variables
- Railway: Variables tab
- AWS/Docker: Use `.env.production` or environment variables

## API Endpoints Reference

### Authentication
- `POST /api/auth/signin` - Sign in
- `POST /api/auth/signout` - Sign out
- `GET /api/auth/session` - Get current session
- `GET /api/auth/providers` - List auth providers

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create project
- `GET /api/projects/[id]` - Get project details
- `PUT /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project

### Tasks
- `GET /api/tasks` - List tasks
- `POST /api/tasks` - Create task
- `GET /api/tasks/[id]` - Get task details
- `PUT /api/tasks/[id]` - Update task

### Users
- `GET /api/users/onboarded` - List users
- `GET /api/user/me` - Get current user
- `PUT /api/user/profile` - Update profile

### Contact
- `POST /api/contact` - Submit contact form

## Monitoring & Debugging

### View Logs

Check the terminal where you ran `npm run dev` for:
- API request logs
- Database queries
- Errors and warnings

### Enable Debug Mode

Add to `.env`:
```env
DEBUG=true
```

### Database Query Logging

Prisma logs queries by default in development mode.

## Next Steps

1. ✅ Database is set up and connected
2. ✅ Backend server is running
3. 🔄 Test API endpoints
4. 🔄 Set up authentication
5. 🔄 Create initial data/users
6. 🔄 Configure email service
7. 🔄 Deploy to production

## Need Help?

- Check Prisma documentation: https://www.prisma.io/docs
- Next.js API Routes: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- Database connection issues: Check your PostgreSQL logs

---

**Happy Coding! 🚀**
