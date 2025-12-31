// Auto-Insights Module - Main Export
// Provides automatic insight generation from data analysis

export * from './statistical-analysis'
export * from './trend-detection'
export * from './insight-generator'

export type {
  StatisticalMetrics,
  DistributionAnalysis,
} from './statistical-analysis'

export type {
  TrendAnalysis,
  ChangePoint,
} from './trend-detection'

export type {
  Insight,
} from './insight-generator'

