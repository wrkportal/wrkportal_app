-- Fix tenant creation to include 'type' column
-- This ensures new tenants have the type column set

-- Update existing tenants that might have NULL type (if any)
UPDATE "Tenant" 
SET "type" = 'ORGANIZATION' 
WHERE "type" IS NULL;

-- Verify all tenants have a type
SELECT 
    id,
    name,
    domain,
    type,
    CASE 
        WHEN type IS NULL THEN '❌ MISSING TYPE'
        ELSE '✅ Has type'
    END as status
FROM "Tenant";
