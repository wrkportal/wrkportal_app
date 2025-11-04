# Academy Feature - Complete Guide

## Overview
The Academy page is a comprehensive learning center where users can access video tutorials, text guides, and interactive content to master ManagerBook's features and tools.

## Features

### 1. **Tutorial Library**
- **18 tutorials** covering all aspects of the platform
- Multiple formats: Video tutorials and text guides
- Organized into 6 categories:
  - Getting Started (3 tutorials)
  - Project Management (3 tutorials)
  - Team Collaboration (3 tutorials)
  - AI Tools (3 tutorials)
  - Reporting & Analytics (3 tutorials)
  - Advanced Features (3 tutorials)

### 2. **Learning Levels**
- **Beginner**: For new users getting started
- **Intermediate**: For users familiar with basics
- **Advanced**: For power users and admins

### 3. **Tutorial Formats**

#### Video Tutorials
- Embedded YouTube videos
- Duration indicators
- Play button overlay
- Full-screen viewing in modal

#### Text Guides
- Step-by-step instructions
- Best practices
- Common pitfalls to avoid
- Structured content with headings

### 4. **Interactive Features**
- Click any tutorial card to view details
- Filter by category
- Track completion progress
- "Mark as Complete" functionality
- "Next Tutorial" navigation

### 5. **Dashboard Statistics**
- Total tutorials count
- Number of video lessons
- Number of text guides
- Completion progress tracker

### 6. **User-Friendly Navigation**
- Category filter buttons with icons
- Visual cards with thumbnails
- Duration and difficulty badges
- Hover effects for better UX

## How to Use

### Accessing the Academy
1. Click on **"Academy"** in the sidebar (appears between "AI Tools" and "Goals & OKRs")
2. The page is accessible to all user roles

### Filtering Tutorials
- Click category buttons at the top to filter:
  - All Tutorials
  - Getting Started
  - Project Management
  - Team Collaboration
  - AI Tools
  - Reporting & Analytics
  - Advanced Features

### Viewing a Tutorial

#### For Video Tutorials:
1. Click on any tutorial card with a video icon
2. A modal opens with the video player
3. Watch the video directly in the modal
4. Click "Mark as Complete" when finished
5. Click "Next Tutorial" to continue learning

#### For Text Guides:
1. Click on any tutorial card with a book icon
2. Read the structured content
3. Follow step-by-step instructions
4. Click "Mark as Complete" when finished

### Tutorial Information
Each tutorial card displays:
- **Title** and **Description**
- **Level Badge**: Beginner (green), Intermediate (blue), or Advanced (purple)
- **Duration**: Estimated time to complete
- **Type Icon**: Video (Play) or Text (Book)

## Tutorial Categories Explained

### Getting Started
Perfect for new users:
- Welcome to ManagerBook (5 min video)
- Navigating the Interface (8 min video)
- Creating Your First Project (10 min text)

### Project Management
Core PM skills:
- Project Planning Essentials (15 min video)
- Effective Task Management (12 min video)
- Mastering Gantt Charts (10 min text)

### Team Collaboration
Working with teams:
- Setting Up Your Team (8 min video)
- Managing Stakeholders (12 min text)
- Approval Workflows (10 min video)

### AI Tools
Leverage AI features:
- Getting Started with AI Assistant (10 min video)
- AI-Powered Charter Generation (8 min video)
- AI Risk Prediction (12 min text)

### Reporting & Analytics
Data insights:
- Creating Custom Reports (15 min video)
- Dashboard Analytics (10 min text)
- OKR Tracking and Management (12 min video)

### Advanced Features
Power user features:
- Workflow Automations (15 min video)
- Third-Party Integrations (10 min text)
- Security and Compliance (12 min text)

## Customization Options

### Adding New Tutorials
Edit `app/academy/page.tsx` and add to the `TUTORIALS` array:

```typescript
{
  id: 'unique-id',
  title: 'Tutorial Title',
  description: 'Brief description',
  type: 'video', // or 'text'
  duration: '10 min',
  level: 'Beginner', // 'Intermediate', or 'Advanced'
  category: 'Category Name',
  videoUrl: 'https://youtube.com/embed/VIDEO_ID', // for videos
}
```

### Updating Video URLs
Replace placeholder YouTube URLs with actual tutorial videos:
```typescript
videoUrl: 'https://www.youtube.com/embed/YOUR_VIDEO_ID'
```

### Adding New Categories
Add to the `CATEGORIES` array:
```typescript
{
  id: 'category-id',
  name: 'Display Name',
  icon: IconComponent
}
```

### Tracking Progress
The Academy includes a completion tracking system. Future enhancements can:
- Save completion status to database
- Show progress bars
- Award badges for completed categories
- Generate certificates

## Design Features

### Visual Elements
- **Gradient headers**: Blue to purple gradient for main title
- **Color-coded levels**: Green (Beginner), Blue (Intermediate), Purple (Advanced)
- **Icon system**: Visual icons for each category and tutorial type
- **Hover effects**: Cards lift on hover with border highlight
- **Responsive grid**: 1 column (mobile), 2 columns (tablet), 3 columns (desktop)

### Accessibility
- Clear visual hierarchy
- Readable font sizes
- Color-blind friendly badges
- Keyboard navigation support
- Screen reader compatible

## Technical Details

### File Location
- **Page Component**: `app/academy/page.tsx`
- **Navigation**: `components/layout/sidebar.tsx` (line 66-70)

### Dependencies
- React hooks: `useState`
- Lucide icons: Multiple icons for UI elements
- UI Components: Card, Button, Badge, Tabs
- Next.js: Client-side navigation

### State Management
- `selectedCategory`: Filter state for tutorials
- `selectedTutorial`: Currently viewed tutorial in modal

## Best Practices for Users

1. **Start with Getting Started** category if you're new
2. **Complete tutorials in order** within each category
3. **Mark tutorials as complete** to track progress
4. **Revisit tutorials** as needed for reference
5. **Practice immediately** after watching tutorials

## Future Enhancements

Potential improvements:
- [ ] Database integration for progress tracking
- [ ] User accounts with completion history
- [ ] Search functionality for tutorials
- [ ] Quiz questions to test knowledge
- [ ] Community ratings and comments
- [ ] Download PDF guides
- [ ] Mobile app integration
- [ ] Live webinar schedule
- [ ] Certification program
- [ ] Tutorial recommendations based on usage

## Support

If you need help with the Academy:
1. Start with the "Welcome to ManagerBook" tutorial
2. Use the AI Assistant for specific questions
3. Contact support through the platform
4. Check documentation for detailed guides

## Admin Controls (Future)

Admins may be able to:
- Upload custom tutorials
- Track team completion rates
- Assign required trainings
- Generate completion reports
- Customize tutorial content

---

**Note**: The current implementation uses placeholder YouTube URLs. Replace these with actual tutorial videos for production use.

