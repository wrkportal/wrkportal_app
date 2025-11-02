# Getting Started with Enterprise Project Management

## Quick Start Guide

Follow these steps to run the application on your local machine.

### Step 1: Install Dependencies

First, you need to install the required Node.js packages. Run **ONE** of the following commands in your terminal from the project root directory:

```bash
npm install
```

or if you prefer yarn:

```bash
yarn install
```

or if you prefer pnpm:

```bash
pnpm install
```

**Note**: The installation may take 2-5 minutes depending on your internet connection.

### Step 2: Install Additional Required Package

One package is missing from the initial package.json. Install it with:

```bash
npm install tailwindcss-animate
```

or

```bash
yarn add tailwindcss-animate
```

or

```bash
pnpm add tailwindcss-animate
```

### Step 3: Run the Development Server

Start the Next.js development server:

```bash
npm run dev
```

or

```bash
yarn dev
```

or

```bash
pnpm dev
```

### Step 4: Open in Browser

Open your web browser and navigate to:

```
http://localhost:3000
```

You should see the Enterprise Project Management dashboard!

## Default User

The application will automatically log you in as a **Project Manager** with the following credentials (mock):

- **Name**: John Doe
- **Email**: john.doe@company.com
- **Role**: PROJECT_MANAGER

You can access:

- Home Dashboard
- My Work
- Projects
- Programs
- Roadmap
- Goals & OKRs
- Resources
- Timesheets
- Approvals
- Risks & Issues
- Reports
- Financials
- Automations

## Testing Different Roles

To test different role permissions:

1. Open `stores/authStore.ts`
2. Find the `mockUsers` array in `lib/mock-data.ts`
3. Change the default user initialization in `app/page.tsx` to use a different user:

```typescript
// Instead of mockUsers[0] (Project Manager)
setUser(mockUsers[1]) // Team Member
// or
setUser(mockUsers[2]) // PMO Lead
```

### Available Mock Users

1. **mockUsers[0]** - John Doe (Project Manager)
2. **mockUsers[1]** - Jane Smith (Team Member)
3. **mockUsers[2]** - Mike Johnson (PMO Lead)

## Key Features to Explore

### 1. Dashboard

- View project health metrics
- See your assigned tasks
- Track OKR progress
- Quick actions

### 2. Projects

- Switch between list and grid views
- Filter by status
- Click on a project to see details
- Explore the 8 tabs (Overview, Board, Timeline, Risks, Issues, Docs, Team, Analytics)

### 3. My Work

- View all your assigned tasks
- Filter by status (All, Active, Overdue, Completed)
- Click on tasks to navigate to project board

### 4. Goals & OKRs

- See company-level goals
- Track key results with progress bars
- View confidence scores

### 5. Resources

- View team workload
- Explore skills matrix
- Check capacity planning

### 6. Financials

- Track project budgets
- View budget utilization
- See budget categories breakdown

### 7. Admin Screens (if you have admin role)

- Organization management
- User administration
- Security settings
- Audit log

## Navigation Tips

### Sidebar Navigation

- The left sidebar shows all available screens based on your role
- Collapsible on mobile devices
- Active page is highlighted

### Header

- Search bar (placeholder)
- Notifications bell icon
- User profile dropdown
- Quick access to settings and logout

### Role-Based Access

Each role sees different menu items:

- **Tenant Super Admin**: Full system access
- **Org Admin**: Organization and user management
- **PMO Lead**: Portfolio and governance
- **Project Manager**: Project execution (default)
- **Team Member**: Personal work view
- And 6 more specialized roles

## Mock Data

All data is currently mocked in `lib/mock-data.ts` including:

- 3 Users
- 1 Portfolio
- 1 Program
- 3 Projects
- 4 Tasks
- 1 Goal with Key Results
- 2 Risks
- 1 Issue
- 1 Change Request
- 1 Timesheet

You can modify this data to test different scenarios.

## Common Issues & Solutions

### Issue: Port 3000 already in use

**Solution**: Either stop the process using port 3000 or run on a different port:

```bash
PORT=3001 npm run dev
```

### Issue: Module not found errors

**Solution**: Make sure all dependencies are installed:

```bash
npm install
npm install tailwindcss-animate
```

### Issue: Styles not loading

**Solution**:

1. Stop the dev server (Ctrl+C)
2. Delete `.next` folder
3. Run `npm run dev` again

### Issue: TypeScript errors

**Solution**: Run type checking:

```bash
npm run type-check
```

## Development Workflow

### Making Changes

1. **Components**: Add new components in `components/` directory
2. **Pages**: Add new pages in `app/` directory
3. **Types**: Update types in `types/index.ts`
4. **Mock Data**: Update mock data in `lib/mock-data.ts`
5. **Styles**: Use Tailwind CSS utility classes

### Hot Reload

The development server supports hot reload. Save any file and the browser will automatically refresh to show your changes.

### Building for Production

To create an optimized production build:

```bash
npm run build
npm start
```

## Project Structure

```
enterprise-project-management/
├── app/                    # Next.js pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── projects/          # Projects section
│   ├── programs/          # Programs section
│   └── ...
├── components/
│   ├── ui/                # Reusable UI components
│   ├── common/            # Shared components
│   └── layout/            # Layout components
├── lib/
│   ├── utils.ts           # Utilities
│   └── mock-data.ts       # Mock data
├── stores/
│   ├── authStore.ts       # Auth state
│   └── uiStore.ts         # UI state
└── types/
    └── index.ts           # TypeScript types
```

## Next Steps

1. ✅ Explore all the screens
2. ✅ Test different user roles
3. ✅ Customize mock data
4. ✅ Modify styles and themes
5. 🔄 Integrate with a real backend API
6. 🔄 Add database persistence
7. 🔄 Implement authentication
8. 🔄 Add real-time features
9. 🔄 Deploy to production

## Need Help?

- Check the main README.md for detailed documentation
- Review the code comments in each file
- Explore the `types/index.ts` file for data structure

## Congratulations! 🎉

You now have a fully functional enterprise project management application running locally. Explore the features and customize it to your needs!

---

**Happy coding! 🚀**
