# Academy Tutorial System - Complete Implementation Guide

## Overview
The Academy page has been completely rebuilt with a database-backed tutorial management system. Super admins can now create, edit, and delete tutorials that automatically appear for all users.

## Key Changes

### 1. **Sidebar Fixed Height** ✅
- Sidebar now maintains constant height regardless of expanded/collapsed sections
- Uses `flex flex-col h-full` with `overflow-y-auto` for scrollable content
- No more jarring height changes when expanding categories

### 2. **Renamed Section** ✅
- "Tools & Workings" → "ManagerBook Tools"
- Updated in both sidebar structure and database schema

### 3. **Removed Dummy Data** ✅
- All placeholder tutorials removed
- Page now fetches real data from database via API
- Shows appropriate messages when no tutorials exist

### 4. **Admin Tutorial Management** ✅
- New admin page at `/admin/tutorials`
- Full CRUD (Create, Read, Update, Delete) operations
- Only accessible to TENANT_SUPER_ADMIN users

### 5. **Real-time Updates** ✅
- Tutorials created by admins appear immediately
- All users see the same tutorial library
- View counts tracked automatically

## Database Schema

### Tutorial Model
```prisma
model Tutorial {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      Tenant   @relation(...)
  
  title       String
  description String   @db.Text
  type        TutorialType        // VIDEO, TEXT, INTERACTIVE
  duration    String              // e.g., "10 min"
  level       TutorialLevel       // BEGINNER, INTERMEDIATE, ADVANCED
  category    String              // "Getting Started", etc.
  section     TutorialSection     // PROJECT_MANAGEMENT, TOOLS_WORKINGS
  
  videoUrl    String?  @db.Text   // YouTube embed URL
  contentText String?  @db.Text   // Text tutorial content
  
  fileUrl     String?  @db.Text   // Future: uploaded files
  fileName    String?
  fileSize    Int?
  
  thumbnail   String?  @db.Text
  order       Int      @default(0)
  isPublished Boolean  @default(true)
  viewCount   Int      @default(0)
  
  createdById String
  createdBy   User     @relation("TutorialCreator", ...)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## API Endpoints

### GET /api/tutorials
- **Access**: All authenticated users
- **Returns**: Array of published tutorials
- **Query Params**: 
  - `section` - Filter by PROJECT_MANAGEMENT or TOOLS_WORKINGS
  - `category` - Filter by category name
- **Response**:
```json
{
  "tutorials": [
    {
      "id": "...",
      "title": "Welcome to ManagerBook",
      "description": "...",
      "type": "VIDEO",
      "duration": "5 min",
      "level": "BEGINNER",
      "category": "Getting Started",
      "section": "PROJECT_MANAGEMENT",
      "videoUrl": "https://youtube.com/embed/...",
      "viewCount": 42,
      "createdBy": {
        "name": "Admin User",
        "email": "admin@example.com"
      }
    }
  ]
}
```

### POST /api/tutorials
- **Access**: TENANT_SUPER_ADMIN only
- **Body**:
```json
{
  "title": "Tutorial Title",
  "description": "Detailed description",
  "type": "VIDEO",
  "duration": "10 min",
  "level": "BEGINNER",
  "category": "Getting Started",
  "section": "PROJECT_MANAGEMENT",
  "videoUrl": "https://youtube.com/embed/VIDEO_ID",
  "contentText": null,
  "order": 0,
  "isPublished": true
}
```

### GET /api/tutorials/[id]
- **Access**: All authenticated users
- **Returns**: Single tutorial with details
- **Side Effect**: Increments view count

### PUT /api/tutorials/[id]
- **Access**: TENANT_SUPER_ADMIN only
- **Body**: Partial tutorial data to update

### DELETE /api/tutorials/[id]
- **Access**: TENANT_SUPER_ADMIN only
- **Effect**: Permanently deletes tutorial

## Admin Interface (`/admin/tutorials`)

### Features
1. **Create Tutorial Dialog**
   - Title, description fields
   - Type selector (Video/Text/Interactive)
   - Duration input (e.g., "10 min")
   - Level selector (Beginner/Intermediate/Advanced)
   - Section selector (Project Management/ManagerBook Tools)
   - Category dropdown (filtered by section)
   - Video URL input (for videos)
   - Content text area (for text tutorials)
   - Display order number
   - Published toggle

2. **Tutorial List**
   - Shows all tutorials with metadata
   - View count displayed
   - Edit and Delete buttons
   - Draft badge for unpublished tutorials

3. **Statistics Dashboard**
   - Total tutorials count
   - Video tutorials count
   - Text guides count
   - Total views across all tutorials

4. **Access Control**
   - Shows "Access Denied" message for non-super-admins
   - Only TENANT_SUPER_ADMIN can create/edit/delete

## Academy Page (`/academy`)

### Features
1. **Sidebar Navigation**
   - Fixed height with scrollable content
   - "All Tutorials" option at top
   - Two main sections:
     - **Project Management** (expanded by default)
       - Getting Started
       - Planning & Execution
       - Team & Stakeholders
       - Reporting & Monitoring
     - **ManagerBook Tools** (collapsed by default)
       - AI Assistant
       - Automations
       - Integrations & Security
   - Tutorial count badges per category

2. **Main Content**
   - Stats cards (Total, Videos, Text, Completed)
   - Current category title (when filtered)
   - Tutorial grid (3 columns desktop, 2 tablet, 1 mobile)
   - Loading state
   - Empty state with helpful message

3. **Tutorial Cards**
   - Color-coded thumbnails (blue for video, green for text)
   - Duration badge
   - Title and description
   - Difficulty level badge (color-coded)
   - Hover effects

4. **Tutorial Modal Viewer**
   - Full-screen overlay
   - YouTube video player (for videos)
   - Formatted text content (for text tutorials)
   - Difficulty, duration, category badges
   - "Mark as Complete" button (UI only)
   - "Next Tutorial" button (UI only)

### Empty States
- **Loading**: Shows "Loading tutorials..." message
- **No Tutorials**: Shows graduation cap icon + helpful message

## How to Use

### For Super Admins

#### Creating a Tutorial

1. Navigate to `/admin/tutorials`
2. Click "Add Tutorial" button
3. Fill in the form:
   - **Title**: Clear, descriptive title
   - **Description**: Brief overview (1-2 sentences)
   - **Type**: Choose Video, Text, or Interactive
   - **Duration**: Estimate (e.g., "5 min", "10 min", "15 min")
   - **Level**: Beginner, Intermediate, or Advanced
   - **Section**: Project Management or ManagerBook Tools
   - **Category**: Select from dropdown (filtered by section)
   - **Video URL** (if video): Use YouTube embed format
     ```
     https://www.youtube.com/embed/VIDEO_ID
     ```
   - **Content Text** (if text): Enter tutorial content
   - **Order**: Display order within category (lower = first)
   - **Published**: Toggle to publish immediately
4. Click "Create Tutorial"
5. Tutorial appears in the list and is live for all users

#### Editing a Tutorial
1. Click the Edit icon (pencil) on any tutorial
2. Update fields as needed
3. Click "Update Tutorial"

#### Deleting a Tutorial
1. Click the Delete icon (trash) on any tutorial
2. Confirm deletion
3. Tutorial is permanently removed

### For Regular Users

1. Click "Academy" in the main sidebar
2. Browse tutorials:
   - Click "All Tutorials" to see everything
   - Expand/collapse sections
   - Click category to filter
3. Click any tutorial card to view details
4. Watch video or read content in the modal
5. Close modal to return to grid

## Video URL Format

For video tutorials, use the YouTube **embed** format:
```
❌ Wrong: https://www.youtube.com/watch?v=VIDEO_ID
✅ Correct: https://www.youtube.com/embed/VIDEO_ID
```

To get the embed URL:
1. Go to YouTube video
2. Click "Share"
3. Click "Embed"
4. Copy the URL from `src="..."` attribute

## Database Migration

To apply the schema changes:

```bash
npx prisma migrate dev --name add_tutorials
npx prisma generate
```

This creates the `Tutorial` model and enums.

## Categories by Section

### Project Management
- Getting Started
- Planning & Execution
- Team & Stakeholders
- Reporting & Monitoring

### ManagerBook Tools
- AI Assistant
- Automations
- Integrations & Security

## Future Enhancements

- [ ] File upload for video files (currently YouTube only)
- [ ] Thumbnail image upload
- [ ] Progress tracking (mark as complete with database)
- [ ] Tutorial completion certificates
- [ ] Tutorial search functionality
- [ ] Tutorial ratings and comments
- [ ] Tutorial prerequisites/dependencies
- [ ] Multi-language support
- [ ] Quizzes and assessments
- [ ] Tutorial analytics dashboard

## Troubleshooting

### "No Tutorials Yet" message
- Tutorials need to be created by a super admin at `/admin/tutorials`
- Check that tutorials are marked as "Published"
- Verify user is authenticated

### Can't access /admin/tutorials
- Only TENANT_SUPER_ADMIN users can access
- Check user role in database or user settings

### Video not playing
- Verify URL is in embed format (`/embed/VIDEO_ID`)
- Check video is not private or restricted
- Test URL directly in browser

### Tutorials not appearing
- Check browser console for API errors
- Verify database migration ran successfully
- Confirm tutorials exist and are published

## Security

- All API endpoints require authentication
- Create/Update/Delete restricted to TENANT_SUPER_ADMIN
- Tenant isolation (users only see their tenant's tutorials)
- View tracking doesn't expose user identity
- XSS protection for text content (use with caution)

## Performance

- Tutorials cached in client state after first load
- No re-fetching unless page is refreshed
- View count updated asynchronously
- Filtering happens client-side for instant response

---

**The Academy system is now fully functional with admin controls and real-time content management!** 🎓✨

