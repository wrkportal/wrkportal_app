/**
 * Tenant Filter Injector
 * Automatically injects tenantId filters into SQL queries to ensure multi-tenant isolation
 */

import { prisma } from '@/lib/prisma'

// Tables that have tenantId field and need tenant filtering
// These are Prisma model names (PascalCase) - will match against database table names (usually snake_case or PascalCase)
const TENANTED_TABLES = [
  'User', 'user', 'users',
  'Project', 'project', 'projects',
  'Task', 'task', 'tasks',
  'Program', 'program', 'programs',
  'Goal', 'goal', 'goals',
  'KeyResult', 'keyresult', 'key_results',
  'Risk', 'risk', 'risks',
  'Issue', 'issue', 'issues',
  'ChangeRequest', 'changerequest', 'change_requests',
  'Timesheet', 'timesheet', 'timesheets',
  'Budget', 'budget', 'budgets',
  'Integration', 'integration', 'integrations',
  'Grid', 'grid', 'grids',
  'ReportingVisualization', 'reportingvisualization', 'reporting_visualizations',
  'ReportingDashboard', 'reportingdashboard', 'reporting_dashboards',
  'ReportingDataset', 'reportingdataset', 'reporting_datasets',
  'ReportingDataSource', 'reportingdatasource', 'reporting_data_sources',
  'ReportingTransformation', 'reportingtransformation', 'reporting_transformations',
  'ReportingReportTemplate', 'reportingreporttemplate', 'reporting_report_templates',
  'ReportSchedule', 'reportschedule', 'report_schedules',
  'OrganizationPermission', 'organizationpermission', 'organization_permissions',
  'FunctionPermission', 'functionpermission', 'function_permissions',
  'RowLevelSecurityRule', 'rowlevelsecurityrule', 'row_level_security_rules',
  'ColumnLevelSecurityRule', 'columnlevelsecurityrule', 'column_level_security_rules',
  'Comment', 'comment', 'comments',
  'Annotation', 'annotation', 'annotations',
  'ResourceShare', 'resourceshare', 'resource_shares',
  'ActivityFeed', 'activityfeed', 'activity_feeds',
  'DataCatalogEntry', 'datacatalogentry', 'data_catalog_entries',
  'DataLineage', 'datalineage', 'data_lineages',
  'DataQualityMetric', 'dataqualitymetric', 'data_quality_metrics',
  'DataUsage', 'datausage', 'data_usages',
  'DataRetentionPolicy', 'dataretentionpolicy', 'data_retention_policies',
  'ComplianceReport', 'compliancereport', 'compliance_reports',
  'IntegrationSyncJob', 'integrationsyncjob', 'integration_sync_jobs',
  'IntegrationTemplate', 'integrationtemplate', 'integration_templates',
]

// Map of table name variations (case-insensitive)
const normalizeTableName = (tableName: string): string => {
  const lower = tableName.toLowerCase().replace(/['"`]/g, '')
  // Try to match against known tenant tables
  for (const tenantTable of TENANTED_TABLES) {
    if (lower === tenantTable.toLowerCase() || lower.includes(tenantTable.toLowerCase())) {
      return tenantTable
    }
  }
  return tableName
}

/**
 * Check if a table name requires tenant filtering
 */
export function requiresTenantFilter(tableName: string): boolean {
  const normalized = normalizeTableName(tableName)
  return TENANTED_TABLES.some(t => t.toLowerCase() === normalized.toLowerCase())
}

/**
 * Inject tenant filter into SQL query WHERE clause
 */
export function injectTenantFilter(
  sql: string,
  tenantId: string,
  tableAliases?: Record<string, string>
): string {
  if (!tenantId) {
    throw new Error('tenantId is required for query execution')
  }

  // Escape tenantId to prevent SQL injection
  const escapedTenantId = tenantId.replace(/'/g, "''")

  // Parse SQL to find all table references
  const sqlUpper = sql.toUpperCase()
  
  // Extract table names from FROM and JOIN clauses
  const tableMatches: Array<{ name: string; alias?: string; position: number }> = []
  
  // Match FROM clause: FROM table_name [AS alias]
  const fromPattern = /FROM\s+([^\s(]+)(?:\s+(?:AS\s+)?(\w+))?/gi
  let match
  while ((match = fromPattern.exec(sql)) !== null) {
    const tableName = match[1].trim().replace(/['"`]/g, '')
    const alias = match[2]?.trim()
    if (requiresTenantFilter(tableName)) {
      tableMatches.push({
        name: tableName,
        alias,
        position: match.index,
      })
    }
  }
  
  // Match JOIN clauses: JOIN table_name [AS alias]
  const joinPattern = /JOIN\s+([^\s(]+)(?:\s+(?:AS\s+)?(\w+))?/gi
  while ((match = joinPattern.exec(sql)) !== null) {
    const tableName = match[1].trim().replace(/['"`]/g, '')
    const alias = match[2]?.trim()
    if (requiresTenantFilter(tableName)) {
      tableMatches.push({
        name: tableName,
        alias,
        position: match.index,
      })
    }
  }

  if (tableMatches.length === 0) {
    // No tenant tables found - query is safe but log it
    console.warn('Query does not reference any tenant-scoped tables:', sql.substring(0, 100))
    return sql
  }

  // Build tenant filter conditions
  // Use alias if available, otherwise use table name (may need quoting for case-sensitive names)
  const tenantFilters = tableMatches.map(({ name, alias }) => {
    const tableRef = alias || `"${name}"` // Quote table name for safety
    // Check if tenantId column exists - use quoted identifier for PostgreSQL
    return `${tableRef}."tenantId" = '${escapedTenantId}'`
  })

  // Combine filters with AND
  const combinedFilter = tenantFilters.join(' AND ')

  // Check if WHERE clause already exists
  const hasWhere = /WHERE\s+/i.test(sql)
  
  if (hasWhere) {
    // Add tenant filter to existing WHERE clause
    // Pattern: WHERE ... becomes WHERE (tenant_filter) AND (...)
    const wherePattern = /(WHERE\s+)/i
    const whereMatch = sql.match(wherePattern)
    if (whereMatch) {
      const whereIndex = whereMatch.index! + whereMatch[1].length
      // Insert tenant filter before existing conditions
      return (
        sql.slice(0, whereIndex) +
        `(${combinedFilter}) AND (` +
        sql.slice(whereIndex) +
        ')'
      )
    }
  } else {
    // Add new WHERE clause with tenant filter
    // Find the position after FROM/JOIN clauses, before GROUP BY/ORDER BY/LIMIT
    const orderByIndex = sqlUpper.search(/\s+(GROUP BY|ORDER BY|LIMIT|HAVING)\s+/i)
    const insertIndex = orderByIndex > 0 ? orderByIndex : sql.length
    
    return (
      sql.slice(0, insertIndex) +
      ` WHERE ${combinedFilter}` +
      sql.slice(insertIndex)
    )
  }

  return sql
}

/**
 * Validate that query contains tenant filters
 * Returns true if safe, throws error if unsafe
 */
export function validateTenantFilter(sql: string, tenantId: string): { valid: boolean; message?: string } {
  if (!tenantId) {
    return { valid: false, message: 'tenantId is required' }
  }

  const escapedTenantId = tenantId.replace(/'/g, "''")
  
  // Check if SQL contains tenant filter
  // Look for tenantId = 'tenantId' or tenantId='tenantId' patterns
  const tenantFilterPattern = new RegExp(
    `tenantId\\s*=\\s*['"]${escapedTenantId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`,
    'i'
  )

  // Extract table names from query
  const tableMatches: string[] = []
  const fromPattern = /FROM\s+([^\s(]+)/gi
  let match
  while ((match = fromPattern.exec(sql)) !== null) {
    const tableName = match[1].trim().replace(/['"`]/g, '')
    if (requiresTenantFilter(tableName)) {
      tableMatches.push(tableName)
    }
  }

  const joinPattern = /JOIN\s+([^\s(]+)/gi
  while ((match = joinPattern.exec(sql)) !== null) {
    const tableName = match[1].trim().replace(/['"`]/g, '')
    if (requiresTenantFilter(tableName)) {
      tableMatches.push(tableName)
    }
  }

  if (tableMatches.length > 0 && !tenantFilterPattern.test(sql)) {
    return {
      valid: false,
      message: `Query references tenant-scoped tables (${tableMatches.join(', ')}) but does not include tenantId filter. This query was automatically secured.`,
    }
  }

  return { valid: true }
}

/**
 * Secure SQL query by ensuring tenant isolation
 * This is the main function to call before executing any query
 */
export function secureQueryForTenant(sql: string, tenantId: string): string {
  // First validate
  const validation = validateTenantFilter(sql, tenantId)
  
  // If validation fails (missing tenant filter), inject it
  if (!validation.valid) {
    console.warn('Tenant filter missing in query, injecting automatically:', validation.message)
    return injectTenantFilter(sql, tenantId)
  }

  return sql
}

