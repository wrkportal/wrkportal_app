/**
 * Dynamic imports for heavy components to improve initial load time
 * These components will only load when needed, reducing bundle size
 */

import dynamic from 'next/dynamic'
import { ComponentType } from 'react'

// Loading component for suspense
const LoadingFallback = () => (
  <div className="flex items-center justify-center p-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
)

// Recharts components - large library, load dynamically
export const ResponsiveContainer = dynamic(
  () => import('recharts').then(mod => mod.ResponsiveContainer),
  { ssr: false, loading: () => LoadingFallback() }
) as ComponentType<any>

export const LineChart = dynamic(
  () => import('recharts').then(mod => mod.LineChart),
  { ssr: false }
) as ComponentType<any>

export const BarChart = dynamic(
  () => import('recharts').then(mod => mod.BarChart),
  { ssr: false }
) as ComponentType<any>

export const PieChart = dynamic(
  () => import('recharts').then(mod => mod.PieChart),
  { ssr: false }
) as ComponentType<any>

export const AreaChart = dynamic(
  () => import('recharts').then(mod => mod.AreaChart),
  { ssr: false }
) as ComponentType<any>

// Re-exports for other recharts components
export {
  Line,
  Bar,
  Pie,
  Area,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

// React Grid Layout - only load when dashboard is visible
export const ResponsiveGridLayout = dynamic(
  () => import('react-grid-layout').then(mod => {
    const { WidthProvider, Responsive } = mod
    return WidthProvider(Responsive)
  }),
  { 
    ssr: false,
    loading: () => <div className="h-screen w-full" /> 
  }
) as ComponentType<any>

// Heavy dialog components - load only when opened
export const TaskDialog = dynamic(
  () => import('@/components/dialogs/task-dialog').then(mod => ({ default: mod.TaskDialog })),
  { ssr: false }
)

export const TaskDetailDialog = dynamic(
  () => import('@/components/dialogs/task-detail-dialog').then(mod => ({ default: mod.TaskDetailDialog })),
  { ssr: false }
)

export const TimeTrackingDialog = dynamic(
  () => import('@/components/dialogs/time-tracking-dialog').then(mod => ({ default: mod.TimeTrackingDialog })),
  { ssr: false }
)

export const TimerNotesDialog = dynamic(
  () => import('@/components/dialogs/timer-notes-dialog').then(mod => ({ default: mod.TimerNotesDialog })),
  { ssr: false }
)

// Advanced widgets - load only when needed
export const AdvancedFormsWidget = dynamic(
  () => import('@/components/widgets/AdvancedFormsWidget').then(mod => ({ default: mod.AdvancedFormsWidget })),
  { ssr: false, loading: () => LoadingFallback() }
)

export const AdvancedMindMapWidget = dynamic(
  () => import('@/components/widgets/AdvancedMindMapWidget').then(mod => ({ default: mod.AdvancedMindMapWidget })),
  { ssr: false, loading: () => LoadingFallback() }
)

export const AdvancedCanvasWidget = dynamic(
  () => import('@/components/widgets/AdvancedCanvasWidget').then(mod => ({ default: mod.AdvancedCanvasWidget })),
  { ssr: false, loading: () => LoadingFallback() }
)

export const GanttChartWidget = dynamic(
  () => import('@/components/widgets/GanttChartWidget').then(mod => ({ default: mod.GanttChartWidget })),
  { ssr: false, loading: () => LoadingFallback() }
)
