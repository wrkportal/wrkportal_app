/**
 * AI Provider Types and Interfaces
 * Abstraction layer for multiple AI providers
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  name?: string
  tool_call_id?: string
}

export interface ChatCompletionOptions {
  temperature?: number
  maxTokens?: number
  tools?: ChatTool[]
  stream?: boolean
  responseFormat?: 'text' | 'json_object'
  model?: string // Optional: override provider default model (for tier-based selection)
}

export interface ChatTool {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, any>
  }
}

export interface ChatCompletion {
  id: string
  choices: Array<{
    index: number
    message: {
      role: 'assistant' | 'user' | 'system' | 'tool'
      content: string | null
      tool_calls?: Array<{
        id: string
        type: 'function'
        function: {
          name: string
          arguments: string
        }
      }>
    }
    finish_reason: string | null
  }>
  model: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface EmbeddingResponse {
  data: Array<{
    embedding: number[]
    index: number
  }>
  model: string
  usage?: {
    prompt_tokens: number
    total_tokens: number
  }
}

export interface AIProvider {
  /**
   * Generate chat completion
   */
  generateChatCompletion(
    messages: ChatMessage[],
    options?: ChatCompletionOptions
  ): Promise<ChatCompletion>

  /**
   * Generate streaming chat completion
   */
  generateStreamingCompletion(
    messages: ChatMessage[],
    options?: ChatCompletionOptions
  ): Promise<AsyncIterable<ChatCompletion>>

  /**
   * Generate embeddings
   */
  generateEmbedding(text: string): Promise<number[]>

  /**
   * Generate embeddings for multiple texts
   */
  generateEmbeddings(texts: string[]): Promise<number[][]>

  /**
   * Get provider name
   */
  getProviderName(): string
}

export type AIProviderType = 'azure-openai' | 'openai' | 'aws-bedrock' | 'anthropic'

export interface AIProviderConfig {
  provider: AIProviderType
  model?: string
  embeddingModel?: string
  temperature?: number
  maxTokens?: number
}
