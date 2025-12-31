# Where Are the Workflow Widgets?

## 📍 Widget Location

The **Available Widgets** shown on workflow landing pages are **dashboard widgets** that can be added to your **Project Dashboard**.

## 🎯 How to Access Widgets

1. **Go to Project Dashboard**: Navigate to `/projects/dashboard` or click "View Dashboard" from any workflow page
2. **Open Widget Selector**: Click the "⚙️ Configure Widgets" button in the top right
3. **Toggle Widgets**: Check/uncheck widgets to show/hide them on your dashboard
4. **Widgets are Draggable**: Once visible, you can drag and resize widgets on the dashboard

## ✅ Implemented Widgets

These widgets are **fully functional**:

### Software Development
- ✅ **sprint-board** - Sprint Board Widget (`SprintBoardWidget`)
- ✅ **burndown-chart** - Burndown Chart (general widget)

### Sales
- ✅ **sales-pipeline** - Sales Pipeline Widget (`SalesPipelineWidget`)

### Marketing
- ✅ **campaign-performance** - Campaign Performance Widget (`CampaignPerformanceWidget`)

### Customer Service
- ✅ **ticket-queue** - Ticket Queue Widget (`TicketQueueWidget`)

### General Widgets (Available for All Workflows)
- ✅ **summary-stats** - Summary Statistics
- ✅ **daily-briefing** - AI Daily Briefing
- ✅ **project-cards** - Project Cards
- ✅ **budget-chart** - Budget Overview
- ✅ **risk-chart** - Risk Distribution
- ✅ **issues-chart** - Challenges & Issues
- ✅ **actions-chart** - Actions Taken
- ✅ **status-chart** - Project Status Distribution

## 🚧 Placeholder Widgets

These widgets are **listed as available** but show placeholder content until implemented:

### Software Development
- ⏳ **bug-tracker** - Bug Tracker
- ⏳ **deployment-pipeline** - Deployment Pipeline
- ⏳ **code-quality** - Code Quality Metrics
- ⏳ **release-calendar** - Release Calendar
- ⏳ **velocity-chart** - Sprint Velocity
- ⏳ **test-coverage** - Test Coverage

### Marketing
- ⏳ **lead-funnel** - Lead Funnel
- ⏳ **social-media-metrics** - Social Media Metrics
- ⏳ **content-calendar** - Content Calendar
- ⏳ **roi-tracker** - ROI Tracker
- ⏳ **conversion-funnel** - Conversion Funnel

### Sales
- ⏳ **revenue-forecast** - Revenue Forecast
- ⏳ **activity-tracker** - Sales Activity Tracker
- ⏳ **customer-relationship** - Customer Relationships
- ⏳ **sales-performance** - Sales Performance
- ⏳ **conversion-rate** - Conversion Rate

### Customer Service
- ⏳ **sla-tracker** - SLA Tracker
- ⏳ **customer-satisfaction** - Customer Satisfaction
- ⏳ **agent-performance** - Agent Performance
- ⏳ **knowledge-base** - Knowledge Base
- ⏳ **response-time** - Response Time

### Product Management
- ⏳ **product-roadmap** - Product Roadmap
- ⏳ **feature-requests** - Feature Requests
- ⏳ **user-feedback** - User Feedback
- ⏳ **analytics-dashboard** - Product Analytics
- ⏳ **release-planning** - Release Planning
- ⏳ **feature-adoption** - Feature Adoption
- ⏳ **nps-tracker** - NPS Tracker

## 🔧 Widget Implementation

Widgets are defined in:
- **Registry**: `lib/workflows/widgets.ts` - Widget configurations
- **Config**: `lib/workflows/config.ts` - Workflow widget assignments
- **Components**: `components/workflows/widgets/` - React components
- **Dashboard**: `app/projects/dashboard/page.tsx` - Widget rendering

## 📝 Adding New Widgets

To implement a new widget:

1. Create component in `components/workflows/widgets/[WidgetName]Widget.tsx`
2. Export from `components/workflows/widgets/index.ts`
3. Add to `renderWidget()` function in `app/projects/dashboard/page.tsx`
4. Widget will automatically appear in widget selector for compatible workflows

