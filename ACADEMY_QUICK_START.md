# Quick Start: Academy Tutorial System

## For Super Admins

### Creating Your First Tutorial

1. **Navigate to Tutorial Management**
   ```
   /admin/tutorials
   ```

2. **Click "Add Tutorial"**

3. **Fill Required Fields:**
   - **Title**: "Welcome to ManagerBook"
   - **Description**: "Get started with project management basics"
   - **Type**: Video
   - **Duration**: "5 min"
   - **Level**: Beginner
   - **Section**: Project Management
   - **Category**: Getting Started
   - **Video URL**: `https://www.youtube.com/embed/YOUR_VIDEO_ID`

4. **Click "Create Tutorial"**

5. **Verify**: Navigate to `/academy` to see your tutorial live!

## For Users

1. Click "Academy" in sidebar
2. Browse tutorials by category
3. Click any card to watch/read
4. Use sidebar to filter by topic

## Video URL Format

✅ **Correct Format:**
```
https://www.youtube.com/embed/dQw4w9WgXcQ
```

❌ **Wrong Format:**
```
https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

## Database Setup

Run these commands once:

```bash
npx prisma migrate dev --name add_tutorials
npx prisma generate
```

## Key Pages

- **Academy**: `/academy` (all users)
- **Tutorial Admin**: `/admin/tutorials` (super admins only)
- **API**: `/api/tutorials` (programmatic access)

## Empty State

If you see "No Tutorials Yet" on the Academy page:
1. Go to `/admin/tutorials` as a super admin
2. Click "Add Tutorial" to create your first tutorial
3. Tutorials appear immediately for all users!

---

**You're ready to start creating tutorials!** 🚀

