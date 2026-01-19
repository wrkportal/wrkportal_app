/**
 * OpenAI Provider (Legacy - for migration period)
 * This will be removed after Azure OpenAI migration is complete
 */

import OpenAI from 'openai'
import { AIProvider, ChatMessage, ChatCompletion, ChatCompletionOptions } from '../types'

export class OpenAIProvider implements AIProvider {
  private client: OpenAI
  private model: string
  private embeddingModel: string

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set')
    }

    this.client = new OpenAI({ apiKey })
    this.model = process.env.OPENAI_MODEL || 'gpt-4o'
    this.embeddingModel = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small'
  }

  getProviderName(): string {
    return 'openai'
  }

  async generateChatCompletion(
    messages: ChatMessage[],
    options?: ChatCompletionOptions
  ): Promise<ChatCompletion> {
    try {
      const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = messages.map(msg => ({
        role: msg.role as 'system' | 'user' | 'assistant' | 'tool',
        content: msg.content,
        name: msg.name,
        tool_call_id: msg.tool_call_id,
      }))

      // Use model from options if provided (tier-based), otherwise use default
      const model = options?.model || this.model

      const completion = await this.client.chat.completions.create({
        model,
        messages: openaiMessages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2000,
        tools: options?.tools?.map(tool => ({
          type: 'function' as const,
          function: tool.function,
        })),
        response_format: options?.responseFormat === 'json_object' ? { type: 'json_object' } : undefined,
      })

      return {
        id: completion.id,
        choices: completion.choices.map(choice => ({
          index: choice.index,
          message: {
            role: choice.message.role,
            content: choice.message.content,
            tool_calls: choice.message.tool_calls?.map(tc => ({
              id: tc.id,
              type: tc.type,
              function: {
                name: tc.function.name,
                arguments: tc.function.arguments,
              },
            })),
          },
          finish_reason: choice.finish_reason,
        })),
        model: completion.model,
        usage: completion.usage,
      }
    } catch (error: any) {
      console.error('OpenAI API Error:', error)
      throw new Error(`OpenAI request failed: ${error.message}`)
    }
  }

  async generateStreamingCompletion(
    messages: ChatMessage[],
    options?: ChatCompletionOptions
  ): Promise<AsyncIterable<ChatCompletion>> {
    try {
      const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = messages.map(msg => ({
        role: msg.role as 'system' | 'user' | 'assistant' | 'tool',
        content: msg.content,
        name: msg.name,
        tool_call_id: msg.tool_call_id,
      }))

      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages: openaiMessages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2000,
        tools: options?.tools?.map(tool => ({
          type: 'function' as const,
          function: tool.function,
        })),
        stream: true,
      })

      return this.createStreamIterator(stream)
    } catch (error: any) {
      console.error('OpenAI Streaming Error:', error)
      throw new Error(`OpenAI streaming failed: ${error.message}`)
    }
  }

  private async* createStreamIterator(stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>): AsyncIterable<ChatCompletion> {
    for await (const chunk of stream) {
      yield {
        id: chunk.id,
        choices: chunk.choices.map(choice => ({
          index: choice.index,
          message: {
            role: choice.delta.role || 'assistant',
            content: choice.delta.content || null,
            tool_calls: choice.delta.tool_calls?.map(tc => ({
              id: tc.id || '',
              type: tc.type,
              function: {
                name: tc.function?.name || '',
                arguments: tc.function?.arguments || '',
              },
            })),
          },
          finish_reason: choice.finish_reason,
        })),
        model: chunk.model,
        usage: undefined, // Streaming doesn't include usage
      }
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.client.embeddings.create({
        model: this.embeddingModel,
        input: text,
      })

      return response.data[0]?.embedding || []
    } catch (error: any) {
      console.error('OpenAI Embedding Error:', error)
      throw new Error(`OpenAI embedding failed: ${error.message}`)
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const response = await this.client.embeddings.create({
        model: this.embeddingModel,
        input: texts,
      })

      return response.data.map(item => item.embedding)
    } catch (error: any) {
      console.error('OpenAI Batch Embedding Error:', error)
      throw new Error(`OpenAI batch embedding failed: ${error.message}`)
    }
  }
}
