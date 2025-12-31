/**
 * Launch Analytics & Tracking
 * Track key metrics during launch and post-launch
 */

export interface LaunchMetrics {
  timestamp: string
  event: string
  userId?: string
  tenantId?: string
  metadata?: Record<string, any>
}

/**
 * Track launch event
 */
export function trackLaunchEvent(
  event: string,
  metadata?: Record<string, any>
): void {
  if (typeof window === 'undefined') return

  const metrics: LaunchMetrics = {
    timestamp: new Date().toISOString(),
    event,
    metadata,
  }

  // Store in localStorage for now (can be sent to analytics service)
  const events = JSON.parse(localStorage.getItem('launch_events') || '[]')
  events.push(metrics)
  localStorage.setItem('launch_events', JSON.stringify(events.slice(-100))) // Keep last 100 events

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Launch Analytics]', event, metadata)
  }
}

/**
 * Track feature adoption
 */
export function trackFeatureAdoption(
  feature: string,
  action: string,
  metadata?: Record<string, any>
): void {
  trackLaunchEvent('feature_adoption', {
    feature,
    action,
    ...metadata,
  })
}

/**
 * Track user registration
 */
export function trackUserRegistration(metadata?: Record<string, any>): void {
  trackLaunchEvent('user_registration', metadata)
}

/**
 * Track dashboard creation
 */
export function trackDashboardCreation(metadata?: Record<string, any>): void {
  trackLaunchEvent('dashboard_created', metadata)
}

/**
 * Track schedule creation
 */
export function trackScheduleCreation(metadata?: Record<string, any>): void {
  trackLaunchEvent('schedule_created', metadata)
}

/**
 * Track template installation
 */
export function trackTemplateInstallation(metadata?: Record<string, any>): void {
  trackLaunchEvent('template_installed', metadata)
}

/**
 * Track feedback submission
 */
export function trackFeedbackSubmission(
  type: string,
  metadata?: Record<string, any>
): void {
  trackLaunchEvent('feedback_submitted', {
    feedbackType: type,
    ...metadata,
  })
}

/**
 * Get launch metrics summary
 */
export function getLaunchMetricsSummary(): {
  totalEvents: number
  eventCounts: Record<string, number>
  uniqueUsers: number
  recentEvents: LaunchMetrics[]
} {
  if (typeof window === 'undefined') {
    return {
      totalEvents: 0,
      eventCounts: {},
      uniqueUsers: 0,
      recentEvents: [],
    }
  }

  const events: LaunchMetrics[] = JSON.parse(
    localStorage.getItem('launch_events') || '[]'
  )

  const eventCounts: Record<string, number> = {}
  const uniqueUsers = new Set<string>()

  events.forEach((event) => {
    eventCounts[event.event] = (eventCounts[event.event] || 0) + 1
    if (event.userId) {
      uniqueUsers.add(event.userId)
    }
  })

  return {
    totalEvents: events.length,
    eventCounts,
    uniqueUsers: uniqueUsers.size,
    recentEvents: events.slice(-10).reverse(),
  }
}

/**
 * Clear launch metrics (for testing)
 */
export function clearLaunchMetrics(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('launch_events')
  }
}


