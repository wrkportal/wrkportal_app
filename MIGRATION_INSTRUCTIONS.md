# How to Run the Database Migration

## Option 1: Using psql (Command Line) - Recommended

### For Local Development:
```bash
# If you have DATABASE_URL in .env file
psql $DATABASE_URL -f scripts/add-allowed-sections-migration.sql

# Or if you have connection details separately
psql -h localhost -U your_username -d your_database_name -f scripts/add-allowed-sections-migration.sql
```

### For Production (Vercel/Cloud):
1. Get your database connection string from Vercel dashboard or your hosting provider
2. Run:
```bash
psql "your_database_connection_string" -f scripts/add-allowed-sections-migration.sql
```

## Option 2: Using Prisma Migrate (Alternative)

Create a Prisma migration instead:

```bash
# 1. First, manually add the fields to prisma/schema.prisma:
#    - Add `allowedSections String?` to User model
#    - Add `allowedSections String?` to TenantInvitation model

# 2. Create migration
npx prisma migrate dev --name add_allowed_sections

# 3. This will create a migration file and apply it
```

## Option 3: Using Database GUI Tool

1. **pgAdmin** (PostgreSQL GUI):
   - Connect to your database
   - Open Query Tool
   - Copy contents of `scripts/add-allowed-sections-migration.sql`
   - Paste and execute

2. **DBeaver** / **TablePlus** / **DataGrip**:
   - Connect to your database
   - Open SQL console
   - Copy and paste the SQL from the migration file
   - Execute

## Option 4: For Vercel Production Database

If you're using Vercel Postgres:

1. Go to Vercel Dashboard → Your Project → Storage → Postgres
2. Click "Connect" or "Open Database"
3. Use the SQL Editor or connect via external tool
4. Run the migration SQL

Or use Vercel CLI:
```bash
vercel env pull .env.local
psql $DATABASE_URL -f scripts/add-allowed-sections-migration.sql
```

## Option 5: Quick Copy-Paste (Any SQL Tool)

Just copy this SQL and run it in your database tool:

```sql
-- Add allowedSections to User table
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "allowedSections" TEXT;

-- Add allowedSections to TenantInvitation table
ALTER TABLE "TenantInvitation" 
ADD COLUMN IF NOT EXISTS "allowedSections" TEXT;

-- Add indexes
CREATE INDEX IF NOT EXISTS "User_allowedSections_idx" ON "User"("allowedSections");
CREATE INDEX IF NOT EXISTS "TenantInvitation_allowedSections_idx" ON "TenantInvitation"("allowedSections");
```

## Verify Migration

After running, verify the columns were added:

```sql
-- Check User table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'User' AND column_name = 'allowedSections';

-- Check TenantInvitation table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'TenantInvitation' AND column_name = 'allowedSections';
```

## Important Notes

- The migration uses `IF NOT EXISTS` so it's safe to run multiple times
- Make sure you have a database backup before running migrations in production
- The migration is idempotent (won't cause errors if run twice)
