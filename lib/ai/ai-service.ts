/**
 * AI Service - Unified interface for AI providers
 * Enterprise-grade abstraction layer supporting multiple providers
 */

import { AIProvider, ChatMessage, ChatCompletion, ChatCompletionOptions, AIProviderType } from './types'
import { AzureOpenAIProvider, createAzureOpenAIProvider } from './providers/azure-openai'
import { OpenAIProvider } from './providers/openai-provider'

let currentProvider: AIProvider | null = null
let currentProviderType: AIProviderType = 'azure-openai'

/**
 * Initialize AI provider based on environment configuration
 */
function initializeProvider(): AIProvider {
  const providerType = (process.env.AI_PROVIDER || 'azure-openai') as AIProviderType

  try {
    switch (providerType) {
      case 'azure-openai':
        currentProvider = createAzureOpenAIProvider()
        currentProviderType = 'azure-openai'
        console.log('[AI Service] Initialized Azure OpenAI provider')
        break

      case 'openai':
        // Fallback to OpenAI during migration period
        if (process.env.OPENAI_API_KEY) {
          currentProvider = new OpenAIProvider()
          currentProviderType = 'openai'
          console.log('[AI Service] Initialized OpenAI provider (legacy)')
        } else {
          throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY or migrate to Azure OpenAI.')
        }
        break

      default:
        throw new Error(`Unsupported AI provider: ${providerType}`)
    }

    return currentProvider
  } catch (error: any) {
    console.error('[AI Service] Provider initialization failed:', error.message)
    throw error
  }
}

/**
 * Get current AI provider instance
 */
function getProvider(): AIProvider {
  if (!currentProvider) {
    currentProvider = initializeProvider()
  }
  return currentProvider
}

/**
 * Set AI provider (for testing or dynamic switching)
 */
export function setAIProvider(provider: AIProvider, type: AIProviderType): void {
  currentProvider = provider
  currentProviderType = type
}

/**
 * Get current provider type
 */
export function getCurrentProviderType(): AIProviderType {
  return currentProviderType
}

/**
 * Generate chat completion
 */
export async function generateChatCompletion(
  messages: ChatMessage[],
  options?: ChatCompletionOptions
): Promise<ChatCompletion> {
  const provider = getProvider()
  return provider.generateChatCompletion(messages, options)
}

/**
 * Generate streaming chat completion
 */
export async function generateStreamingCompletion(
  messages: ChatMessage[],
  options?: ChatCompletionOptions
): Promise<AsyncIterable<ChatCompletion>> {
  const provider = getProvider()
  return provider.generateStreamingCompletion(messages, options)
}

/**
 * Generate text embeddings
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const provider = getProvider()
  return provider.generateEmbedding(text)
}

/**
 * Generate embeddings for multiple texts
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const provider = getProvider()
  return provider.generateEmbeddings(texts)
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
  try {
    const completion = await generateChatCompletion(
      [
        {
          role: 'system',
          content: `${instructions}\n\nReturn a JSON object matching this schema:\n${schema}`,
        },
        { role: 'user', content: text },
      ],
      {
        responseFormat: 'json_object',
        temperature: 0.3,
      }
    )

    const content = completion.choices[0]?.message.content
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
 * Configuration (for backward compatibility)
 */
export const AI_CONFIG = {
  model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || process.env.OPENAI_MODEL || 'gpt-4',
  embeddingModel: process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME || process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-ada-002',
  temperature: 0.7,
  maxTokens: 2000,
}

// Export types for backward compatibility
export type { ChatMessage, ChatCompletion, ChatCompletionOptions, ChatTool } from './types'
