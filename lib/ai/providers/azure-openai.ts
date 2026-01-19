/**
 * Azure OpenAI Service Provider
 * Enterprise-grade AI provider with compliance and data residency
 */

import { AIProvider, ChatMessage, ChatCompletion, ChatCompletionOptions, EmbeddingResponse } from '../types'

interface AzureOpenAIConfig {
  endpoint: string
  apiKey: string
  apiVersion: string
  deploymentName: string
  embeddingDeploymentName: string
}

export class AzureOpenAIProvider implements AIProvider {
  private config: AzureOpenAIConfig
  private baseUrl: string

  constructor(config: AzureOpenAIConfig) {
    this.config = config
    // Azure OpenAI endpoint format: https://{resource-name}.openai.azure.com
    this.baseUrl = `${config.endpoint}/openai/deployments`
  }

  getProviderName(): string {
    return 'azure-openai'
  }

  async generateChatCompletion(
    messages: ChatMessage[],
    options?: ChatCompletionOptions
  ): Promise<ChatCompletion> {
    try {
      const url = `${this.baseUrl}/${this.config.deploymentName}/chat/completions?api-version=${this.config.apiVersion}`

      const requestBody: any = {
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          name: msg.name,
          tool_call_id: msg.tool_call_id,
        })),
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2000,
      }

      // Azure OpenAI uses 'tools' instead of 'functions' (OpenAI format)
      if (options?.tools && options.tools.length > 0) {
        requestBody.tools = options.tools.map(tool => ({
          type: 'function',
          function: tool.function,
        }))
      }

      // Azure OpenAI supports response_format for JSON mode
      if (options?.responseFormat === 'json_object') {
        requestBody.response_format = { type: 'json_object' }
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.config.apiKey,
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Azure OpenAI API error: ${response.status} ${error}`)
      }

      const data = await response.json()

      return {
        id: data.id,
        choices: data.choices.map((choice: any) => ({
          index: choice.index,
          message: {
            role: choice.message.role,
            content: choice.message.content,
            tool_calls: choice.message.tool_calls,
          },
          finish_reason: choice.finish_reason,
        })),
        model: data.model || this.config.deploymentName,
        usage: data.usage,
      }
    } catch (error: any) {
      console.error('Azure OpenAI API Error:', error)
      throw new Error(`Azure OpenAI request failed: ${error.message}`)
    }
  }

  async generateStreamingCompletion(
    messages: ChatMessage[],
    options?: ChatCompletionOptions
  ): Promise<AsyncIterable<ChatCompletion>> {
    try {
      const url = `${this.baseUrl}/${this.config.deploymentName}/chat/completions?api-version=${this.config.apiVersion}`

      const requestBody: any = {
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          name: msg.name,
          tool_call_id: msg.tool_call_id,
        })),
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2000,
        stream: true,
      }

      if (options?.tools && options.tools.length > 0) {
        requestBody.tools = options.tools.map(tool => ({
          type: 'function',
          function: tool.function,
        }))
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.config.apiKey,
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Azure OpenAI API error: ${response.status} ${error}`)
      }

      if (!response.body) {
        throw new Error('Response body is null')
      }

      // Create async iterator for streaming
      return this.createStreamIterator(response.body)
    } catch (error: any) {
      console.error('Azure OpenAI Streaming Error:', error)
      throw new Error(`Azure OpenAI streaming failed: ${error.message}`)
    }
  }

  private async* createStreamIterator(body: ReadableStream<Uint8Array>): AsyncIterable<ChatCompletion> {
    const reader = body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') return

            try {
              const parsed = JSON.parse(data)
              yield {
                id: parsed.id || '',
                choices: parsed.choices || [],
                model: parsed.model || this.config.deploymentName,
                usage: parsed.usage,
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const url = `${this.baseUrl}/${this.config.embeddingDeploymentName}/embeddings?api-version=${this.config.apiVersion}`

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.config.apiKey,
        },
        body: JSON.stringify({
          input: text,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Azure OpenAI Embedding API error: ${response.status} ${error}`)
      }

      const data: EmbeddingResponse = await response.json()
      return data.data[0]?.embedding || []
    } catch (error: any) {
      console.error('Azure OpenAI Embedding Error:', error)
      throw new Error(`Azure OpenAI embedding failed: ${error.message}`)
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const url = `${this.baseUrl}/${this.config.embeddingDeploymentName}/embeddings?api-version=${this.config.apiVersion}`

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.config.apiKey,
        },
        body: JSON.stringify({
          input: texts,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Azure OpenAI Embedding API error: ${response.status} ${error}`)
      }

      const data: EmbeddingResponse = await response.json()
      return data.data.map(item => item.embedding)
    } catch (error: any) {
      console.error('Azure OpenAI Batch Embedding Error:', error)
      throw new Error(`Azure OpenAI batch embedding failed: ${error.message}`)
    }
  }
}

/**
 * Create Azure OpenAI provider instance from environment variables
 */
export function createAzureOpenAIProvider(): AzureOpenAIProvider {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT
  const apiKey = process.env.AZURE_OPENAI_API_KEY
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview'
  const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4'
  const embeddingDeploymentName = process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME || 'text-embedding-ada-002'

  if (!endpoint || !apiKey) {
    throw new Error(
      'Azure OpenAI configuration missing. Please set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY environment variables.'
    )
  }

  return new AzureOpenAIProvider({
    endpoint,
    apiKey,
    apiVersion,
    deploymentName,
    embeddingDeploymentName,
  })
}
