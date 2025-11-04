# Required: Prisma Commands to Run

## ⚠️ IMPORTANT: You MUST run these commands!

Without running these commands, the Tutorial system **will not work** because:
- ❌ The `Tutorial` table doesn't exist in the database yet
- ❌ Prisma Client doesn't know about the Tutorial model
- ❌ API calls will fail with "table does not exist" errors
- ❌ TypeScript will show errors for `prisma.tutorial`

---

## 🚀 Commands to Run (In Order)

### **Step 1: Create Database Migration**

This creates the Tutorial table and related schema changes:

```bash
npx prisma migrate dev --name add_tutorials
```

**What this does:**
- Creates a new migration file
- Creates the `Tutorial` table in your database
- Creates the `TutorialType`, `TutorialLevel`, `TutorialSection` enums
- Updates the `User` table with `createdTutorials` relation
- Updates the `Tenant` table with `tutorials` relation
- Updates the `AuditEntity` enum to include `TUTORIAL`

**Expected output:**
```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "your_db"

Applying migration `20250104120000_add_tutorials`

The following migration(s) have been created and applied from new schema changes:

migrations/
  └─ 20250104120000_add_tutorials/
    └─ migration.sql

Your database is now in sync with your schema.

✔ Generated Prisma Client
```

---

### **Step 2: Generate Prisma Client**

This updates the TypeScript types and Prisma Client:

```bash
npx prisma generate
```

**What this does:**
- Updates `node_modules/.prisma/client`
- Generates TypeScript types for Tutorial model
- Makes `prisma.tutorial` available in your code
- Updates all type definitions

**Expected output:**
```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma

✔ Generated Prisma Client (v5.x.x) to ./node_modules/@prisma/client
```

---

## 📋 Complete Setup Checklist

Run these commands in your terminal:

```bash
# 1. Create and apply migration
npx prisma migrate dev --name add_tutorials

# 2. Generate Prisma Client (might already be done by migrate)
npx prisma generate

# 3. (Optional) Open Prisma Studio to verify
npx prisma studio
```

---

## ✅ Verify It Worked

### **1. Check Migration Files**

You should see a new folder:
```
prisma/
  migrations/
    20250104120000_add_tutorials/
      migration.sql
```

### **2. Check Database**

Run this SQL to verify the table exists:
```sql
-- Check if Tutorial table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'Tutorial';
```

Should return: `Tutorial`

### **3. Check Prisma Client**

In your code, you should now have TypeScript autocomplete for:
```typescript
prisma.tutorial.create(...)
prisma.tutorial.findMany(...)
prisma.tutorial.update(...)
prisma.tutorial.delete(...)
```

---

## 🐛 Troubleshooting

### **Error: "Can't reach database server"**

**Solution:**
1. Check your `.env` file has correct `DATABASE_URL`
2. Verify database is running
3. Test connection:
```bash
npx prisma db pull
```

### **Error: "Migration failed"**

**Solution:**
1. Check if you have pending migrations:
```bash
npx prisma migrate status
```

2. Reset and try again:
```bash
npx prisma migrate reset
npx prisma migrate dev --name add_tutorials
```

⚠️ **Warning:** `migrate reset` will delete all data!

### **Error: "Table already exists"**

If you manually created the Tutorial table:

**Solution:**
```bash
# Mark migration as applied without running it
npx prisma migrate resolve --applied 20250104120000_add_tutorials
```

---

## 🔄 When to Run These Commands

### **Always run after:**
- ✅ Adding a new model to `schema.prisma`
- ✅ Modifying existing model fields
- ✅ Adding/removing relations
- ✅ Changing enums
- ✅ Pulling from git if schema changed

### **Commands summary:**

| Scenario | Command |
|----------|---------|
| New model/field changes | `npx prisma migrate dev --name description` |
| After git pull (schema changed) | `npx prisma generate` |
| Reset database (dev only) | `npx prisma migrate reset` |
| View database in GUI | `npx prisma studio` |
| Check migration status | `npx prisma migrate status` |

---

## 📝 What Happens Without These Commands?

### **Without `prisma migrate dev`:**
```
Error: Invalid `prisma.tutorial.create()` invocation:
  
  The table `public.Tutorial` does not exist in the current database.
```

### **Without `prisma generate`:**
```typescript
// TypeScript error
prisma.tutorial.create(...)
//      ^^^^^^^^
// Property 'tutorial' does not exist on type 'PrismaClient'
```

---

## 🚀 Quick Start (Copy & Paste)

Open your terminal and run:

```bash
# Stop your dev server first (Ctrl+C)

# Run migrations
npx prisma migrate dev --name add_tutorials

# Generate client (usually done automatically by migrate)
npx prisma generate

# Restart your dev server
npm run dev
```

---

## 📊 Migration File Contents

The migration will create SQL like this:

```sql
-- CreateEnum
CREATE TYPE "TutorialType" AS ENUM ('VIDEO', 'TEXT', 'INTERACTIVE');
CREATE TYPE "TutorialLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');
CREATE TYPE "TutorialSection" AS ENUM ('PROJECT_MANAGEMENT', 'TOOLS_WORKINGS');

-- CreateTable
CREATE TABLE "Tutorial" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "TutorialType" NOT NULL,
    "duration" TEXT NOT NULL,
    "level" "TutorialLevel" NOT NULL,
    "category" TEXT NOT NULL,
    "section" "TutorialSection" NOT NULL,
    "videoUrl" TEXT,
    "contentText" TEXT,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "thumbnail" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tutorial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Tutorial_tenantId_idx" ON "Tutorial"("tenantId");
CREATE INDEX "Tutorial_section_category_idx" ON "Tutorial"("section", "category");
CREATE INDEX "Tutorial_isPublished_idx" ON "Tutorial"("isPublished");
CREATE INDEX "Tutorial_order_idx" ON "Tutorial"("order");

-- AddForeignKey
ALTER TABLE "Tutorial" ADD CONSTRAINT "Tutorial_tenantId_fkey" 
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
ALTER TABLE "Tutorial" ADD CONSTRAINT "Tutorial_createdById_fkey" 
    FOREIGN KEY ("createdById") REFERENCES "User"("id");
```

---

## 💡 Pro Tips

### **Development:**
```bash
# Always use migrate dev in development
npx prisma migrate dev --name your_change_description
```

### **Production:**
```bash
# Use migrate deploy in production
npx prisma migrate deploy
```

### **Check Status:**
```bash
# See which migrations are applied
npx prisma migrate status
```

### **View Data:**
```bash
# Open Prisma Studio GUI
npx prisma studio
```

---

## ✅ Final Checklist

Before testing the Tutorial system:

- [ ] Ran `npx prisma migrate dev --name add_tutorials`
- [ ] Migration completed successfully
- [ ] Ran `npx prisma generate` (or was done automatically)
- [ ] Restarted dev server
- [ ] No TypeScript errors in code
- [ ] Database has Tutorial table (verify with Prisma Studio)
- [ ] Made yourself super admin in database
- [ ] Logged out and back in
- [ ] Can access `/admin/tutorials`

---

## 🎯 Summary

### **YES, you MUST run:**

```bash
npx prisma migrate dev --name add_tutorials
npx prisma generate
```

### **Then:**
1. Restart your dev server
2. Make yourself super admin (SQL command)
3. Log out and back in
4. Access Admin → Tutorials
5. Create your first tutorial!

---

**Don't skip this step! The Tutorial feature won't work without it.** 🚨

