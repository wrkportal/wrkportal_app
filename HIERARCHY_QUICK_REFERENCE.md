# Visual Hierarchy - Quick Reference Card

## 🎨 3-Layer System

### **Apply to ALL Pages:**

```tsx
<main className="bg-background p-6">          {/* Layer 1: Page */}
  <section className="bg-section border rounded-lg p-6">  {/* Layer 2: Sections */}
    <Card className="bg-card">                {/* Layer 3: Cards */}
      Content here
    </Card>
  </section>
</main>
```

---

## 📐 Layer Breakdown

| Layer | Class | Light | Dark | Use For |
|-------|-------|-------|------|---------|
| **1** | `bg-background` | #FAFAFA | #0F0F0F | Page base |
| **2** | `bg-section` | #FCFCFC | #141414 | Content sections |
| **3** | `bg-card` | #FFFFFF | #1A1A1A | Cards/Items |

**Borders:** `border-border` - Now **20% lightness in dark mode** (more visible!)

---

## ✅ Quick Pattern

**Every page should follow this:**

1. **Page wrapper:** `bg-background`
2. **Content sections:** `bg-section` + `border` + `rounded-lg`
3. **Individual items:** `bg-card` (Cards component)

---

## 🎯 Examples

### Dashboard:
```tsx
<main className="bg-background p-6">
  <section className="bg-section border rounded-lg p-6">
    <h2>My Tasks</h2>
    <div className="grid grid-cols-3 gap-4">
      <Card className="bg-card">{/* Task */}</Card>
      <Card className="bg-card">{/* Task */}</Card>
      <Card className="bg-card">{/* Task */}</Card>
    </div>
  </section>
</main>
```

### List Page:
```tsx
<main className="bg-background p-6">
  <section className="bg-section border rounded-lg p-6">
    <h2>Projects</h2>
    <div className="space-y-4">
      <Card className="bg-card">{/* Project 1 */}</Card>
      <Card className="bg-card">{/* Project 2 */}</Card>
    </div>
  </section>
</main>
```

---

## 🔧 What Changed

### **Colors Updated:**

#### Light Mode:
- Background: `98%` → Very light gray
- Section: `99%` → Almost white
- Card: `100%` → Pure white
- Border: `88%` → Visible gray

#### Dark Mode:
- Background: `6%` → Very dark
- Section: `8%` → Slightly lighter
- Card: `10%` → More lighter
- Border: **`20%` → Much more visible!** ✅

---

## ⚡ Quick Check

**Is your page correct?**

✅ Page has `bg-background`
✅ Sections have `bg-section` + `border`
✅ Cards have `bg-card`
✅ 3 distinct layers visible in dark mode
✅ Borders visible in dark mode

---

## 🎊 Result

**Light Mode:** Background → Sections → Cards  
(Gray → Almost White → White)

**Dark Mode:** Background → Sections → Cards  
(Very Dark → Dark → Lighter)

**Borders:** Clearly visible in both modes!

---

**Full Guide:** See `docs/VISUAL_HIERARCHY_GUIDE.md`

