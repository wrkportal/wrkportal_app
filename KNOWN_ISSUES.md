# 🐛 Known Issues - Production Blockers

## Critical Issues (Must Fix Before Production)

### 1. ❌ WBS Autocomplete Not Working
**Location**: Planning Tab → Work Breakdown Structure → "Assigned To" field

**Description**: 
The autocomplete feature for the "Assigned To" field in WBS tasks is not functioning correctly for new tasks or after tab switches.

**Expected Behavior**:
- User types in "Assigned To" field
- Dropdown appears above field with filtered user suggestions
- User can select from dropdown
- Selected user's name displays in field
- Works consistently for new and existing tasks

**Current Behavior**:
- Autocomplete intermittently fails
- May not appear for newly added tasks
- May stop working after switching tabs
- Dropdown positioning issues

**Workaround**:
- Users can manually type user IDs or names
- Tasks can still be assigned via other methods
- Data is saved correctly even if autocomplete doesn't work

**Impact**: 
- **Medium** - Feature works but UX is degraded
- Users can still assign tasks but less conveniently
- Not a data corruption or security issue

**Technical Details**:
- State management issue between parent and child components
- `orgUsers` prop not consistently passed to `WBSTaskRow`
- `searchText` state not properly synchronized
- Dropdown positioning with fixed positioning attempted but issues remain

**Files Affected**:
- `components/project-tabs/planning-tab.tsx` (lines 150-310)
- `app/projects/[id]/page.tsx` (orgUsers fetching)

**Attempted Fixes**:
1. ✅ Moved `orgUsers` to parent component - partial success
2. ✅ Added `searchText` state for typing - partial success  
3. ✅ Changed dropdown to fixed positioning - partial success
4. ✅ Made dropdown appear on typing (not focus) - works
5. ❌ Consistent functionality across all scenarios - still failing

**Recommended Next Steps**:
1. Consider using a proper autocomplete library (e.g., `@radix-ui/react-select` or `react-select`)
2. Refactor WBSTaskRow to be a controlled component
3. Use a portal for dropdown to avoid overflow issues
4. Add comprehensive logging to debug state flow
5. Consider simplifying to a regular dropdown (not autocomplete) temporarily

**Priority**: Fix in next sprint before production deployment

---

## High Priority Issues

### 2. (Add any other issues found during testing)

---

## Medium Priority Issues

### (To be populated during systematic testing)

---

## Low Priority / Enhancement Requests

### (To be populated during systematic testing)

---

**Last Updated**: November 2, 2025  
**Status**: Ready for systematic testing

