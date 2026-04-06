/**
 * AI Service - Unified interface for AWS Bedrock AI
 *
 * Uses AWS Bedrock with Claude (Anthropic) for chat completions
 * and Amazon Titan for embeddings.
 */

import { AIProvider, ChatMessage, ChatCompletion, ChatCompletionOptions, AIProviderType } from './types'
import { BedrockProvider, createBedrockProvider } from './providers/bedrock-provider'

let currentProvider: AIProvider | null = null

/**
 * Get or initialize the Bedrock AI provider
 */
function getProvider(): AIProvider {
  if (!currentProvider) {
    currentProvider = createBedrockProvider()
  }
  return currentProvider
}

/**
 * Set AI provider (for testing)
 */
export function setAIProvider(provider: AIProvider, _type: AIProviderType): void {
  currentProvider = provider
}

/**
 * Get current provider type
 */
export function getCurrentProviderType(): AIProviderType {
  return 'aws-bedrock'
}

/**
 * Generate chat completion
 */
export async function generateChatCompletion(
  messages: ChatMessage[],
  options?: ChatCompletionOptions
): Promise<ChatCompletion> {
  return getProvider().generateChatCompletion(messages, options)
}

/**
 * Generate streaming chat completion
 */
export async function generateStreamingCompletion(
  messages: ChatMessage[],
  options?: ChatCompletionOptions
): Promise<AsyncIterable<ChatCompletion>> {
  return getProvider().generateStreamingCompletion(messages, options)
}

/**
 * Generate text embeddings
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  return getProvider().generateEmbedding(text)
}

/**
 * Generate embeddings for multiple texts
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  return getProvider().generateEmbeddings(texts)
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
  return completion.choices[0]?.message.content || ''
}

/**
 * Extract structured data from text using JSON mode
 */
export async function extractStructuredData<T>(
  text: string,
  schema: string,
  instructions: string
): Promise<T> {
  const completion = await generateChatCompletion(
    [
      {
        role: 'system',
        content: `${instructions}\n\nReturn a JSON object matching this schema:\n${schema}\n\nRespond ONLY with valid JSON, no other text.`,
      },
      { role: 'user', content: text },
    ],
    { temperature: 0.3 }
  )

  const content = completion.choices[0]?.message.content
  if (!content) throw new Error('No content in AI response')

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content]
  const jsonStr = (jsonMatch[1] || content).trim()

  return JSON.parse(jsonStr) as T
}

/**
 * Generate function calling completion
 */
export async function generateFunctionCall(
  messages: ChatMessage[],
  tools: ChatCompletionOptions['tools'],
  options?: ChatCompletionOptions
): Promise<ChatCompletion> {
  return generateChatCompletion(messages, {
    ...options,
    tools,
    temperature: options?.temperature ?? 0.3,
  })
}

/**
 * AI Configuration
 */
export const AI_CONFIG = {
  model: process.env.AWS_BEDROCK_MODEL_ID || 'anthropic.claude-3-5-sonnet-20241022-v2:0',
  embeddingModel: process.env.AWS_BEDROCK_EMBEDDING_MODEL_ID || 'amazon.titan-embed-text-v2:0',
  temperature: 0.7,
  maxTokens: 2000,
}

export type { ChatMessage, ChatCompletion, ChatCompletionOptions, ChatTool } from './types'
