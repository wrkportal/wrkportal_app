/**
 * OpenAI Service - Core AI functionality wrapper
 * Handles all interactions with OpenAI API
 */

import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

export const AI_CONFIG = {
  model: process.env.OPENAI_MODEL || 'gpt-4o',
  embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
  temperature: 0.7,
  maxTokens: 2000,
}

/**
 * Generate chat completion
 */
export async function generateChatCompletion(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  options?: {
    temperature?: number
    maxTokens?: number
    tools?: OpenAI.Chat.ChatCompletionTool[]
    stream?: boolean
  }
): Promise<OpenAI.Chat.ChatCompletion> {
  try {
    const completion = await openai.chat.completions.create({
      model: AI_CONFIG.model,
      messages,
      temperature: options?.temperature ?? AI_CONFIG.temperature,
      max_tokens: options?.maxTokens ?? AI_CONFIG.maxTokens,
      tools: options?.tools,
    })

    return completion
  } catch (error) {
    console.error('OpenAI API Error:', error)
    throw new Error('Failed to generate AI response')
  }
}

/**
 * Generate streaming chat completion
 */
export async function generateStreamingCompletion(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  options?: {
    temperature?: number
    maxTokens?: number
    tools?: OpenAI.Chat.ChatCompletionTool[]
  }
) {
  try {
    const stream = await openai.chat.completions.create({
      model: AI_CONFIG.model,
      messages,
      temperature: options?.temperature ?? AI_CONFIG.temperature,
      max_tokens: options?.maxTokens ?? AI_CONFIG.maxTokens,
      tools: options?.tools,
      stream: true,
    })

    return stream
  } catch (error) {
    console.error('OpenAI Streaming Error:', error)
    throw new Error('Failed to generate streaming response')
  }
}

/**
 * Generate text embeddings for semantic search
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: AI_CONFIG.embeddingModel,
      input: text,
    })

    return response.data[0].embedding
  } catch (error) {
    console.error('Embedding generation error:', error)
    throw new Error('Failed to generate embedding')
  }
}

/**
 * Generate embeddings for multiple texts
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    const response = await openai.embeddings.create({
      model: AI_CONFIG.embeddingModel,
      input: texts,
    })

    return response.data.map(item => item.embedding)
  } catch (error) {
    console.error('Batch embedding error:', error)
    throw new Error('Failed to generate embeddings')
  }
}

/**
 * Analyze text with specific prompt
 */
export async function analyzeText(
  text: string,
  analysisPrompt: string,
  options?: { temperature?: number }
): Promise<string> {
  const completion = await generateChatCompletion(
    [
      { role: 'system', content: analysisPrompt },
      { role: 'user', content: text },
    ],
    { temperature: options?.temperature ?? 0.3 }
  )

  return completion.choices[0]?.message?.content || ''
}

/**
 * Extract structured data from text using JSON mode
 */
export async function extractStructuredData<T>(
  text: string,
  schema: string,
  instructions: string
): Promise<T> {
  try {
    const completion = await openai.chat.completions.create({
      model: AI_CONFIG.model,
      messages: [
        {
          role: 'system',
          content: `${instructions}\n\nReturn a JSON object matching this schema:\n${schema}`,
        },
        { role: 'user', content: text },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) throw new Error('No content in response')

    return JSON.parse(content) as T
  } catch (error) {
    console.error('Structured data extraction error:', error)
    throw new Error('Failed to extract structured data')
  }
}

/**
 * Generate function calling completion
 */
export async function generateFunctionCall(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  functions: OpenAI.Chat.ChatCompletionTool[]
) {
  const completion = await generateChatCompletion(messages, {
    tools: functions,
    temperature: 0.3,
  })

  return completion
}

export { openai }

