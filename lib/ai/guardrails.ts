/**
 * AI Guardrails
 *
 * Server-side enforcement to ensure AI is only used for work-related queries.
 * This runs BEFORE the query reaches the LLM — it's not bypassable via prompt injection.
 */

// Topics that are clearly off-limits
const BLOCKED_PATTERNS = [
  // General knowledge / search engine queries
  /\b(who is|who was|what is the capital|how far is|when was .+ born|history of)\b/i,
  // Creative writing
  /\b(write me a|compose a|create a story|write a poem|write a song|write an essay|write fiction)\b/i,
  // Code generation (not related to platform)
  /\b(write code|write a script|python code|javascript code|html code|css code|sql query|regex for)\b/i,
  // Homework / academic
  /\b(solve this equation|math problem|homework|assignment|exam|test question|quiz)\b/i,
  // Entertainment / personal
  /\b(tell me a joke|fun fact|recipe for|how to cook|movie recommendation|book recommendation|travel to|vacation)\b/i,
  // Harmful content
  /\b(how to hack|bypass security|exploit|vulnerability|password crack|illegal|weapon)\b/i,
]

// Topics that are clearly work-related (whitelist - always allowed)
const ALLOWED_PATTERNS = [
  /\b(project|task|sprint|backlog|okr|goal|objective|key result)\b/i,
  /\b(lead|opportunity|deal|pipeline|quote|invoice|sales|revenue|forecast)\b/i,
  /\b(budget|expense|cost|finance|profit|margin|billing|rate card)\b/i,
  /\b(ticket|incident|asset|maintenance|sla|compliance|audit)\b/i,
  /\b(candidate|interview|offer|hire|recruit|job posting|onboarding)\b/i,
  /\b(team|member|resource|capacity|allocation|workload|timesheet)\b/i,
  /\b(report|dashboard|metric|kpi|analytics|chart|summary|status)\b/i,
  /\b(automation|workflow|approval|notification|reminder|schedule)\b/i,
  /\b(risk|issue|dependency|blocker|overdue|deadline|milestone)\b/i,
  /\b(meeting|notes|action item|agenda|standup|retrospective)\b/i,
  /\b(customer|account|contact|case|support|service request)\b/i,
  /\b(deployment|release|pr|pull request|repository|branch)\b/i,
  /\b(how do i|how to use|help me with|where can i find|show me)\b/i,
]

export interface GuardrailResult {
  allowed: boolean
  reason?: string
  suggestion?: string
}

/**
 * Check if a user query is work-related and allowed.
 * Returns { allowed: true } for work queries, { allowed: false, reason, suggestion } for off-topic queries.
 */
export function checkQueryGuardrails(query: string): GuardrailResult {
  const trimmed = query.trim()

  // Very short queries are ambiguous — allow them (likely follow-ups in a conversation)
  if (trimmed.length < 10) {
    return { allowed: true }
  }

  // Check if it matches a blocked pattern
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        allowed: false,
        reason: 'off_topic',
        suggestion: "I'm your wrkportal work assistant. I can help with projects, tasks, sales, budgets, reports, and team management. How can I help with your work today?",
      }
    }
  }

  // Check if it matches a work-related pattern — always allow
  for (const pattern of ALLOWED_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { allowed: true }
    }
  }

  // For ambiguous queries (not clearly blocked, not clearly work-related),
  // allow them but the system prompt will guide the AI to stay on-topic
  return { allowed: true }
}

/**
 * Track AI usage per user for cost monitoring and abuse detection.
 */
export interface AIUsageRecord {
  userId: string
  tenantId: string
  tool: string
  tokensUsed: number
  blocked: boolean
  timestamp: Date
}

/**
 * Check if a user has exceeded their AI quota for the current billing period.
 * Returns remaining queries count.
 */
export function checkAIQuota(
  userTier: string,
  queriesThisPeriod: number
): { allowed: boolean; remaining: number; limit: number } {
  const limits: Record<string, number> = {
    free: 50,          // 50 AI queries/month
    starter: 200,      // 200 AI queries/month
    professional: 1000, // 1000 AI queries/month
    enterprise: 10000,  // 10000 AI queries/month (practically unlimited)
  }

  const limit = limits[userTier] || limits.free
  const remaining = Math.max(0, limit - queriesThisPeriod)

  return {
    allowed: queriesThisPeriod < limit,
    remaining,
    limit,
  }
}

/**
 * Sanitize AI response to remove any accidental data leaks.
 * Strips patterns that look like: API keys, connection strings, passwords, etc.
 */
export function sanitizeAIResponse(response: string): string {
  let sanitized = response

  // Remove anything that looks like a connection string
  sanitized = sanitized.replace(/postgresql:\/\/[^\s"']+/gi, '[DATABASE_URL_REDACTED]')
  sanitized = sanitized.replace(/mongodb(\+srv)?:\/\/[^\s"']+/gi, '[DATABASE_URL_REDACTED]')
  sanitized = sanitized.replace(/redis:\/\/[^\s"']+/gi, '[REDIS_URL_REDACTED]')

  // Remove anything that looks like an API key or secret
  sanitized = sanitized.replace(/\b(sk|pk|api|key|secret|token|password|auth)[_-]?[a-zA-Z0-9]{20,}/gi, '[SECRET_REDACTED]')

  // Remove AWS access keys
  sanitized = sanitized.replace(/AKIA[0-9A-Z]{16}/g, '[AWS_KEY_REDACTED]')

  return sanitized
}
