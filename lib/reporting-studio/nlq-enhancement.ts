// NLQ Enhancement Service
// Advanced features: Query refinement, confidence scoring, query suggestions, learning

import { NLQRequest, NLQResponse } from './nlq-service'
import { generateChatCompletion } from '@/lib/ai/openai-service'

export interface QueryRefinementRequest {
  originalQuestion: string
  originalSQL: string
  userFeedback?: 'correct' | 'incorrect' | 'needs_improvement'
  correctedSQL?: string
  errorMessage?: string
}

export interface QuerySuggestion {
  question: string
  sql: string
  confidence: number
  description: string
}

export interface ConfidenceScore {
  overall: number // 0-1
  schemaMatch: number // 0-1
  syntaxValid: boolean
  semanticValid: boolean
  complexityScore: number // 0-1
  factors: {
    hasJoins: boolean
    hasAggregations: boolean
    hasFilters: boolean
    hasOrderBy: boolean
    tableCount: number
    columnCount: number
  }
}

/**
 * Refine a SQL query based on user feedback or error
 */
export async function refineQuery(
  request: QueryRefinementRequest
): Promise<NLQResponse> {
  try {
    let refinementPrompt = `You are a SQL query refinement assistant. Refine the following SQL query based on the context provided.

Original Question: "${request.originalQuestion}"
Original SQL: ${request.originalSQL}
`

    if (request.userFeedback === 'incorrect' && request.errorMessage) {
      refinementPrompt += `\nError: ${request.errorMessage}\nPlease fix the SQL query to resolve this error.`
    } else if (request.userFeedback === 'needs_improvement' && request.correctedSQL) {
      refinementPrompt += `\nUser provided corrected SQL: ${request.correctedSQL}\nPlease learn from this correction and improve the query generation approach.`
    } else if (request.userFeedback === 'correct') {
      refinementPrompt += `\nThe query was correct. Use this as a positive example for future queries.`
    }

    refinementPrompt += `\n\nGenerate an improved SQL query. Return ONLY the SQL query, no explanations.`

    const response = await generateChatCompletion(
      [
        {
          role: 'system',
          content:
            'You are a SQL query refinement expert. Always return only valid SQL queries without any explanations or markdown formatting.',
        },
        {
          role: 'user',
          content: refinementPrompt,
        },
      ],
      {
        temperature: 0.1,
        maxTokens: 500,
      }
    )

    let refinedSQL = response.choices[0]?.message?.content?.trim() || ''
    refinedSQL = refinedSQL.replace(/```sql\n?/g, '').replace(/```\n?/g, '').trim()

    // Calculate confidence for refined query
    const confidence = calculateConfidenceScore(refinedSQL, null)

    return {
      sql: refinedSQL,
      confidence: confidence.overall,
      explanation: 'Query refined based on feedback',
    }
  } catch (error: any) {
    console.error('Error refining query:', error)
    return {
      sql: request.originalSQL,
      confidence: 0.5,
      explanation: `Failed to refine query: ${error.message}`,
      error: error.message,
    }
  }
}

/**
 * Calculate confidence score for a SQL query
 */
export function calculateConfidenceScore(
  sql: string,
  schema: NLQRequest['schema']
): ConfidenceScore {
  const upperSQL = sql.toUpperCase()
  
  // Check syntax validity (basic checks)
  const syntaxValid = 
    upperSQL.includes('SELECT') &&
    !upperSQL.includes('DROP') &&
    !upperSQL.includes('DELETE') &&
    !upperSQL.includes('UPDATE') &&
    !upperSQL.includes('TRUNCATE')

  // Check semantic validity (basic checks)
  const semanticValid = 
    upperSQL.includes('FROM') &&
    syntaxValid

  // Analyze query complexity
  const hasJoins = upperSQL.includes('JOIN') || upperSQL.includes('INNER JOIN') || upperSQL.includes('LEFT JOIN')
  const hasAggregations = 
    upperSQL.includes('COUNT') ||
    upperSQL.includes('SUM') ||
    upperSQL.includes('AVG') ||
    upperSQL.includes('MAX') ||
    upperSQL.includes('MIN') ||
    upperSQL.includes('GROUP BY')
  const hasFilters = upperSQL.includes('WHERE')
  const hasOrderBy = upperSQL.includes('ORDER BY')

  // Count tables and columns (rough estimate)
  const fromMatches = upperSQL.match(/FROM\s+(\w+)/gi) || []
  const tableCount = fromMatches.length
  const selectMatches = upperSQL.match(/SELECT\s+([^FROM]+)/i)
  const columnCount = selectMatches
    ? selectMatches[1].split(',').length
    : 1

  // Schema match score
  let schemaMatch = 0.5 // Default if no schema
  if (schema && schema.tables.length > 0) {
    // Check if tables in query exist in schema
    const schemaTableNames = schema.tables.map(t => t.name.toUpperCase())
    const queryTableNames = fromMatches.map(m => m.replace(/FROM\s+/i, '').trim().toUpperCase())
    const matchingTables = queryTableNames.filter(t => schemaTableNames.includes(t))
    schemaMatch = matchingTables.length / Math.max(queryTableNames.length, 1)
  }

  // Calculate overall confidence
  let overall = 0.5 // Base confidence

  if (syntaxValid) overall += 0.2
  if (semanticValid) overall += 0.1
  if (schemaMatch > 0.7) overall += 0.1
  if (hasFilters) overall += 0.05 // More specific queries are better
  if (hasOrderBy) overall += 0.05 // Sorted results are often more useful

  // Penalize overly complex queries without schema
  if (!schema && (hasJoins || tableCount > 2)) {
    overall -= 0.1
  }

  overall = Math.min(1, Math.max(0, overall))

  return {
    overall,
    schemaMatch,
    syntaxValid,
    semanticValid,
    complexityScore: (hasJoins ? 0.3 : 0) + (hasAggregations ? 0.3 : 0) + (tableCount > 1 ? 0.2 : 0) + (columnCount > 5 ? 0.2 : 0),
    factors: {
      hasJoins,
      hasAggregations,
      hasFilters,
      hasOrderBy,
      tableCount,
      columnCount,
    },
  }
}

/**
 * Generate query suggestions based on schema
 */
export async function generateQuerySuggestions(
  schema: NLQRequest['schema'],
  limit: number = 5
): Promise<QuerySuggestion[]> {
  if (!schema || schema.tables.length === 0) {
    return []
  }

  const suggestions: QuerySuggestion[] = []

  // Generate common query patterns
  for (const table of schema.tables.slice(0, 3)) {
    // Count all records
    suggestions.push({
      question: `How many records are in ${table.name}?`,
      sql: `SELECT COUNT(*) as count FROM ${table.name}`,
      confidence: 0.95,
      description: `Count all records in ${table.name}`,
    })

    // List all records (limited)
    suggestions.push({
      question: `Show me all records from ${table.name}`,
      sql: `SELECT * FROM ${table.name} LIMIT 100`,
      confidence: 0.9,
      description: `View all records from ${table.name}`,
    })

    // If table has numeric columns, suggest aggregations
    const numericColumns = table.columns.filter(
      col => col.type && /int|decimal|float|numeric|double|real/i.test(col.type)
    )

    if (numericColumns.length > 0) {
      const col = numericColumns[0]
      suggestions.push({
        question: `What is the total of ${col.name} in ${table.name}?`,
        sql: `SELECT SUM(${col.name}) as total FROM ${table.name}`,
        confidence: 0.85,
        description: `Sum of ${col.name} column`,
      })

      suggestions.push({
        question: `What is the average ${col.name} in ${table.name}?`,
        sql: `SELECT AVG(${col.name}) as average FROM ${table.name}`,
        confidence: 0.85,
        description: `Average of ${col.name} column`,
      })
    }

    // If table has date columns, suggest time-based queries
    const dateColumns = table.columns.filter(
      col => col.type && /date|time|timestamp/i.test(col.type)
    )

    if (dateColumns.length > 0) {
      const col = dateColumns[0]
      suggestions.push({
        question: `Show me records from ${table.name} created in the last 30 days`,
        sql: `SELECT * FROM ${table.name} WHERE ${col.name} >= CURRENT_DATE - INTERVAL '30 days' ORDER BY ${col.name} DESC`,
        confidence: 0.8,
        description: `Recent records from ${table.name}`,
      })
    }
  }

  return suggestions.slice(0, limit)
}

/**
 * Learn from user corrections to improve future queries
 */
export interface LearningExample {
  question: string
  generatedSQL: string
  correctedSQL: string
  feedback: string
}

export async function learnFromCorrection(example: LearningExample): Promise<void> {
  // In a production system, this would:
  // 1. Store the example in a database
  // 2. Use it for fine-tuning the model
  // 3. Update the prompt with similar examples
  // For now, we'll just log it for future implementation
  
  console.log('Learning from correction:', {
    question: example.question,
    generatedSQL: example.generatedSQL,
    correctedSQL: example.correctedSQL,
    feedback: example.feedback,
  })

  // TODO: Store in database for fine-tuning
  // TODO: Update prompt templates with similar examples
  // TODO: Fine-tune model periodically with collected examples
}

