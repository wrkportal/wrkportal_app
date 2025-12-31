# Reporting Studio Schema Changes

## Overview
This document outlines the database schema additions needed for the advanced Reporting Studio platform.

## Changes Required

### 1. Add to Tenant Model Relations
Add these relations to the `Tenant` model:
```prisma
reportingDataSources      ReportingDataSource[]
reportingDatasets         ReportingDataset[]
reportingVisualizations   ReportingVisualization[]
reportingReports          ReportingReport[]
reportingTemplates        ReportingReportTemplate[]
reportingTransformations  ReportingTransformation[]
reportingQueryCache       ReportingQueryCache[]
reportingQueryLogs        ReportingQueryLog[]
reportingActivities       ReportingActivity[]
```

### 2. Add to User Model Relations
Add these relations to the `User` model:
```prisma
dataSourcesCreated        ReportingDataSource[]     @relation("DataSourceCreator")
dataSourcesUpdated        ReportingDataSource[]     @relation("DataSourceUpdater")
datasetsCreated           ReportingDataset[]        @relation("DatasetCreator")
datasetsUpdated           ReportingDataset[]        @relation("DatasetUpdater")
visualizationsCreated     ReportingVisualization[]  @relation("VisualizationCreator")
visualizationsUpdated     ReportingVisualization[]  @relation("VisualizationUpdater")
reportsCreated            ReportingReport[]         @relation("ReportCreator")
reportsUpdated            ReportingReport[]         @relation("ReportUpdater")
templatesCreated          ReportingReportTemplate[] @relation("TemplateCreator")
templatesUpdated          ReportingReportTemplate[] @relation("TemplateUpdater")
transformationsCreated    ReportingTransformation[] @relation("TransformationCreator")
transformationsUpdated    ReportingTransformation[] @relation("TransformationUpdater")
datasetPermissions        ReportingDatasetPermission[]      @relation("DatasetPermissions")
visualizationPermissions  ReportingVisualizationPermission[] @relation("VisualizationPermissions")
dashboardPermissions      ReportingDashboardPermission[]    @relation("DashboardPermissions")
reportPermissions         ReportingReportPermission[]       @relation("ReportPermissions")
queryLogs                 ReportingQueryLog[]               @relation("QueryLogs")
reportingActivities       ReportingActivity[]               @relation("ReportingActivities")
```

### 3. Add to OrgUnit Model Relations
Add these relations to the `OrgUnit` model:
```prisma
datasetPermissions        ReportingDatasetPermission[]      @relation("DatasetOrgUnitPermissions")
visualizationPermissions  ReportingVisualizationPermission[] @relation("VisualizationOrgUnitPermissions")
dashboardPermissions      ReportingDashboardPermission[]    @relation("DashboardOrgUnitPermissions")
reportPermissions         ReportingReportPermission[]       @relation("ReportOrgUnitPermissions")
```

### 4. Update ReportingDashboard Model
Add `tenantId` field and new relations:
```prisma
model ReportingDashboard {
  // ... existing fields ...
  tenantId        String                    // ADD THIS
  tenant          Tenant                    @relation(fields: [tenantId], references: [id], onDelete: Cascade)  // ADD THIS
  widgets         ReportingDashboardWidget[]  @relation("DashboardWidgets")  // ADD THIS
  datasets        ReportingDashboardDataset[] @relation("DashboardDatasets")  // ADD THIS
  reports         ReportingReport[]           @relation("DashboardReports")   // ADD THIS
  permissions     ReportingDashboardPermission[] @relation("DashboardPermissions")  // ADD THIS
  
  @@index([tenantId])  // ADD THIS
  // ... existing indexes ...
}
```

### 5. Add All Models from Extension
Add all models from `prisma/reporting-studio-schema-extension.prisma` to the main schema.

## Migration Strategy

1. **Phase 1**: Add new models (no breaking changes)
2. **Phase 2**: Add `tenantId` to `ReportingDashboard` (data migration needed for existing records)
3. **Phase 3**: Add relations to Tenant, User, OrgUnit models
4. **Phase 4**: Run migrations and update application code

## Notes

- All new models include `tenantId` for multi-tenant isolation
- All models include audit fields (createdBy, updatedBy, createdAt, updatedAt)
- Permission models support user-level, org-unit-level, and role-level permissions
- Row-level and column-level security rules are stored as JSON in permission models
- Query caching uses hash-based lookups for performance

