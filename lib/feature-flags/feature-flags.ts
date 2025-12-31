/**
 * Feature Flags System
 * Enable/disable features for beta testing and gradual rollout
 */

export interface FeatureFlag {
  key: string
  enabled: boolean
  description: string
  beta?: boolean // Beta feature flag
  rolloutPercentage?: number // Gradual rollout (0-100)
}

/**
 * Feature flags configuration
 * In production, these would be stored in database or environment variables
 */
export const featureFlags: Record<string, FeatureFlag> = {
  // Reporting Studio Features
  'reporting-studio': {
    key: 'reporting-studio',
    enabled: true,
    description: 'Reporting Studio main feature',
  },
  'schedules': {
    key: 'schedules',
    enabled: true,
    description: 'Report scheduling feature',
  },
  'transformations': {
    key: 'transformations',
    enabled: true,
    description: 'Data transformation builder',
  },
  'marketplace': {
    key: 'marketplace',
    enabled: true,
    description: 'Template marketplace',
    beta: true,
  },
  'grid-editor': {
    key: 'grid-editor',
    enabled: true,
    description: 'Excel-like grid editor',
    beta: true,
  },

  // Beta Features
  'ai-insights': {
    key: 'ai-insights',
    enabled: false,
    description: 'AI-powered insights and recommendations',
    beta: true,
    rolloutPercentage: 0,
  },
  'advanced-analytics': {
    key: 'advanced-analytics',
    enabled: false,
    description: 'Advanced analytics features',
    beta: true,
    rolloutPercentage: 0,
  },
  'real-time-collaboration': {
    key: 'real-time-collaboration',
    enabled: false,
    description: 'Real-time collaborative editing',
    beta: true,
    rolloutPercentage: 0,
  },
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(
  featureKey: string,
  userId?: string
): boolean {
  const flag = featureFlags[featureKey]

  if (!flag) {
    return false // Feature doesn't exist, disabled by default
  }

  if (!flag.enabled) {
    return false // Feature explicitly disabled
  }

  // Check gradual rollout
  if (flag.rolloutPercentage !== undefined) {
    if (flag.rolloutPercentage === 0) {
      return false
    }
    if (flag.rolloutPercentage === 100) {
      return true
    }

    // For gradual rollout, use user ID hash
    if (userId) {
      const hash = hashUserId(userId)
      return hash % 100 < flag.rolloutPercentage
    }

    // No user ID, check if in rollout percentage
    return Math.random() * 100 < flag.rolloutPercentage
  }

  return true
}

/**
 * Hash user ID for consistent feature flag assignment
 */
function hashUserId(userId: string): number {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

/**
 * Get all enabled features
 */
export function getEnabledFeatures(userId?: string): string[] {
  return Object.keys(featureFlags).filter((key) =>
    isFeatureEnabled(key, userId)
  )
}

/**
 * Get beta features
 */
export function getBetaFeatures(): FeatureFlag[] {
  return Object.values(featureFlags).filter((flag) => flag.beta)
}

/**
 * Check if user has access to beta features
 */
export function hasBetaAccess(userId: string): boolean {
  // In production, check user's beta access status from database
  // For now, return true for all users
  return true
}


