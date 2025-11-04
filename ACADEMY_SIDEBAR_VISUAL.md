# Academy Sidebar - Visual Layout Guide

## Complete Page Layout

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Main Nav     │  Academy Sidebar        │  Main Content Area                    │
│  Sidebar      │  (New!)                 │                                       │
├───────────────┼─────────────────────────┼───────────────────────────────────────┤
│               │                         │                                       │
│ 🏠 Home       │ 🎓 All Tutorials       │  🎓 Learning Academy                  │
│ 🗺️ Roadmap    │    23 lessons           │  Master ManagerBook with tutorials    │
│ ✨ AI Tools   │                         │                                       │
│ 🎓 Academy ✓  │ ────────────────────    │  📚18  ▶️12  📄6  ✅0               │
│ 🎯 Goals      │                         │  [Statistics Cards in Grid]          │
│ 📊 Reports    │ 🎯 Project Management ▼ │                                       │
│ ✅ Approvals  │    ▶️ Getting Started 3  │  ┌──────────┐ ┌──────────┐ ┌───────┐│
│               │    📅 Planning & Exe… 4  │  │  Video   │ │  Video   │ │ Text  ││
│               │    👥 Team & Stakeho…3   │  │Tutorial  │ │Tutorial  │ │ Guide ││
│               │    📊 Reporting & Mo…3   │  │   5min   │ │   8min   │ │ 10min ││
│               │                         │  └──────────┘ └──────────┘ └───────┘│
│ Programs &    │ ✨ Tools & Workings   ▶ │  ┌──────────┐ ┌──────────┐ ┌───────┐│
│ Projects      │                         │  │Tutorial  │ │Tutorial  │ │ Guide ││
│               │                         │  └──────────┘ └──────────┘ └───────┘│
│               │                         │                                       │
│ 🤖 AI Assist  │                         │  [More tutorials in grid...]          │
│ ⚙️ Admin      │                         │                                       │
│               │                         │                                       │
└───────────────┴─────────────────────────┴───────────────────────────────────────┘
    256px              256px                      Remaining width
```

## Academy Sidebar (Detailed View)

### Default State (Project Management Expanded)

```
┌─────────────────────────────────┐
│ Academy Sidebar                  │
├─────────────────────────────────┤
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 🎓 All Tutorials             │ │
│ │    23 lessons                │ │ ← Selected (Blue background)
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 🎯 Project Management      ▼│ │ ← Expanded
│ └─────────────────────────────┘ │
│   │                             │
│   ├─ ▶️ Getting Started      [3]│ ← Category with count
│   │                             │
│   ├─ 📅 Planning & Execution [4]│
│   │                             │
│   ├─ 👥 Team & Stakeholders  [3]│
│   │                             │
│   └─ 📊 Reporting & Monit…   [3]│
│                                 │
│ ┌─────────────────────────────┐ │
│ │ ✨ Tools & Workings        ▶│ │ ← Collapsed
│ └─────────────────────────────┘ │
│                                 │
│                                 │
│                                 │
└─────────────────────────────────┘
```

### With Tools & Workings Expanded

```
┌─────────────────────────────────┐
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 🎓 All Tutorials             │ │
│ │    23 lessons                │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 🎯 Project Management      ▼│ │ ← Still expanded
│ └─────────────────────────────┘ │
│   ├─ ▶️ Getting Started      [3]│
│   ├─ 📅 Planning & Execution [4]│
│   ├─ 👥 Team & Stakeholders  [3]│
│   └─ 📊 Reporting & Monit…   [3]│
│                                 │
│ ┌─────────────────────────────┐ │
│ │ ✨ Tools & Workings        ▼│ │ ← Now expanded
│ └─────────────────────────────┘ │
│   │                             │
│   ├─ ✨ AI Assistant         [4]│
│   │                             │
│   ├─ ⚙️ Automations           [3]│
│   │                             │
│   └─ 🛡️ Integrations & Sec… [3]│
│                                 │
└─────────────────────────────────┘
```

### With Category Selected (Planning & Execution)

```
┌─────────────────────────────────┐
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 🎓 All Tutorials             │ │
│ │    23 lessons                │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 🎯 Project Management      ▼│ │
│ └─────────────────────────────┘ │
│   │                             │
│   ├─ ▶️ Getting Started      [3]│
│   │                             │
│   ├─┏━━━━━━━━━━━━━━━━━━━━━━━━┓│
│   │┃📅 Planning & Execution [4]┃│ ← Selected (Blue)
│   │┗━━━━━━━━━━━━━━━━━━━━━━━━┛│
│   │                             │
│   ├─ 👥 Team & Stakeholders  [3]│
│   │                             │
│   └─ 📊 Reporting & Monit…   [3]│
│                                 │
│ ┌─────────────────────────────┐ │
│ │ ✨ Tools & Workings        ▶│ │
│ └─────────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

## Main Content Changes Based on Selection

### All Tutorials Selected
```
Main Content Shows:
┌──────────────────────────────────────────┐
│ 🎓 Learning Academy                      │
│ Master ManagerBook with tutorials        │
│                                          │
│ [Stats: 23 total, 16 videos, 7 guides]  │
│                                          │
│ [Grid of ALL 23 tutorials]              │
│ ▶️ Welcome  ▶️ Navigation  📚 First...   │
│ ▶️ Planning ▶️ Tasks      📚 Gantt...    │
│ [... all tutorials ...]                  │
└──────────────────────────────────────────┘
```

### Category Selected (e.g., "Planning & Execution")
```
Main Content Shows:
┌──────────────────────────────────────────┐
│ 🎓 Learning Academy                      │
│ Master ManagerBook with tutorials        │
│                                          │
│ [Stats: 23 total, 16 videos, 7 guides]  │
│                                          │
│ Planning & Execution                     │
│ 4 tutorials in this category             │
│                                          │
│ [Grid of ONLY 4 matching tutorials]     │
│ ▶️ Project Planning Essentials           │
│ ▶️ Effective Task Management             │
│ 📚 Mastering Gantt Charts                │
│ ▶️ Work Breakdown Structure              │
└──────────────────────────────────────────┘
```

## Interactive States

### Hover States

#### All Tutorials (Hovering)
```
┌─────────────────────────────┐
│ 🎓 All Tutorials             │ ← Light gray background
│    23 lessons                │   (hover effect)
└─────────────────────────────┘
```

#### Category Item (Hovering)
```
├─ ▶️ Getting Started      [3]│ ← Light gray background
                                (hover effect)
```

### Active/Selected States

#### All Tutorials (Selected)
```
┌─────────────────────────────┐
│ 🎓 All Tutorials             │ ← Primary blue background
│    23 lessons                │   White text
└─────────────────────────────┘
```

#### Category (Selected)
```
├─ 📅 Planning & Execution [4]│ ← Primary blue background
                                White text
```

### Section Expand/Collapse Animation

#### Collapsed
```
│ ✨ Tools & Workings        ▶│ ← Chevron pointing right
```

#### Expanded
```
│ ✨ Tools & Workings        ▼│ ← Chevron pointing down
│   ├─ ✨ AI Assistant      [4]│ ← Categories visible
│   ├─ ⚙️ Automations        [3]│
│   └─ 🛡️ Integrations...   [3]│
```

## Category Count Badges

```
Getting Started          [3]  ← Gray badge
Planning & Execution     [4]  ← Gray badge
Team & Stakeholders      [3]  ← Gray badge
```

Small, rounded badges showing tutorial count for each category.

## Responsive Layout

### Desktop (1920px)
```
[256px Nav] [256px Academy] [1408px Content with 3-col grid]
```

### Laptop (1366px)
```
[256px Nav] [256px Academy] [854px Content with 3-col grid]
```

### Tablet (768px)
```
[Overlay Nav] [256px Academy] [512px Content with 2-col grid]
```

### Mobile (360px) - Future Enhancement
```
[Overlay Nav] [Collapsible Academy] [Content with 1-col grid]
```

## Color Scheme

### Section Icons
- 🎯 Project Management: `text-blue-600`
- ✨ Tools & Workings: `text-purple-600`

### Backgrounds
- Selected: `bg-primary` (your theme blue)
- Hover: `hover:bg-accent` (light gray)
- Sidebar: `bg-card` (white/dark depending on theme)

### Borders
- Sidebar right border: `border-r border-border`
- Category left border: `border-l-2 border-border`

### Badges
- Category count: `bg-secondary` (light gray)

## Icons Used

### Navigation
- 🎓 GraduationCap (All Tutorials)
- 🎯 Target (Project Management)
- ✨ Sparkles (Tools & Workings)
- ▶️ Play (Getting Started, Video tutorials)
- 📅 Calendar (Planning & Execution)
- 👥 Users (Team & Stakeholders)
- 📊 BarChart3 (Reporting & Monitoring)
- ⚙️ Workflow (Automations)
- 🛡️ Shield (Integrations & Security)
- ▼ ChevronDown (Expanded section)

### Tutorial Cards
- ▶️ Play (Video icon)
- 📚 BookOpen (Text guide icon)
- 🕐 Clock (Duration)
- 🏷️ Badge (Difficulty level)

---

**This new sidebar provides a clean, organized way to navigate through 23 tutorials across 2 main sections and 7 categories!** 🎓✨

