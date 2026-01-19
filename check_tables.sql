-- List all tables in the public schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check if SalesLead table exists (try different case variations)
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (
  table_name = 'SalesLead' OR 
  table_name = 'salesLead' OR 
  table_name = 'sales_lead' OR
  LOWER(table_name) = 'saleslead'
);

