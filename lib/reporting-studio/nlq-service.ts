// Natural Language Query (NLQ) Service for Reporting Studio
// Converts natural language questions to SQL queries

import { generateChatCompletion } from '@/lib/ai/openai-service'

export interface NLQRequest {
  question: string
  dataSourceId?: string
  schema?: {
    tables: Array<{
      name: string
      columns: Array<{
        name: string
        type: string
        description?: string
      }>
    }>
  }
  dialect?: 'postgresql' | 'mysql' | 'sqlserver'
  tenantId?: string // Optional but recommended for automatic tenant filtering
}

// Extended interface that requires tenantId
export interface NLQRequestWithTenant extends NLQRequest {
  tenantId: string // Required for tenant filtering
}

export interface NLQResponse {
  sql: string
  confidence: number
  explanation: string
  suggestedVisualization?: 'bar' | 'line' | 'pie' | 'table' | 'scatter'
  confidenceDetails?: any // Detailed confidence breakdown
  error?: string
}

const NLQ_PROMPT = `You are a SQL query generation assistant specialized in converting data-related questions into SQL queries. You ONLY work with questions about the application's database.

CRITICAL SECURITY RULE - TENANT ISOLATION:
- ALL queries MUST include "tenantId = '<TENANT_ID>'" in the WHERE clause
- This is a multi-tenant application - users can ONLY access their own tenant's data
- NEVER generate queries without tenantId filtering - this would expose other clients' data
- For queries with JOINs, ALL tenant-scoped tables MUST have tenantId filters
- Example: "SELECT * FROM Project WHERE tenantId = '<TENANT_ID>' AND status = 'ACTIVE'"
- When joining tables, ensure all tables have tenant filters: "... FROM Project p JOIN Task t ON p.id = t.projectId WHERE p.tenantId = '<TENANT_ID>' AND t.tenantId = '<TENANT_ID>'"

CRITICAL RULES:
1. ONLY answer questions about data in the application's database (sales, projects, tasks, users, customers, deals, leads, opportunities, accounts, contacts, orders, quotes, activities, etc.)
2. If the question is NOT about application data, return "ERROR: This question is not about application data. Please ask questions about your data such as sales, projects, customers, tasks, users, deals, leads, opportunities, etc."
3. Generate only valid SQL queries for data questions
4. Use appropriate table and column names from the schema provided
5. IMPORTANT: Table names use PascalCase and MUST be quoted in PostgreSQL (e.g., "SalesLead", "SalesOpportunity", "SalesContact", "SalesAccount", "Project", "Task", "User"). Always use double quotes around table names.
6. Common table name mappings (use quoted PascalCase):
   - "leads" or "lead" → "SalesLead"
   - "opportunities" or "opportunity" → "SalesOpportunity"
   - "contacts" or "contact" → "SalesContact"
   - "accounts" or "account" → "SalesAccount"
   - "projects" or "project" → "Project"
   - "tasks" or "task" → "Task"
   - "users" or "user" → "User"
7. Example: SELECT COUNT(*) FROM "SalesLead" WHERE "tenantId" = '<TENANT_ID>' AND "status" = 'CONVERTED'
7. Include proper JOINs when multiple tables are referenced
8. Use aggregate functions (COUNT, SUM, AVG, MAX, MIN) when appropriate
9. Add WHERE clauses for filtering
10. Include ORDER BY for sorting when relevant
11. Limit results to reasonable amounts (use LIMIT clause)
12. Do NOT include destructive operations (DROP, DELETE, UPDATE, TRUNCATE)
13. Do NOT include sensitive operations that could modify data
14. Do NOT answer general knowledge questions - ONLY data questions
15. Return only the SQL query, no explanations in the query itself

VALID QUESTION EXAMPLES:
- "Show me top 10 customers by revenue"
- "What are the sales by region this quarter?"
- "List all projects with status 'IN_PROGRESS'"
- "Count tasks assigned to each user"
- "Show me deals closed in the last 30 days"
- "What's the pipeline value by stage?"
- "How many leads were converted into opportunities in 2025"
- "How many opportunities were won this month?"
- "Count the number of contacts created last quarter"

INVALID QUESTIONS (DO NOT ANSWER):
- "What is artificial intelligence?"
- "How do I cook pasta?"
- "Tell me about history"
- "What's the weather today?"
- General knowledge or advice questions

Schema Context:
{{SCHEMA_CONTEXT}}

Dialect: {{DIALECT}}

Natural Language Question: {{QUESTION}}

If this question is about application data, generate a SQL query. If not, return "ERROR: This question is not about application data."
Return ONLY the SQL query or ERROR message, nothing else.`

export async function generateSQLFromNLQ(request: NLQRequest | NLQRequestWithTenant): Promise<NLQResponse> {
  try {
    // Build schema context
    let schemaContext = 'No schema provided'
    if (request.schema && request.schema.tables.length > 0) {
      schemaContext = request.schema.tables
        .map(
          (table) =>
            `Table: ${table.name}\nColumns: ${table.columns.map((col) => `${col.name} (${col.type})${col.description ? ` - ${col.description}` : ''}`).join(', ')}`
        )
        .join('\n\n')
    }

    // Add tenant filtering instruction to prompt
    const tenantInstruction = request.tenantId 
      ? `\n\nTENANT ID: ${request.tenantId}\nYou MUST include "WHERE tenantId = '${request.tenantId}'" in ALL queries. This is MANDATORY for data security.`
      : '\n\nIMPORTANT: All queries MUST include a tenantId filter in the WHERE clause. Use placeholder "<TENANT_ID>" which will be replaced by the system.'

    // Build prompt
    const prompt = (NLQ_PROMPT + tenantInstruction)
      .replace('{{SCHEMA_CONTEXT}}', schemaContext)
      .replace('{{DIALECT}}', request.dialect || 'postgresql')
      .replace('{{QUESTION}}', request.question)
      .replace(/\<TENANT_ID\>/g, request.tenantId || '<TENANT_ID>')

    // Generate SQL using OpenAI
    const response = await generateChatCompletion(
      [
        {
          role: 'system',
          content:
            'You are a SQL query generation expert for application data queries ONLY. Always return only valid SQL queries without any explanations or markdown formatting. Just the raw SQL. Questions about counting, aggregating, or analyzing data (like "how many", "count", "show me", "list") are valid data questions. Only return "ERROR: This question is not about application data." for questions that are clearly about general knowledge, not database queries.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      {
        temperature: 0.1, // Lower temperature for more deterministic SQL generation
        maxTokens: 500,
      }
    )

    let sql = response.choices[0]?.message?.content?.trim() || ''

    // Check if AI returned an error message (question not about data)
    if (sql.toUpperCase().startsWith('ERROR:') || sql.toUpperCase().includes('NOT ABOUT APPLICATION DATA')) {
      return {
        sql: '',
        confidence: 0,
        explanation: sql,
        error: 'NOT_DATA_QUESTION',
      }
    }

    // Remove markdown code blocks if present
    sql = sql.replace(/```sql\n?/g, '').replace(/```\n?/g, '').trim()

    // Fix common table name issues - replace lowercase table names with correct PascalCase
    // Only replace in FROM/JOIN clauses to avoid replacing column names
    const tableNameMappings: Array<{ pattern: RegExp; replacement: string }> = [
      { pattern: /\bFROM\s+leads\b/gi, replacement: 'FROM "SalesLead"' },
      { pattern: /\bFROM\s+lead\b/gi, replacement: 'FROM "SalesLead"' },
      { pattern: /\bJOIN\s+leads\b/gi, replacement: 'JOIN "SalesLead"' },
      { pattern: /\bJOIN\s+lead\b/gi, replacement: 'JOIN "SalesLead"' },
      { pattern: /\bFROM\s+opportunities\b/gi, replacement: 'FROM "SalesOpportunity"' },
      { pattern: /\bFROM\s+opportunity\b/gi, replacement: 'FROM "SalesOpportunity"' },
      { pattern: /\bJOIN\s+opportunities\b/gi, replacement: 'JOIN "SalesOpportunity"' },
      { pattern: /\bJOIN\s+opportunity\b/gi, replacement: 'JOIN "SalesOpportunity"' },
      { pattern: /\bFROM\s+contacts\b/gi, replacement: 'FROM "SalesContact"' },
      { pattern: /\bFROM\s+contact\b/gi, replacement: 'FROM "SalesContact"' },
      { pattern: /\bJOIN\s+contacts\b/gi, replacement: 'JOIN "SalesContact"' },
      { pattern: /\bJOIN\s+contact\b/gi, replacement: 'JOIN "SalesContact"' },
      { pattern: /\bFROM\s+accounts\b/gi, replacement: 'FROM "SalesAccount"' },
      { pattern: /\bFROM\s+account\b/gi, replacement: 'FROM "SalesAccount"' },
      { pattern: /\bJOIN\s+accounts\b/gi, replacement: 'JOIN "SalesAccount"' },
      { pattern: /\bJOIN\s+account\b/gi, replacement: 'JOIN "SalesAccount"' },
    ]

    // Apply table name mappings
    for (const { pattern, replacement } of tableNameMappings) {
      sql = sql.replace(pattern, replacement)
    }

    // Basic validation - check for dangerous operations
    const dangerousKeywords = ['DROP', 'DELETE', 'UPDATE', 'TRUNCATE', 'ALTER', 'CREATE', 'INSERT']
    const upperSQL = sql.toUpperCase()
    for (const keyword of dangerousKeywords) {
      if (upperSQL.includes(keyword)) {
        return {
          sql: '',
          confidence: 0,
          explanation: `Query contains dangerous operation: ${keyword}. Only SELECT queries are allowed.`,
          error: 'DANGEROUS_OPERATION',
        }
      }
    }

    // CRITICAL: Inject tenant filter if tenantId is provided (security enforcement)
    if (request.tenantId) {
      const { secureQueryForTenant } = await import('./tenant-filter-injector')
      try {
        sql = secureQueryForTenant(sql, request.tenantId)
      } catch (error: any) {
        console.error('Error securing query with tenant filter:', error)
        return {
          sql: '',
          confidence: 0,
          explanation: `Failed to secure query: ${error.message}. This query cannot be executed for security reasons.`,
          error: 'TENANT_FILTER_ERROR',
        }
      }
    }

    // Determine suggested visualization based on query type
    let suggestedVisualization: NLQResponse['suggestedVisualization'] = 'table'
    if (upperSQL.includes('COUNT') || upperSQL.includes('SUM') || upperSQL.includes('AVG')) {
      if (upperSQL.includes('GROUP BY')) {
        suggestedVisualization = 'bar'
      } else {
        suggestedVisualization = 'table'
      }
    } else if (upperSQL.includes('ORDER BY')) {
      suggestedVisualization = 'line'
    }

    // Calculate confidence using enhanced scoring
    const { calculateConfidenceScore } = await import('./nlq-enhancement')
    const confidenceScore = calculateConfidenceScore(sql, request.schema)
    const confidence = confidenceScore.overall

    return {
      sql,
      confidence,
      explanation: `Generated SQL query for: "${request.question}"`,
      suggestedVisualization,
      confidenceDetails: confidenceScore, // Include detailed confidence breakdown
    }
  } catch (error: any) {
    console.error('Error generating SQL from NLQ:', error)
    return {
      sql: '',
      confidence: 0,
      explanation: `Failed to generate SQL: ${error.message}`,
      error: error.message,
    }
  }
}

/**
 * Validate if a natural language question is suitable for NLQ
 * Ensures questions are data-related, not general ChatGPT-style questions
 */
export function isQuestionSuitableForNLQ(question: string): { valid: boolean; reason?: string; suggestion?: string } {
  // Check if question is not too short or too long
  if (question.trim().length < 10 || question.trim().length > 500) {
    return {
      valid: false,
      reason: 'Question must be between 10 and 500 characters',
      suggestion: 'Please ask a more specific question about your data',
    }
  }

  // Check for obvious non-query requests (general knowledge questions)
  const invalidPatterns = [
    /^how do i/i,
    /^tell me how/i,
    /^explain/i,
    /^what is$/i, // Too vague (but allow "what is the revenue")
    /^who is/i,
    /^why/i,
    /^when did/i, // Unless followed by data context
    /^define/i,
    /^what does/i, // Unless asking about data
    /^can you help/i,
    /^help me/i,
    /^i need help/i,
    /^give me advice/i,
    /^tell me about/i, // Too vague
    /^write/i,
    /^create/i, // Unless creating a report/view
    /^summarize$/i, // Too vague
    /^translate/i,
    /^what's the weather/i,
    /^what time/i,
    /^what date/i, // Unless asking for data from date
  ]

  for (const pattern of invalidPatterns) {
    if (pattern.test(question)) {
      return {
        valid: false,
        reason: 'This question format is not supported',
        suggestion: 'Please ask questions about your application data. Examples: "Show me sales by region" or "List all projects with status IN_PROGRESS"',
      }
    }
  }

  // Require data-related keywords to ensure it's about app data
  const dataKeywords = [
    /\b(show|display|list|find|get|select|count|sum|total|average|avg|max|min|top|bottom|best|worst|how many|how much)\b/i,
    /\b(data|record|table|database|report|metric|stat|statistic|sales|revenue|customer|project|task|user|team|budget|deal|lead|opportunity|order|quote|account|contact|activity|converted|conversion)\b/i,
    /\b(by|group by|where|filter|sort|order|from|in|during|between|after|before)\b/i,
    /\b(year|month|quarter|week|day|date|time|period|range|\d{4})\b/i, // Include 4-digit years like 2025
    /\b(chart|graph|visualization|view|dashboard)\b/i,
  ]

  // Check if at least one data keyword is present
  const hasDataKeyword = dataKeywords.some(pattern => pattern.test(question))

  if (!hasDataKeyword) {
    return {
      valid: false,
      reason: 'This question does not appear to be about your application data',
      suggestion: 'Please ask questions about your data such as sales, projects, customers, tasks, users, deals, leads, opportunities, accounts, contacts, orders, quotes, or activities. Examples: "Show me top customers by revenue" or "What are the sales by region?"',
    }
  }

  // Block general ChatGPT-style questions
  const generalQuestionPatterns = [
    /\b(general|knowledge|information|about)\s+(the\s+)?(world|internet|history|science|technology|business|market|news)\b/i,
    /\b(what|how|why)\s+(is|are|do|does|can|will|would)\s+(a|an|the)\s+\w+\s+(that|which|who)\b/i, // General "what is X" questions
  ]

  for (const pattern of generalQuestionPatterns) {
    if (pattern.test(question)) {
      return {
        valid: false,
        reason: 'This appears to be a general knowledge question, not a data query',
        suggestion: 'Please ask questions about your application data. This tool is designed to query your database, not answer general questions.',
      }
    }
  }

  return { valid: true }
}

