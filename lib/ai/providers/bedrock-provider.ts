/**
 * AWS Bedrock AI Provider
 *
 * Uses AWS Bedrock to access Claude (Anthropic) and Amazon Titan models.
 * Credentials are inherited from ECS Task Role (IAM) — no access keys needed
 * when running on ECS/Lambda with the correct task role.
 */

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelWithResponseStreamCommand,
} from '@aws-sdk/client-bedrock-runtime'
import {
  AIProvider,
  ChatMessage,
  ChatCompletion,
  ChatCompletionOptions,
} from '../types'

interface BedrockConfig {
  region: string
  modelId: string
  embeddingModelId: string
}

export class BedrockProvider implements AIProvider {
  private client: BedrockRuntimeClient
  private config: BedrockConfig

  constructor(config: BedrockConfig) {
    this.config = config
    // Credentials are resolved automatically via:
    // 1. ECS Task Role (production)
    // 2. AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY env vars (fallback)
    // 3. ~/.aws/credentials (local dev)
    this.client = new BedrockRuntimeClient({ region: config.region })
  }

  getProviderName(): string {
    return 'aws-bedrock'
  }

  /**
   * Convert our ChatMessage format to Anthropic Messages API format
   */
  private formatMessages(messages: ChatMessage[]): {
    system: string
    messages: Array<{ role: string; content: string }>
  } {
    let system = ''
    const formatted: Array<{ role: string; content: string }> = []

    for (const msg of messages) {
      if (msg.role === 'system') {
        system += (system ? '\n\n' : '') + msg.content
      } else if (msg.role === 'tool') {
        // Convert tool responses to user messages for Anthropic
        formatted.push({
          role: 'user',
          content: `[Tool Result for ${msg.tool_call_id || 'unknown'}]: ${msg.content}`,
        })
      } else {
        formatted.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content,
        })
      }
    }

    // Ensure messages alternate user/assistant (Anthropic requirement)
    // Merge consecutive same-role messages
    const merged: Array<{ role: string; content: string }> = []
    for (const msg of formatted) {
      if (merged.length > 0 && merged[merged.length - 1].role === msg.role) {
        merged[merged.length - 1].content += '\n\n' + msg.content
      } else {
        merged.push({ ...msg })
      }
    }

    // Ensure first message is from user
    if (merged.length === 0 || merged[0].role !== 'user') {
      merged.unshift({ role: 'user', content: system || 'Hello' })
      system = ''
    }

    return { system, messages: merged }
  }

  async generateChatCompletion(
    messages: ChatMessage[],
    options?: ChatCompletionOptions
  ): Promise<ChatCompletion> {
    try {
      const { system, messages: formatted } = this.formatMessages(messages)

      const body: Record<string, any> = {
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: options?.maxTokens ?? 2000,
        temperature: options?.temperature ?? 0.7,
        messages: formatted,
      }

      if (system) {
        body.system = system
      }

      // Tool use support
      if (options?.tools && options.tools.length > 0) {
        body.tools = options.tools.map((tool) => ({
          name: tool.function.name,
          description: tool.function.description,
          input_schema: tool.function.parameters,
        }))
      }

      const command = new InvokeModelCommand({
        modelId: options?.model || this.config.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(body),
      })

      const response = await this.client.send(command)
      const responseBody = JSON.parse(new TextDecoder().decode(response.body))

      // Parse Anthropic response format
      const content = responseBody.content || []
      let textContent = ''
      const toolCalls: ChatCompletion['choices'][0]['message']['tool_calls'] = []

      for (const block of content) {
        if (block.type === 'text') {
          textContent += block.text
        } else if (block.type === 'tool_use') {
          toolCalls.push({
            id: block.id,
            type: 'function',
            function: {
              name: block.name,
              arguments: JSON.stringify(block.input),
            },
          })
        }
      }

      return {
        id: responseBody.id || `bedrock-${Date.now()}`,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: textContent || null,
              tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
            },
            finish_reason: responseBody.stop_reason || 'end_turn',
          },
        ],
        model: this.config.modelId,
        usage: responseBody.usage
          ? {
              prompt_tokens: responseBody.usage.input_tokens,
              completion_tokens: responseBody.usage.output_tokens,
              total_tokens:
                responseBody.usage.input_tokens +
                responseBody.usage.output_tokens,
            }
          : undefined,
      }
    } catch (error: any) {
      console.error('AWS Bedrock API Error:', error)
      throw new Error(`AWS Bedrock request failed: ${error.message}`)
    }
  }

  async generateStreamingCompletion(
    messages: ChatMessage[],
    options?: ChatCompletionOptions
  ): Promise<AsyncIterable<ChatCompletion>> {
    try {
      const { system, messages: formatted } = this.formatMessages(messages)

      const body: Record<string, any> = {
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: options?.maxTokens ?? 2000,
        temperature: options?.temperature ?? 0.7,
        messages: formatted,
      }

      if (system) {
        body.system = system
      }

      const command = new InvokeModelWithResponseStreamCommand({
        modelId: options?.model || this.config.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(body),
      })

      const response = await this.client.send(command)
      return this.createStreamIterator(response.body!)
    } catch (error: any) {
      console.error('AWS Bedrock Streaming Error:', error)
      throw new Error(`AWS Bedrock streaming failed: ${error.message}`)
    }
  }

  private async *createStreamIterator(
    stream: AsyncIterable<any>
  ): AsyncIterable<ChatCompletion> {
    for await (const event of stream) {
      if (event.chunk) {
        const chunk = JSON.parse(
          new TextDecoder().decode(event.chunk.bytes)
        )

        if (chunk.type === 'content_block_delta' && chunk.delta?.type === 'text_delta') {
          yield {
            id: `bedrock-stream-${Date.now()}`,
            choices: [
              {
                index: 0,
                message: {
                  role: 'assistant',
                  content: chunk.delta.text,
                },
                finish_reason: null,
              },
            ],
            model: this.config.modelId,
          }
        } else if (chunk.type === 'message_delta') {
          yield {
            id: `bedrock-stream-${Date.now()}`,
            choices: [
              {
                index: 0,
                message: {
                  role: 'assistant',
                  content: null,
                },
                finish_reason: chunk.delta?.stop_reason || 'end_turn',
              },
            ],
            model: this.config.modelId,
            usage: chunk.usage
              ? {
                  prompt_tokens: 0,
                  completion_tokens: chunk.usage.output_tokens || 0,
                  total_tokens: chunk.usage.output_tokens || 0,
                }
              : undefined,
          }
        }
      }
    }
  }

  /**
   * Generate embeddings using Amazon Titan Embeddings model
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const command = new InvokeModelCommand({
        modelId: this.config.embeddingModelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          inputText: text,
        }),
      })

      const response = await this.client.send(command)
      const responseBody = JSON.parse(new TextDecoder().decode(response.body))
      return responseBody.embedding || []
    } catch (error: any) {
      console.error('AWS Bedrock Embedding Error:', error)
      throw new Error(`AWS Bedrock embedding failed: ${error.message}`)
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    // Titan Embeddings doesn't support batch — process sequentially
    const results: number[][] = []
    for (const text of texts) {
      results.push(await this.generateEmbedding(text))
    }
    return results
  }
}

/**
 * Create Bedrock provider from environment variables
 */
export function createBedrockProvider(): BedrockProvider {
  return new BedrockProvider({
    region: process.env.AWS_BEDROCK_REGION || process.env.AWS_REGION || 'us-east-1',
    modelId: process.env.AWS_BEDROCK_MODEL_ID || 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    embeddingModelId: process.env.AWS_BEDROCK_EMBEDDING_MODEL_ID || 'amazon.titan-embed-text-v2:0',
  })
}
