# Academy Page - Visual Layout Guide

```
┌─────────────────────────────────────────────────────────────────────┐
│ 🎓 Learning Academy                                                 │
│ Master ManagerBook with video tutorials and guides                  │
└─────────────────────────────────────────────────────────────────────┘

┌────────────┬────────────┬────────────┬────────────┐
│ 📚 Total   │ ▶️ Videos  │ 📄 Guides  │ ✅ Done    │
│    18      │     12     │     6      │    0       │
└────────────┴────────────┴────────────┴────────────┘

[🎓 All Tutorials] [▶️ Getting Started] [🎯 Project Management]
[👥 Team Collaboration] [✨ AI Tools] [📊 Reporting] [🚀 Advanced]

┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│  ▶️                 │ │  ▶️                 │ │  📚                 │
│     5 min           │ │     8 min           │ │    10 min           │
│                     │ │                     │ │                     │
│ Welcome to          │ │ Navigating the      │ │ Creating Your       │
│ ManagerBook         │ │ Interface           │ │ First Project       │
│                     │ │                     │ │                     │
│ Get started with... │ │ Learn how to...     │ │ Step-by-step...     │
│                     │ │                     │ │                     │
│ [Beginner] ⏱ 5 min │ │ [Beginner] ⏱ 8 min │ │ [Beginner] ⏱10 min │
└─────────────────────┘ └─────────────────────┘ └─────────────────────┘

┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│  ▶️                 │ │  ▶️                 │ │  📚                 │
│    15 min           │ │    12 min           │ │    10 min           │
│                     │ │                     │ │                     │
│ Project Planning    │ │ Task Management     │ │ Mastering Gantt     │
│ Essentials          │ │                     │ │ Charts              │
│                     │ │                     │ │                     │
│ Master the art...   │ │ Learn to create...  │ │ Create and manage.. │
│                     │ │                     │ │                     │
│ [Intermediate]      │ │ [Beginner]          │ │ [Intermediate]      │
└─────────────────────┘ └─────────────────────┘ └─────────────────────┘

[... more tutorial cards in a 3-column grid ...]


WHEN USER CLICKS A VIDEO TUTORIAL:
════════════════════════════════════════════════════════════════

┌───────────────────────────────────────────────────────────────┐
│                                                               X │
│  Project Planning Essentials                                   │
│  [Intermediate] ⏱ 15 min [Project Management]                 │
│                                                                 │
│  Master the art of planning with WBS, Gantt charts...          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                                                          │  │
│  │              📺 VIDEO PLAYER                             │  │
│  │         (YouTube Embedded Player)                        │  │
│  │                                                          │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [✅ Mark as Complete]           [Next Tutorial ➡]             │
│                                                                 │
└───────────────────────────────────────────────────────────────┘


WHEN USER CLICKS A TEXT TUTORIAL:
════════════════════════════════════════════════════════════════

┌───────────────────────────────────────────────────────────────┐
│                                                               X │
│  Mastering Gantt Charts                                        │
│  [Intermediate] ⏱ 10 min [Project Management]                 │
│                                                                 │
│  Create and manage Gantt charts for visual project planning   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Tutorial Content                                         │  │
│  │                                                          │  │
│  │ This comprehensive guide will walk you through...       │  │
│  │                                                          │  │
│  │ What You'll Learn                                        │  │
│  │ • Core concepts and principles                          │  │
│  │ • Step-by-step implementation                           │  │
│  │ • Best practices and tips                               │  │
│  │ • Common pitfalls to avoid                              │  │
│  │                                                          │  │
│  │ Getting Started                                          │  │
│  │ Let's begin with the fundamentals...                    │  │
│  │                                                          │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [✅ Mark as Complete]           [Next Tutorial ➡]             │
│                                                                 │
└───────────────────────────────────────────────────────────────┘


COLOR SCHEME:
═══════════════════════════════════════════════════════════════

Header Gradient: Blue → Purple
Beginner Badge:  🟢 Green (#10B981)
Intermediate:    🔵 Blue (#3B82F6)
Advanced:        🟣 Purple (#8B5CF6)

Cards: White with subtle shadow
Hover: Border highlight + lift effect
Background: Light gray/muted


RESPONSIVE BEHAVIOR:
═══════════════════════════════════════════════════════════════

Mobile (< 768px):    1 column
Tablet (768-1024px): 2 columns
Desktop (> 1024px):  3 columns

Stats cards stack vertically on mobile
Category buttons wrap to multiple rows on mobile
Modal takes full screen on mobile with scrolling
```

## Key Interactive Elements

### 1. Tutorial Cards
- **Hover**: Card lifts up, border appears
- **Click**: Opens modal with full content
- **Icons**: Video (▶️ Play) or Text (📚 Book)
- **Badges**: Color-coded by difficulty level

### 2. Category Filters
- **Default**: "All Tutorials" selected
- **Active State**: Filled button with primary color
- **Inactive State**: Outlined button
- **Icons**: Each category has a unique icon

### 3. Modal Viewer
- **Overlay**: Semi-transparent black backdrop
- **Close**: Click X button or click outside modal
- **Video**: YouTube player embedded (if video)
- **Text**: Formatted prose with headings and lists
- **Actions**: Mark complete and next tutorial buttons

### 4. Statistics Dashboard
- **Live Counts**: Total, Videos, Guides, Completed
- **Icons**: Each stat has colored icon background
- **Updates**: Completed count updates when marked

## User Journey Example

```
1. User logs in → Sees "Academy" in sidebar
   ↓
2. Clicks "Academy" → Lands on academy page
   ↓
3. Sees 18 tutorials + category filters
   ↓
4. Clicks "Getting Started" filter
   ↓
5. Sees only 3 beginner tutorials
   ↓
6. Clicks "Welcome to ManagerBook" card
   ↓
7. Modal opens with video player
   ↓
8. Watches 5-minute tutorial
   ↓
9. Clicks "Mark as Complete"
   ↓
10. Clicks "Next Tutorial"
    ↓
11. Continues learning journey...
```

## Benefits of This Design

✅ **Clean & Organized**: Clear visual hierarchy
✅ **Easy Navigation**: Filter by category quickly
✅ **Visual Indicators**: Icons, badges, colors
✅ **Progressive Learning**: Beginner → Advanced path
✅ **Engaging**: Beautiful cards with hover effects
✅ **Flexible**: Supports videos and text content
✅ **Trackable**: Progress monitoring built-in
✅ **Responsive**: Works on all devices
✅ **Professional**: Modern, polished appearance
✅ **Scalable**: Easy to add more tutorials

---

This Academy page transforms your project management tool into a complete learning platform! 🎓

