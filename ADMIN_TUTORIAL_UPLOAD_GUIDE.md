# How to Upload Videos and Tutorials - Admin Guide

## Quick Access

**Tutorial Management Page**: `/admin/tutorials`

Or navigate: **Admin (in sidebar)** → **Tutorials**

---

## Step-by-Step Guide to Upload a Tutorial

### 1. **Access Tutorial Management**

- Log in as a **Super Admin** (TENANT_SUPER_ADMIN role)
- In the main sidebar, scroll to the bottom
- Click **"Admin"** to expand the admin menu
- Click **"Tutorials"** in the expanded menu
- You'll land on the Tutorial Management page

### 2. **Create a New Tutorial**

Click the **"Add Tutorial"** button (blue button in top-right corner)

A dialog will open with the following form fields:

---

## Form Fields Explained

### **Required Fields** (marked with *)

#### 1. **Title** *
- Name of the tutorial
- Example: "Getting Started with Projects"
- Keep it clear and descriptive

#### 2. **Description** *
- Brief overview of what users will learn
- Example: "Learn how to create and manage your first project in ManagerBook"
- 1-2 sentences recommended

#### 3. **Type** *
Choose one:
- **Video** - For YouTube video tutorials
- **Text** - For written step-by-step guides
- **Interactive** - For future interactive tutorials

#### 4. **Duration** *
- Estimated time to complete
- Format: "X min" (e.g., "5 min", "10 min", "15 min")
- Be realistic about the time needed

#### 5. **Level** *
Choose one:
- **Beginner** - For new users, basics
- **Intermediate** - For users familiar with basics
- **Advanced** - For power users, complex features

#### 6. **Section** *
Choose one:
- **Project Management** - PM-related tutorials (planning, teams, reporting)
- **ManagerBook Tools** - Tool-specific tutorials (AI, automations, integrations)

#### 7. **Category** *
Select from dropdown (options change based on section):

**Project Management Categories:**
- Getting Started
- Planning & Execution
- Team & Stakeholders
- Reporting & Monitoring

**ManagerBook Tools Categories:**
- AI Assistant
- Automations
- Integrations & Security

---

### **Conditional Fields**

#### For Video Tutorials:

**Video URL**
- YouTube embed URL (REQUIRED for videos)
- **Important**: Must be in embed format!

##### ✅ **Correct Format:**
```
https://www.youtube.com/embed/VIDEO_ID
```

##### ❌ **Wrong Format:**
```
https://www.youtube.com/watch?v=VIDEO_ID
```

##### How to Get the Embed URL:
1. Go to your YouTube video
2. Click **"Share"** button
3. Click **"Embed"**
4. Copy the URL from the `src="..."` attribute in the code
5. Paste into the Video URL field

**Example:**
```
https://www.youtube.com/embed/dQw4w9WgXcQ
```

#### For Text Tutorials:

**Content Text**
- Full tutorial content
- Can include line breaks (press Enter)
- Write step-by-step instructions
- Use clear headings and bullet points

**Example:**
```
Step 1: Navigate to Projects
Click on the Projects tab in the main navigation.

Step 2: Create New Project
Click the "New Project" button in the top right corner.

Step 3: Fill in Details
- Enter project name
- Set start and end dates
- Select project manager
- Click "Create"
```

---

### **Optional Fields**

#### **Display Order**
- Number determining position in category (default: 0)
- Lower numbers appear first
- Example: Order 1 shows before Order 2

#### **Published**
- Checkbox to publish immediately
- Checked = Tutorial visible to all users
- Unchecked = Draft mode (only admins can see)

---

## Example: Creating a Video Tutorial

Let's create a tutorial for "Getting Started with Projects"

### Fill in the form:

1. **Title**: "Creating Your First Project"
2. **Description**: "Learn how to create and set up your first project in ManagerBook"
3. **Type**: Video
4. **Duration**: "8 min"
5. **Level**: Beginner
6. **Section**: Project Management
7. **Category**: Getting Started
8. **Video URL**: `https://www.youtube.com/embed/YOUR_VIDEO_ID`
9. **Order**: 1
10. **Published**: ✓ (checked)

Click **"Create Tutorial"**

✅ **Done!** Tutorial is now live for all users in the Academy!

---

## Example: Creating a Text Tutorial

Let's create a tutorial for "Setting Up Automations"

### Fill in the form:

1. **Title**: "Creating Your First Automation"
2. **Description**: "Step-by-step guide to setting up workflow automations"
3. **Type**: Text
4. **Duration**: "10 min"
5. **Level**: Intermediate
6. **Section**: ManagerBook Tools
7. **Category**: Automations
8. **Content Text**:
```
Introduction
Automations help you save time by automating repetitive tasks.

Step 1: Access Automations
Navigate to AI Tools > Automations in the sidebar.

Step 2: Create New Automation
Click the "Create Automation" button...

[Continue with steps]
```
9. **Order**: 1
10. **Published**: ✓ (checked)

Click **"Create Tutorial"**

✅ **Done!**

---

## Managing Existing Tutorials

### **Edit a Tutorial**
1. Find the tutorial in the list
2. Click the **Edit (pencil)** icon
3. Update any fields
4. Click **"Update Tutorial"**

### **Delete a Tutorial**
1. Find the tutorial in the list
2. Click the **Delete (trash)** icon
3. Confirm deletion
4. Tutorial is permanently removed

### **Unpublish a Tutorial**
1. Click **Edit** on the tutorial
2. Uncheck the **Published** checkbox
3. Click **"Update Tutorial"**
4. Tutorial is now hidden from users (draft mode)

---

## Where Users See Tutorials

After you create a tutorial, it appears:

1. **Academy Page** (`/academy`)
   - Accessible from main sidebar
   - Filtered by categories
   - Displayed as cards with thumbnail

2. **Category Sections**
   - Under "Project Management" or "ManagerBook Tools"
   - With the category badge visible

3. **Filtered Views**
   - Users can click category names to filter
   - Your tutorial appears in the correct category

---

## Tutorial Statistics

On the Tutorial Management page, you can see:

- **Total Tutorials**: Count of all tutorials
- **Video Tutorials**: Count of video-based tutorials
- **Text Guides**: Count of text-based tutorials
- **Total Views**: Combined views across all tutorials

Each tutorial also shows:
- View count (👁️ icon)
- Published status (Draft badge if unpublished)
- Level (color-coded badge)

---

## Best Practices

### ✅ **DO:**
- Use clear, descriptive titles
- Write accurate descriptions
- Set realistic duration estimates
- Choose appropriate difficulty levels
- Test video URLs before publishing
- Start with "Published" checked for immediate availability
- Use display order to control tutorial sequence
- Keep content concise and actionable

### ❌ **DON'T:**
- Use regular YouTube URLs (must be embed format)
- Create duplicate tutorials
- Forget to set category correctly
- Leave tutorials unpublished indefinitely
- Make tutorials too long (split into multiple parts)

---

## Video Recording Tips

### Recommended Video Content:
1. **Introduction** (0:00-0:30)
   - What users will learn
   - Prerequisites if any

2. **Main Content** (0:30-7:00)
   - Step-by-step demonstration
   - Narrate what you're doing
   - Keep it focused

3. **Summary** (7:00-8:00)
   - Recap key points
   - Next steps or related tutorials

### Technical Requirements:
- **Resolution**: 1280x720 (720p) minimum
- **Length**: 5-15 minutes ideal
- **Audio**: Clear narration, no background noise
- **Screen**: Show actual application interface
- **Cursor**: Make cursor movements smooth and visible

---

## Troubleshooting

### "Video not showing"
- ✓ Verify URL is in embed format (`/embed/`)
- ✓ Check video is not private on YouTube
- ✓ Test URL in browser directly

### "Tutorial not appearing in Academy"
- ✓ Check "Published" is checked
- ✓ Verify correct section and category selected
- ✓ Refresh the Academy page

### "Can't access Tutorial Management"
- ✓ Must be logged in as TENANT_SUPER_ADMIN
- ✓ Other admin roles cannot manage tutorials
- ✓ Contact system administrator for role upgrade

---

## Quick Reference

| Field | Example | Notes |
|-------|---------|-------|
| Title | "Creating Your First Project" | Clear, descriptive |
| Description | "Learn how to create..." | 1-2 sentences |
| Type | Video | Video, Text, or Interactive |
| Duration | "8 min" | Include "min" |
| Level | Beginner | Color-coded in UI |
| Section | Project Management | 2 options |
| Category | Getting Started | Depends on section |
| Video URL | `https://youtube.com/embed/ID` | Embed format! |
| Order | 1 | Lower = first |
| Published | ✓ | Check to publish |

---

## Support

Need help? 
- Refer to `ACADEMY_SYSTEM_COMPLETE.md` for technical details
- Contact technical support for database issues
- Check browser console for API errors

---

**Happy Tutorial Creating!** 🎓✨

