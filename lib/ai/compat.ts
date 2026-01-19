/**
 * Compatibility layer for OpenAI types
 * Helps migrate existing code to the new abstraction layer
 */

import { ChatMessage, ChatTool } from './types'
import type OpenAI from 'openai'

/**
 * Convert OpenAI ChatCompletionMessageParam to ChatMessage
 */
export function convertOpenAIMessage(
  message: OpenAI.Chat.ChatCompletionMessageParam
): ChatMessage {
  return {
    role: message.role,
    content: typeof message.content === 'string' ? message.content : '',
    name: 'name' in message ? message.name : undefined,
    tool_call_id: 'tool_call_id' in message ? message.tool_call_id : undefined,
  }
}

/**
 * Convert ChatMessage to OpenAI ChatCompletionMessageParam
 */
export function convertToOpenAIMessage(
  message: ChatMessage
): OpenAI.Chat.ChatCompletionMessageParam {
  return {
    role: message.role as 'system' | 'user' | 'assistant' | 'tool',
    content: message.content,
    name: message.name,
    tool_call_id: message.tool_call_id,
  }
}

/**
 * Convert OpenAI ChatCompletionTool to ChatTool
 */
export function convertOpenAITool(tool: OpenAI.Chat.ChatCompletionTool): ChatTool {
  return {
    type: 'function',
    function: tool.function,
  }
}

/**
 * Convert ChatTool to OpenAI ChatCompletionTool
 */
export function convertToOpenAITool(tool: ChatTool): OpenAI.Chat.ChatCompletionTool {
  return {
    type: 'function',
    function: tool.function,
  }
}

/**
 * Convert array of OpenAI messages
 */
export function convertOpenAIMessages(
  messages: OpenAI.Chat.ChatCompletionMessageParam[]
): ChatMessage[] {
  return messages.map(convertOpenAIMessage)
}

/**
 * Convert array of OpenAI tools
 */
export function convertOpenAITools(
  tools: OpenAI.Chat.ChatCompletionTool[]
): ChatTool[] {
  return tools.map(convertOpenAITool)
}
