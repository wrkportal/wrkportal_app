# How to Make a User a Super Admin

## Method 1: SQL Command (Direct Database)

### Find the User's Email First
```sql
SELECT id, email, name, role FROM "User" WHERE email = 'user@example.com';
```

### Update User Role to Super Admin
```sql
UPDATE "User" 
SET role = 'TENANT_SUPER_ADMIN' 
WHERE email = 'user@example.com';
```

### Verify the Change
```sql
SELECT id, email, name, role FROM "User" WHERE email = 'user@example.com';
```

---

## Method 2: Using Prisma Studio (GUI)

1. Open Prisma Studio:
```bash
npx prisma studio
```

2. Navigate to the **User** model
3. Find the user by email
4. Click on the user row
5. Change the `role` field to: **TENANT_SUPER_ADMIN**
6. Click **Save**

---

## Method 3: Using psql (PostgreSQL CLI)

```bash
# Connect to your database
psql -U your_username -d your_database_name

# Run the update command
UPDATE "User" SET role = 'TENANT_SUPER_ADMIN' WHERE email = 'user@example.com';

# Exit
\q
```

---

## Available User Roles

The system has these roles (from the schema):

- `TENANT_SUPER_ADMIN` - Full system access, can manage tutorials
- `ORG_ADMIN` - Organization management
- `PMO_LEAD` - PMO leadership
- `PROJECT_MANAGER` - Project management
- `TEAM_MEMBER` - Regular user
- `EXECUTIVE` - Executive access
- `RESOURCE_MANAGER` - Resource management
- `FINANCE_CONTROLLER` - Financial control
- `COMPLIANCE_AUDITOR` - Audit access
- `INTEGRATION_ADMIN` - Integration management

---

## Example: Complete Workflow

### 1. Check Current Role
```sql
SELECT id, email, name, role 
FROM "User" 
WHERE email = 'john.doe@company.com';
```

**Output:**
```
id          | email                  | name      | role
------------|------------------------|-----------|-------------
clfx123abc  | john.doe@company.com   | John Doe  | TEAM_MEMBER
```

### 2. Promote to Super Admin
```sql
UPDATE "User" 
SET role = 'TENANT_SUPER_ADMIN' 
WHERE email = 'john.doe@company.com';
```

### 3. Verify
```sql
SELECT id, email, name, role 
FROM "User" 
WHERE email = 'john.doe@company.com';
```

**Output:**
```
id          | email                  | name      | role
------------|------------------------|-----------|--------------------
clfx123abc  | john.doe@company.com   | John Doe  | TENANT_SUPER_ADMIN
```

✅ **Done!** John can now:
- Access `/admin/tutorials`
- Create/edit/delete tutorials
- Access all admin features

---

## Multiple Users at Once

To promote multiple users:

```sql
UPDATE "User" 
SET role = 'TENANT_SUPER_ADMIN' 
WHERE email IN (
    'admin1@company.com',
    'admin2@company.com',
    'admin3@company.com'
);
```

---

## Downgrade a Super Admin

To remove super admin access:

```sql
UPDATE "User" 
SET role = 'ORG_ADMIN'  -- or any other role
WHERE email = 'user@example.com';
```

---

## Important Notes

⚠️ **Security Considerations:**
- Only grant TENANT_SUPER_ADMIN to trusted users
- Super admins have full system access
- They can create/delete tutorials
- They can access security settings
- They can view audit logs

✅ **Best Practices:**
- Start with only 1-2 super admins
- Document who has super admin access
- Review super admin list regularly
- Use ORG_ADMIN for most admin tasks

---

## Troubleshooting

### "No rows updated"
- Check the email is correct (case-sensitive)
- User might not exist in database
- Verify you're connected to the correct database

### "Still can't access admin features"
- User needs to log out and log back in
- Clear browser cache
- Check session is refreshed

### "Permission denied"
- Your database user needs UPDATE permissions
- Contact database administrator

---

## Quick Reference Table

| Task | Command |
|------|---------|
| View user role | `SELECT role FROM "User" WHERE email = 'user@example.com';` |
| Make super admin | `UPDATE "User" SET role = 'TENANT_SUPER_ADMIN' WHERE email = 'user@example.com';` |
| Make org admin | `UPDATE "User" SET role = 'ORG_ADMIN' WHERE email = 'user@example.com';` |
| View all super admins | `SELECT email, name FROM "User" WHERE role = 'TENANT_SUPER_ADMIN';` |
| Count admins | `SELECT role, COUNT(*) FROM "User" GROUP BY role;` |

