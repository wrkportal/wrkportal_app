# Form Validation & Department Dropdown Update

## Summary
Updated both Add User and Edit User dialogs with comprehensive validation and changed the department field from a free-text input to a dropdown with predefined values.

## Changes Made

### 1. Department Dropdown
**Both Add User and Edit User dialogs now have:**
- Predefined department list with 15 standard departments:
  - Engineering
  - Product
  - Design
  - Marketing
  - Sales
  - Customer Success
  - Finance
  - Human Resources
  - Operations
  - Legal
  - IT
  - Quality Assurance
  - Research & Development
  - Business Development
  - Executive

### 2. Form Validation

#### First Name & Last Name
- **Rule**: Only letters, spaces, hyphens, and apostrophes allowed
- **Regex**: `/^[a-zA-Z\s\-']+$/`
- **Example Valid**: "John", "Mary-Jane", "O'Brien", "Van Der Berg"
- **Example Invalid**: "John123", "Mary@", "Test!"

#### Email
- **Rule**: Standard email format validation
- **Regex**: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- **Example Valid**: "user@example.com"
- **Example Invalid**: "user@", "user.com", "@example.com"

#### Phone Number (Optional)
- **Rule**: Accepts multiple international formats
- **Regex**: `/^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/`
- **Example Valid**: 
  - "+1234567890"
  - "(123) 456-7890"
  - "123-456-7890"
  - "1234567890"
- **Example Invalid**: "abc123", "12-34", "phone"

### 3. Real-time Error Display
- Errors appear immediately below the field in red text
- Border turns red when validation fails
- Errors clear automatically when user starts typing
- Helpful format hints shown for phone numbers

### 4. User Experience Improvements
- Clear error messages that explain what's wrong
- Visual feedback with red borders
- Format examples in placeholders
- Validation runs on form submit
- Prevents submission if validation fails

## Files Modified
1. `components/dialogs/add-user-dialog.tsx`
   - Added `DEPARTMENTS` constant
   - Added `errors` state
   - Added `validateForm()` function
   - Updated all input fields with validation
   - Changed department to Select dropdown

2. `components/dialogs/edit-user-dialog.tsx`
   - Added `DEPARTMENTS` constant
   - Added `errors` state
   - Added `validateForm()` function
   - Updated all input fields with validation
   - Changed department to Select dropdown

## Migration Steps

### Before You Test:
You need to run the Prisma migration for the reporting structure that was added earlier:

```bash
# 1. Stop your development server (Ctrl+C)

# 2. Generate the updated Prisma Client
npx prisma generate

# 3. Create and apply the migration
npx prisma migrate dev --name add_reporting_structure

# 4. Restart your development server
npm run dev
```

## Testing Checklist

### Add User Form:
- [ ] Try entering numbers in first/last name - should show error
- [ ] Try entering special characters in name - should show error
- [ ] Try entering invalid email format - should show error
- [ ] Try entering "abc" in phone - should show error
- [ ] Try entering valid phone formats - should work
- [ ] Select department from dropdown - should work
- [ ] Submit with all valid data - should create user

### Edit User Form:
- [ ] Same validation tests as Add User
- [ ] Department dropdown should show current selection
- [ ] Validation should work the same way

## Benefits
1. **Data Quality**: Only valid, properly formatted data enters the system
2. **User Experience**: Clear, immediate feedback on what needs to be fixed
3. **Consistency**: Standardized department names across the organization
4. **Security**: Prevents injection of invalid characters
5. **Maintainability**: Centralized validation logic

## Future Enhancements (Optional)
- Add more departments as needed
- Make departments configurable per tenant
- Add custom validation rules per organization
- Add phone number formatting on-the-fly
- Add location dropdown with common cities

