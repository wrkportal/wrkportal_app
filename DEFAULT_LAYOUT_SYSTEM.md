# Default Layout System

## Overview
The Default Layout System allows **Platform Owners** to set default layouts for all pages in the application. These defaults are used for first-time users or users who have not customized their layouts.

## How It Works

### 1. Database Schema
- **Table:** `DefaultLayout`
- **Fields:**
  - `pageKey`: Identifier for the page (e.g., "my-work", "roadmap")
  - `targetRole`: Optional role filter (applies to specific roles or all if null)
  - `layoutData`: JSON data storing the layout configuration
  - `tenantId`: Tenant-specific defaults

### 2. Priority System
When a user loads a page, the system checks for layouts in this order:
1. **User's Personal Layout** (stored in localStorage)
2. **Role-Specific Default** (from database, if exists)
3. **General Default** (from database, if exists)
4. **Hardcoded Default** (fallback)

### 3. API Endpoints

#### GET `/api/default-layouts?pageKey={pageKey}&role={role}`
Retrieve default layout for a specific page and role.

#### POST `/api/default-layouts`
Save a default layout (Platform Owner only).

**Body:**
```json
{
  "pageKey": "my-work",
  "targetRole": "TEAM_MEMBER", // optional
  "layoutData": {
    "widgets": [...],
    "layouts": {...}
  }
}
```

#### DELETE `/api/default-layouts?pageKey={pageKey}&targetRole={role}`
Remove a default layout (Platform Owner only).

### 4. Usage in Pages

#### Import the Hook and Button
```typescript
import { useDefaultLayout } from "@/hooks/useDefaultLayout"
import { SaveDefaultLayoutButton } from "@/components/ui/save-default-layout-button"
```

#### Load Default Layout
```typescript
const { loadDefaultLayout } = useDefaultLayout()

useEffect(() => {
  const loadLayouts = async () => {
    const savedLayout = localStorage.getItem('my-page-layout')
    
    if (savedLayout) {
      // User has personalized layout
      setLayout(JSON.parse(savedLayout))
    } else {
      // Load default from DB
      const defaultLayoutData = await loadDefaultLayout('my-page')
      if (defaultLayoutData) {
        setLayout(defaultLayoutData)
      }
    }
  }
  
  loadLayouts()
}, [])
```

#### Add Save Button (Platform Owner Only)
```typescript
<SaveDefaultLayoutButton
  pageKey="my-page"
  getCurrentLayout={() => currentLayoutState}
/>
```

## Applying to Other Pages

To add default layout support to any page:

1. **Import the hook and button component**
2. **Update the layout loading logic** to check for defaults
3. **Add the SaveDefaultLayoutButton** to the page header
4. **Use a unique pageKey** for each page

### Example Pages to Implement:
- ✅ My Work (`my-work`)
- ✅ AI Assistant (`ai-assistant`)
- ⏳ Collaborate (`collaborate`)
- ⏳ Roadmap (`roadmap`)
- ⏳ Projects (`projects`)
- ⏳ Reports (`reports`)

## For Platform Owners

### How to Set a Default Layout:

1. **Arrange your page** exactly as you want it to appear for users
2. **Click "Save as Default"** button in the top right
3. **Choose scope:**
   - "All Users (Default)" - applies to everyone
   - Specific role - applies only to that role
4. **Confirmation** - You'll see "Saved!" when successful

### Tips:
- Set role-specific layouts for different user types
- General defaults are fallbacks for roles without specific layouts
- Users can still customize their own layouts

## Technical Notes

- Layouts are stored as JSON in the database
- Uses Prisma for database operations
- Platform Owner check is enforced at API level
- Works across tenants (multi-tenant safe)
- Backwards compatible with existing localStorage layouts

