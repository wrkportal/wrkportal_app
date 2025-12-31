// Reporting Studio Constants

export const REPORTING_STUDIO_CONFIG = {
  // Query limits
  MAX_QUERY_ROWS: 1000000, // 1 million rows max
  DEFAULT_QUERY_ROWS: 1000,
  QUERY_TIMEOUT_MS: 300000, // 5 minutes

  // Cache settings
  DEFAULT_CACHE_TTL: 3600, // 1 hour
  MAX_CACHE_TTL: 86400, // 24 hours

  // File upload limits
  MAX_FILE_SIZE: 500 * 1024 * 1024, // 500 MB
  ALLOWED_FILE_TYPES: ['csv', 'xlsx', 'xls', 'json', 'parquet', 'tsv'],
  
  // Pagination
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 1000,

  // Dataset refresh
  MIN_REFRESH_INTERVAL: 60, // 1 minute
  MAX_REFRESH_INTERVAL: 86400 * 7, // 7 days

  // Visualization limits
  MAX_DATA_POINTS: 100000,
  DEFAULT_CHART_HEIGHT: 400,
  DEFAULT_CHART_WIDTH: 800,

  // Dashboard limits
  MAX_WIDGETS_PER_DASHBOARD: 50,
  MAX_DASHBOARDS_PER_USER: 1000,

  // Rate limiting (requests per minute)
  RATE_LIMIT_QUERIES: 60,
  RATE_LIMIT_UPLOADS: 10,
  RATE_LIMIT_EXPORTS: 20,
} as const

export const SUPPORTED_DATABASES = [
  { value: 'postgresql', label: 'PostgreSQL', port: 5432 },
  { value: 'mysql', label: 'MySQL', port: 3306 },
  { value: 'mariadb', label: 'MariaDB', port: 3306 },
  { value: 'sqlserver', label: 'SQL Server', port: 1433 },
  { value: 'oracle', label: 'Oracle', port: 1521 },
  { value: 'snowflake', label: 'Snowflake', port: 443 },
  { value: 'redshift', label: 'Amazon Redshift', port: 5439 },
  { value: 'bigquery', label: 'Google BigQuery', port: 443 },
  { value: 'sqlite', label: 'SQLite', port: 0 },
] as const

export const SUPPORTED_SAAS_INTEGRATIONS = [
  { value: 'salesforce', label: 'Salesforce' },
  { value: 'quickbooks', label: 'QuickBooks' },
  { value: 'stripe', label: 'Stripe' },
  { value: 'hubspot', label: 'HubSpot' },
  { value: 'zendesk', label: 'Zendesk' },
  { value: 'jira', label: 'Jira' },
  { value: 'mailchimp', label: 'Mailchimp' },
  { value: 'google_analytics', label: 'Google Analytics' },
] as const

export const VISUALIZATION_CATEGORIES = {
  BASIC: ['BAR', 'LINE', 'AREA', 'PIE', 'DONUT'],
  ADVANCED: ['SANKEY', 'TREEMAP', 'SUNBURST', 'HEATMAP', 'BUBBLE'],
  GEOSPATIAL: ['MAP_CHOROPLETH', 'MAP_POINT', 'MAP_HEAT'],
  SPECIALIZED: ['WATERFALL', 'BOX_PLOT', 'GANTT', 'FUNNEL', 'NETWORK'],
  TABULAR: ['TABLE', 'PIVOT_TABLE'],
  METRIC: ['KPI', 'GAUGE'],
} as const

export const REPORT_TEMPLATE_CATEGORIES = [
  'Financial',
  'Sales',
  'Marketing',
  'Operations',
  'HR',
  'IT',
  'Custom',
] as const

