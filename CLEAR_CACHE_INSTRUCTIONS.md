# Clear Next.js Cache - Instructions

## 🚨 ChunkLoadError Fix

This error occurs when Next.js cache gets corrupted. Here's how to fix it:

### **Option 1: Manual Delete (Recommended)**

1. **Stop the dev server** (Ctrl+C)

2. **Delete the `.next` folder:**
   - Navigate to your project folder: `C:\Users\User\Desktop\wrkportal`
   - Delete the `.next` folder (it's a hidden folder, you may need to show hidden files)
   - Or use File Explorer: View → Show → Hidden items, then delete `.next`

3. **Restart dev server:**
   ```cmd
   npm run dev
   ```

### **Option 2: Using Command Line**

Open a **new terminal** (not the one running dev server) and run:

**For CMD:**
```cmd
cd C:\Users\User\Desktop\wrkportal
rmdir /s /q .next
```

**For PowerShell:**
```powershell
cd C:\Users\User\Desktop\wrkportal
Remove-Item -Recurse -Force .next
```

Then restart:
```cmd
npm run dev
```

### **Option 3: Full Clean (If above doesn't work)**

1. Stop dev server
2. Delete `.next` folder
3. Delete `node_modules/.cache` if it exists
4. Run:
   ```cmd
   npm run dev
   ```

## ✅ After Clearing Cache

1. The dev server will rebuild everything
2. Wait for "Ready" message
3. Refresh your browser
4. Try accessing Grid Editor again

## 🔍 Why This Happens

- Next.js caches compiled chunks
- When schema/Prisma changes, cache can become stale
- Clearing `.next` forces a fresh rebuild

**This should fix the ChunkLoadError!** 🚀

