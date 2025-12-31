// Reporting Studio Type Definitions

// ============================================
// Data Sources
// ============================================

export enum DataSourceType {
  DATABASE = 'DATABASE',
  API = 'API',
  FILE = 'FILE',
  CLOUD_STORAGE = 'CLOUD_STORAGE',
  SAAS_INTEGRATION = 'SAAS_INTEGRATION',
}

export enum DataSourceStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ERROR = 'ERROR',
  TESTING = 'TESTING',
}

export interface DatabaseConnectionConfig {
  host: string
  port: number
  database: string
  username: string
  password: string // Encrypted
  ssl?: boolean
  schema?: string
  connectionPool?: {
    min?: number
    max?: number
  }
}

export interface APIConnectionConfig {
  baseUrl: string
  authType: 'none' | 'basic' | 'bearer' | 'oauth2' | 'api_key'
  credentials?: {
    username?: string
    password?: string
    token?: string
    apiKey?: string
    apiKeyHeader?: string
  }
  headers?: Record<string, string>
}

export interface DataSource {
  id: string
  tenantId: string
  name: string
  description?: string
  type: DataSourceType
  provider?: string
  connectionConfig: DatabaseConnectionConfig | APIConnectionConfig | Record<string, any>
  status: DataSourceStatus
  lastTestedAt?: Date
  lastError?: string
  createdById: string
  updatedById?: string
  createdAt: Date
  updatedAt: Date
}

export interface DataSourceTable {
  id: string
  dataSourceId: string
  schemaName?: string
  tableName: string
  tableType: 'TABLE' | 'VIEW' | 'MATERIALIZED_VIEW'
  description?: string
  rowCount?: bigint
  columnCount?: number
  lastSyncedAt?: Date
  schema?: ColumnDefinition[]
}

export interface ColumnDefinition {
  columnName: string
  dataType: string
  isNullable: boolean
  isPrimaryKey: boolean
  defaultValue?: string
  description?: string
  sampleValues?: any[]
}

export interface DataSourceColumn {
  id: string
  tableId: string
  columnName: string
  dataType: string
  isNullable: boolean
  isPrimaryKey: boolean
  defaultValue?: string
  description?: string
  sampleValues?: any[]
}

// ============================================
// Datasets
// ============================================

export enum DatasetType {
  QUERY = 'QUERY',
  FILE = 'FILE',
  API = 'API',
  TRANSFORMATION = 'TRANSFORMATION',
  MERGED = 'MERGED',
}

export enum DatasetStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ERROR = 'ERROR',
  REFRESHING = 'REFRESHING',
}

export interface Dataset {
  id: string
  tenantId: string
  name: string
  description?: string
  type: DatasetType
  dataSourceId?: string
  fileId?: string
  query?: string
  transformationConfig?: TransformationConfig
  schema?: ColumnDefinition[]
  rowCount?: bigint
  lastRefreshedAt?: Date
  refreshSchedule?: string
  status: DatasetStatus
  isPublic: boolean
  createdById: string
  updatedById?: string
  createdAt: Date
  updatedAt: Date
}

export interface TransformationConfig {
  steps: TransformationStep[]
}

export interface TransformationStep {
  type: 'filter' | 'sort' | 'group' | 'aggregate' | 'join' | 'pivot' | 'custom'
  config: Record<string, any>
}

// ============================================
// Visualizations
// ============================================

export enum VisualizationType {
  BAR = 'BAR',
  LINE = 'LINE',
  AREA = 'AREA',
  PIE = 'PIE',
  DONUT = 'DONUT',
  SCATTER = 'SCATTER',
  BUBBLE = 'BUBBLE',
  HEATMAP = 'HEATMAP',
  SANKEY = 'SANKEY',
  TREEMAP = 'TREEMAP',
  SUNBURST = 'SUNBURST',
  FUNNEL = 'FUNNEL',
  GAUGE = 'GAUGE',
  KPI = 'KPI',
  TABLE = 'TABLE',
  PIVOT_TABLE = 'PIVOT_TABLE',
  MAP_CHOROPLETH = 'MAP_CHOROPLETH',
  MAP_POINT = 'MAP_POINT',
  MAP_HEAT = 'MAP_HEAT',
  WATERFALL = 'WATERFALL',
  BOX_PLOT = 'BOX_PLOT',
  GANTT = 'GANTT',
  NETWORK = 'NETWORK',
  CUSTOM = 'CUSTOM',
}

export interface Visualization {
  id: string
  tenantId: string
  name: string
  description?: string
  type: VisualizationType
  datasetId: string
  config: VisualizationConfig
  query?: string
  filters?: FilterConfig[]
  xAxis?: string
  yAxis?: string
  series?: SeriesConfig[]
  styling?: StylingConfig
  width?: number
  height?: number
  isPublic: boolean
  createdById: string
  updatedById?: string
  createdAt: Date
  updatedAt: Date
}

export interface VisualizationConfig {
  chartType: VisualizationType
  axes?: {
    x?: AxisConfig
    y?: AxisConfig
    z?: AxisConfig
  }
  colors?: string[]
  legend?: LegendConfig
  tooltip?: TooltipConfig
  animation?: boolean
  [key: string]: any
}

export interface AxisConfig {
  field: string
  label?: string
  format?: string
  type?: 'linear' | 'log' | 'category' | 'time'
  min?: number
  max?: number
}

export interface LegendConfig {
  show: boolean
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export interface TooltipConfig {
  enabled: boolean
  format?: string
}

export interface SeriesConfig {
  field: string
  label: string
  type?: string
  color?: string
}

export interface StylingConfig {
  backgroundColor?: string
  fontFamily?: string
  fontSize?: number
  colors?: string[]
  [key: string]: any
}

export interface FilterConfig {
  field: string
  operator: 'equals' | 'notEquals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'between' | 'in' | 'notIn'
  value: any
}

// ============================================
// Dashboards
// ============================================

export interface Dashboard {
  id: string
  tenantId: string
  name: string
  description?: string
  configuration: DashboardConfig
  createdBy: string
  updatedBy: string
  deletedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface DashboardConfig {
  layout: 'grid' | 'freeform'
  gridColumns?: number
  gridRows?: number
  widgets: WidgetConfig[]
  filters?: FilterConfig[]
  refreshInterval?: number
  theme?: string
}

export interface WidgetConfig {
  id: string
  type: WidgetType
  visualizationId?: string
  title?: string
  config: Record<string, any>
  position: Position
  order: number
  filters?: FilterConfig[]
  refreshInterval?: number
}

export enum WidgetType {
  VISUALIZATION = 'VISUALIZATION',
  KPI = 'KPI',
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  IFRAME = 'IFRAME',
  FILTER_CONTROL = 'FILTER_CONTROL',
  CUSTOM = 'CUSTOM',
}

export interface Position {
  x: number
  y: number
  w: number
  h: number
}

// ============================================
// Reports
// ============================================

export enum ReportType {
  DASHBOARD_EXPORT = 'DASHBOARD_EXPORT',
  QUERY_RESULT = 'QUERY_RESULT',
  CUSTOM = 'CUSTOM',
  SCHEDULED = 'SCHEDULED',
}

export enum ReportFormat {
  PDF = 'PDF',
  EXCEL = 'EXCEL',
  CSV = 'CSV',
  POWERPOINT = 'POWERPOINT',
  HTML = 'HTML',
  JSON = 'JSON',
}

export enum ReportStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ERROR = 'ERROR',
}

export interface Report {
  id: string
  tenantId: string
  name: string
  description?: string
  type: ReportType
  templateId?: string
  dashboardId?: string
  config: ReportConfig
  format: ReportFormat
  schedule?: string
  recipients?: string[]
  lastGeneratedAt?: Date
  lastGeneratedBy?: string
  fileUrl?: string
  status: ReportStatus
  createdById: string
  updatedById?: string
  createdAt: Date
  updatedAt: Date
}

export interface ReportConfig {
  template?: string
  pages?: ReportPage[]
  header?: ReportHeaderFooter
  footer?: ReportHeaderFooter
  styling?: Record<string, any>
}

export interface ReportPage {
  content: any[]
  layout?: string
}

export interface ReportHeaderFooter {
  content?: string
  includeDate?: boolean
  includePageNumbers?: boolean
}

// ============================================
// Permissions
// ============================================

export enum PermissionLevel {
  NONE = 'NONE',
  VIEW = 'VIEW',
  EDIT = 'EDIT',
  DELETE = 'DELETE',
  ADMIN = 'ADMIN',
}

export interface Permission {
  id: string
  userId?: string
  orgUnitId?: string
  role?: string
  permission: PermissionLevel
  rowLevelRules?: RowLevelRule[]
  columnLevelRules?: ColumnLevelRule[]
}

export interface RowLevelRule {
  field: string
  operator: string
  value: any
  condition?: 'AND' | 'OR'
}

export interface ColumnLevelRule {
  columns: string[]
  action: 'hide' | 'mask' | 'readonly'
}

// ============================================
// Templates
// ============================================

export enum TemplateType {
  DASHBOARD = 'DASHBOARD',
  REPORT = 'REPORT',
  VISUALIZATION = 'VISUALIZATION',
}

export interface Template {
  id: string
  tenantId: string
  name: string
  description?: string
  category?: string
  type: TemplateType
  config: Record<string, any>
  previewImage?: string
  isPublic: boolean
  isSystem: boolean
  usageCount: number
  rating?: number
  createdById: string
  updatedById?: string
  createdAt: Date
  updatedAt: Date
}

// ============================================
// Transformations
// ============================================

export enum TransformationStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ERROR = 'ERROR',
}

export interface Transformation {
  id: string
  tenantId: string
  name: string
  description?: string
  inputDatasetId: string
  outputDatasetId?: string
  config: TransformationConfig
  code?: string
  status: TransformationStatus
  lastRunAt?: Date
  lastRunBy?: string
  errorMessage?: string
  createdById: string
  updatedById?: string
  createdAt: Date
  updatedAt: Date
}

// ============================================
// Query & Cache
// ============================================

export interface QueryRequest {
  query: string
  dataSourceId?: string
  datasetId?: string
  parameters?: Record<string, any>
  cache?: boolean
  cacheTTL?: number
}

export interface QueryResponse {
  data: any[]
  columns: ColumnDefinition[]
  rowCount: number
  executionTime: number
  cached: boolean
  error?: string
}

export enum QueryType {
  SELECT = 'SELECT',
  INSERT = 'INSERT',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  EXPLAIN = 'EXPLAIN',
  CUSTOM = 'CUSTOM',
}

// ============================================
// Activity & Audit
// ============================================

export enum EntityType {
  DATASOURCE = 'DATASOURCE',
  DATASET = 'DATASET',
  VISUALIZATION = 'VISUALIZATION',
  DASHBOARD = 'DASHBOARD',
  REPORT = 'REPORT',
  TEMPLATE = 'TEMPLATE',
  TRANSFORMATION = 'TRANSFORMATION',
}

export enum ActivityAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  VIEW = 'VIEW',
  SHARE = 'SHARE',
  EXPORT = 'EXPORT',
  EXECUTE = 'EXECUTE',
  PERMISSION_CHANGE = 'PERMISSION_CHANGE',
}

export interface Activity {
  id: string
  tenantId: string
  userId?: string
  entityType: EntityType
  entityId: string
  action: ActivityAction
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  createdAt: Date
}

// ============================================
// API Request/Response Types
// ============================================

export interface ListResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface CreateDataSourceRequest {
  name: string
  description?: string
  type: DataSourceType
  provider?: string
  connectionConfig: DatabaseConnectionConfig | APIConnectionConfig
}

export interface UpdateDataSourceRequest {
  name?: string
  description?: string
  connectionConfig?: DatabaseConnectionConfig | APIConnectionConfig
  status?: DataSourceStatus
}

export interface TestConnectionRequest {
  type: DataSourceType
  connectionConfig: DatabaseConnectionConfig | APIConnectionConfig
}

export interface CreateDatasetRequest {
  name: string
  description?: string
  type: DatasetType
  dataSourceId?: string
  fileId?: string
  query?: string
  transformationConfig?: TransformationConfig
  refreshSchedule?: string
  isPublic?: boolean
}

export interface CreateVisualizationRequest {
  name: string
  description?: string
  type: VisualizationType
  datasetId: string
  config: VisualizationConfig
  query?: string
  filters?: FilterConfig[]
  styling?: StylingConfig
  isPublic?: boolean
}

export interface CreateDashboardRequest {
  name: string
  description?: string
  configuration: DashboardConfig
}

export interface CreateReportRequest {
  name: string
  description?: string
  type: ReportType
  templateId?: string
  dashboardId?: string
  config: ReportConfig
  format: ReportFormat
  schedule?: string
  recipients?: string[]
}

// ============================================
// Error Types
// ============================================

export interface ReportingError {
  code: string
  message: string
  details?: Record<string, any>
}

export enum ErrorCode {
  DATASOURCE_NOT_FOUND = 'DATASOURCE_NOT_FOUND',
  DATASOURCE_CONNECTION_FAILED = 'DATASOURCE_CONNECTION_FAILED',
  DATASET_NOT_FOUND = 'DATASET_NOT_FOUND',
  QUERY_EXECUTION_FAILED = 'QUERY_EXECUTION_FAILED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  INVALID_CONFIGURATION = 'INVALID_CONFIGURATION',
  FILE_UPLOAD_FAILED = 'FILE_UPLOAD_FAILED',
  TRANSFORMATION_FAILED = 'TRANSFORMATION_FAILED',
}

