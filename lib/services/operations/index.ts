/**
 * Operations Services
 * 
 * Centralized business logic for all operations modules.
 * These services provide reusable functions that can be used
 * by API endpoints and UI components.
 */

export { WorkOrdersService } from './work-orders.service'
export { ResourcesService } from './resources.service'
export { InventoryService } from './inventory.service'
export { PerformanceService } from './performance.service'
export { ComplianceService } from './compliance.service'
export { DashboardService } from './dashboard.service'

export type {
  WorkOrderFilters,
  WorkOrderStats,
} from './work-orders.service'

export type {
  CapacityStats,
  AttendanceStats,
} from './resources.service'

export type {
  InventoryStats,
  LowStockItem,
} from './inventory.service'

export type {
  KPIStats,
  QualityStats,
} from './performance.service'

export type {
  ComplianceStats,
} from './compliance.service'

export type {
  DashboardStats,
} from './dashboard.service'

