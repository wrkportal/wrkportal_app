# 🔄 Database Migration Required

## ⚠️ Important: Run This Migration

I've added `location` and `department` fields to the User model in the Prisma schema. You need to run a database migration to apply these changes.

---

## 📋 **Step-by-Step Instructions:**

### **Option 1: Using Prisma Migrate (Recommended)**

Run this command in your terminal:

```bash
npx prisma migrate dev --name add_location_department
```

This will:

1. Create a new migration file
2. Apply the changes to your database
3. Regenerate the Prisma Client

### **Option 2: Using Prisma DB Push (Quick)**

If you're just in development and don't need migration history:

```bash
npx prisma db push
```

This will:

1. Push the schema changes directly to the database
2. Regenerate the Prisma Client

---

## ✅ **Changes Made:**

### **Prisma Schema (`prisma/schema.prisma`)**

Added two new fields to the User model:

```prisma
model User {
  // ... existing fields

  phone         String?
  location      String?    // NEW
  department    String?    // NEW
  timezone      String    @default("UTC")
  locale        String    @default("en")

  // ... rest of fields
}
```

---

## 🧪 **After Running Migration:**

1. **Restart your Next.js dev server:**

   ```bash
   # Stop the server (Ctrl+C)
   # Then start again:
   npm run dev
   ```

2. **Test the new fields:**
   - Go to Settings → Profile tab
   - You should now see Location and Department fields
   - Fill them in and click "Save Changes"
   - They should save successfully!

---

## ❗ **If You Get Errors:**

### Error: "PrismaClient is not configured to run in this browser"

- Restart your Next.js server

### Error: "Unknown field location/department"

- Make sure you ran the migration command
- Restart your Next.js server

### Error: "Column does not exist"

- Run `npx prisma db push` to sync the database

---

## 🎉 **What's New:**

1. ✅ Location field in database
2. ✅ Department field in database
3. ✅ Avatar upload functionality (click avatar to upload)
4. ✅ Removed "Joined date" from profile
5. ✅ Removed "Battlefield Metrics" text
6. ✅ All numbers show real data (0 if no data)

---

Run the migration command above and you're ready to go! 🚀
