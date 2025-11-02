# Project Date Validation Against Program Dates ✅

## ✅ COMPLETE - Projects Must Fall Within Program Date Range

Projects now have date validation to ensure they fall within their parent program's date range. Both client-side and server-side validation have been implemented.

---

## 🔍 Validation Rules

### **Rule 1: Project Start Date**
```
Project Start Date >= Program Start Date
```
✅ Project can start on the same day as the program  
✅ Project can start after the program starts  
❌ Project CANNOT start before the program starts

### **Rule 2: Project End Date**
```
Project End Date <= Program End Date
```
✅ Project can end on the same day as the program  
✅ Project can end before the program ends  
❌ Project CANNOT end after the program ends

### **Visual Example:**

```
Program Timeline:     |=========================================|
                   Jan 1, 2025                           Dec 31, 2025

Valid Project 1:            |================|
                         Feb 1            Jun 30

Valid Project 2:                  |===================|
                               May 1               Nov 30

Invalid Project:    |===================|
                 Dec 1, 2024      Mar 31, 2025
                 ❌ Starts before program
```

---

## 📝 Changes Made

### **1. Client-Side Validation (Initiative Dialog)**

**File: `components/dialogs/initiative-dialog.tsx`**

#### **Updated Program Interface**

**Added startDate and endDate:**
```typescript
interface Program {
    id: string
    name: string
    startDate?: string  // ✅ Added
    endDate?: string    // ✅ Added
}
```

#### **Added Validation in handleSubmit**

**Before (No Validation):**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
        await onSubmit(formData)
    } catch (error) {
        console.error('Error submitting initiative:', error)
    } finally {
        setSubmitting(false)
    }
}
```

**After (With Validation):**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate project dates against program dates
    if (formData.programId && formData.programId !== 'none') {
        const selectedProgram = programs.find(p => p.id === formData.programId)
        if (selectedProgram && selectedProgram.startDate && selectedProgram.endDate) {
            const projectStart = new Date(formData.startDate)
            const projectEnd = new Date(formData.endDate)
            const programStart = new Date(selectedProgram.startDate)
            const programEnd = new Date(selectedProgram.endDate)
            
            if (projectStart < programStart) {
                alert(`❌ Project start date must be on or after the program start date (${new Date(selectedProgram.startDate).toLocaleDateString()})`)
                return
            }
            
            if (projectEnd > programEnd) {
                alert(`❌ Project end date must be on or before the program end date (${new Date(selectedProgram.endDate).toLocaleDateString()})`)
                return
            }
        }
    }
    
    setSubmitting(true)
    
    try {
        await onSubmit(formData)
    } catch (error) {
        console.error('Error submitting initiative:', error)
    } finally {
        setSubmitting(false)
    }
}
```

**Changes:**
- ✅ Validates dates before submitting
- ✅ Finds the selected program from the programs array
- ✅ Compares project dates with program dates
- ✅ Shows user-friendly error messages with the program's dates
- ✅ Prevents form submission if validation fails
- ✅ Only validates if a program is selected

---

### **2. Server-Side Validation (Projects API)**

**File: `app/api/projects/route.ts`**

**Added Validation After Code Check:**

```typescript
// Check if project code already exists
const existingProject = await prisma.project.findUnique({
  where: { code: validatedData.code },
})

if (existingProject) {
  return NextResponse.json(
    { error: 'Project code already exists' },
    { status: 400 }
  )
}

// ✅ NEW: Validate project dates against program dates if program is specified
if (validatedData.programId) {
  const program = await prisma.program.findUnique({
    where: { id: validatedData.programId },
    select: { startDate: true, endDate: true, name: true },
  })

  if (program) {
    const projectStart = new Date(validatedData.startDate)
    const projectEnd = new Date(validatedData.endDate)
    const programStart = new Date(program.startDate)
    const programEnd = new Date(program.endDate)

    if (projectStart < programStart) {
      return NextResponse.json(
        {
          error: `Project start date must be on or after the program start date (${programStart.toLocaleDateString()})`,
        },
        { status: 400 }
      )
    }

    if (projectEnd > programEnd) {
      return NextResponse.json(
        {
          error: `Project end date must be on or before the program end date (${programEnd.toLocaleDateString()})`,
        },
        { status: 400 }
      )
    }
  }
}

// Create project
const project = await prisma.project.create({
  // ... project data
})
```

**Changes:**
- ✅ Fetches program from database if `programId` is provided
- ✅ Validates project start date >= program start date
- ✅ Validates project end date <= program end date
- ✅ Returns 400 error with descriptive message if validation fails
- ✅ Only validates if program exists
- ✅ Prevents invalid projects from being created

---

## 🎯 Validation Flow

### **Client-Side (Instant Feedback):**

```
1. User fills initiative form
    ↓
2. User selects a program
    ↓
3. User enters start and end dates
    ↓
4. User clicks "Add Initiative"
    ↓
5. Client-side validation runs:
    - Check if program is selected
    - Get program's dates from programs array
    - Compare project dates with program dates
    ↓
6a. If dates invalid:
    - Alert shown with error message
    - Form submission prevented
    - User can fix dates
    
6b. If dates valid:
    - Form submitted to API
    - Server-side validation runs
```

### **Server-Side (Security Layer):**

```
1. API receives project creation request
    ↓
2. Validate schema (Zod)
    ↓
3. Check if code exists
    ↓
4. If programId provided:
    - Fetch program from database
    - Validate project start >= program start
    - Validate project end <= program end
    ↓
5a. If dates invalid:
    - Return 400 error
    - Show error message to user
    
5b. If dates valid:
    - Create project in database
    - Return success
```

---

## 📊 Example Scenarios

### **Scenario 1: Valid Project**

**Program:**
- Start: Jan 1, 2025
- End: Dec 31, 2025

**Project:**
- Start: Mar 1, 2025 ✅
- End: Jun 30, 2025 ✅

**Result:** ✅ Project created successfully

---

### **Scenario 2: Project Starts Too Early**

**Program:**
- Start: Jan 1, 2025
- End: Dec 31, 2025

**Project:**
- Start: **Dec 15, 2024** ❌
- End: Mar 31, 2025

**Result:** 
```
❌ Project start date must be on or after the program start date (1/1/2025)
```

---

### **Scenario 3: Project Ends Too Late**

**Program:**
- Start: Jan 1, 2025
- End: Jun 30, 2025

**Project:**
- Start: Feb 1, 2025 ✅
- End: **Aug 31, 2025** ❌

**Result:**
```
❌ Project end date must be on or before the program end date (6/30/2025)
```

---

### **Scenario 4: No Program Selected**

**Project:**
- Start: Any date
- End: Any date

**Result:** ✅ No validation (project not part of a program)

---

## 🚀 Testing Instructions

### **Test 1: Valid Dates**
```bash
# 1. Create a program with dates: Jan 1, 2025 - Dec 31, 2025
# 2. Click "Add Initiative"
# 3. Select the program
# 4. Enter dates:
#    - Start: Mar 1, 2025
#    - End: Jun 30, 2025
# 5. Click "Add Initiative"
# Expected: ✅ Project created successfully
```

### **Test 2: Start Date Too Early**
```bash
# 1. Use program from Test 1 (starts Jan 1, 2025)
# 2. Click "Add Initiative"
# 3. Select the program
# 4. Enter dates:
#    - Start: Dec 1, 2024 (before program start)
#    - End: Mar 31, 2025
# 5. Click "Add Initiative"
# Expected: ❌ Alert: "Project start date must be on or after the program start date (1/1/2025)"
```

### **Test 3: End Date Too Late**
```bash
# 1. Use program from Test 1 (ends Dec 31, 2025)
# 2. Click "Add Initiative"
# 3. Select the program
# 4. Enter dates:
#    - Start: Nov 1, 2025
#    - End: Jan 31, 2026 (after program end)
# 5. Click "Add Initiative"
# Expected: ❌ Alert: "Project end date must be on or before the program end date (12/31/2025)"
```

### **Test 4: No Program Selected**
```bash
# 1. Click "Add Initiative"
# 2. Select "None" for program
# 3. Enter any dates
# 4. Click "Add Initiative"
# Expected: ✅ No validation, project created
```

### **Test 5: Exact Same Dates**
```bash
# 1. Use program from Test 1 (Jan 1 - Dec 31, 2025)
# 2. Click "Add Initiative"
# 3. Select the program
# 4. Enter exact same dates:
#    - Start: Jan 1, 2025 (same as program)
#    - End: Dec 31, 2025 (same as program)
# 5. Click "Add Initiative"
# Expected: ✅ Project created (same dates are allowed)
```

### **Test 6: Server-Side Validation**
```bash
# 1. Bypass client-side validation (using browser dev tools or API call)
# 2. Send project with invalid dates
# Expected: 400 error from API with error message
```

---

## ✅ Summary

### **What Works:**
- ✅ Client-side validation (instant feedback)
- ✅ Server-side validation (security layer)
- ✅ User-friendly error messages
- ✅ Shows program dates in error messages
- ✅ Prevents invalid projects from being created
- ✅ Only validates when program is selected
- ✅ Allows projects with same dates as program
- ✅ Works for all project creation methods
- ✅ No linter errors

### **Validation Layers:**

| Layer | Location | Purpose |
|-------|----------|---------|
| **Client-Side** | `initiative-dialog.tsx` | Instant user feedback |
| **Server-Side** | `app/api/projects/route.ts` | Data integrity & security |

### **User Experience:**
- 🚀 **Fast feedback** - Validation before API call
- 🎯 **Clear errors** - Shows program dates in message
- 💡 **Helpful** - User knows exactly what to fix
- 🔒 **Secure** - Server validates even if client bypassed

**Projects now respect program date boundaries!** 🎉

