/**
 * AI Project Assistant with Function Calling
 */

import { generateFunctionCall, generateChatCompletion, ChatTool } from '../ai-service'
import { PROMPTS } from '../prompts'
import { convertOpenAIMessage, convertOpenAITools } from '../compat'
import type OpenAI from 'openai'
import type { ChatMessage } from '../types'

// Define available functions for the AI assistant (using ChatTool type for compatibility)
export const ASSISTANT_FUNCTIONS: ChatTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_org_users',
      description: 'Get users for an organization (tenant). If tenantId is omitted, use current session tenant.',
      parameters: {
        type: 'object',
        properties: {
          tenantId: {
            type: 'string',
            description: 'Organization ID (tenantId). Optional: use current tenant when omitted.'
          },
          status: {
            type: 'string',
            enum: ['ACTIVE', 'INACTIVE', 'INVITED', 'SUSPENDED'],
            description: 'Filter by user status'
          }
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_project_details',
      description: 'Get detailed information about a specific project',
      parameters: {
        type: 'object',
        properties: {
          projectId: {
            type: 'string',
            description: 'The ID of the project',
          },
        },
        required: ['projectId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_projects',
      description: 'List all projects with optional filters',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'AT_RISK', 'COMPLETED', 'CANCELLED'],
            description: 'Filter by project status',
          },
          search: {
            type: 'string',
            description: 'Search term to filter projects',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_task',
      description: 'Create a new task in a project',
      parameters: {
        type: 'object',
        properties: {
          projectId: {
            type: 'string',
            description: 'The project ID where the task will be created',
          },
          title: {
            type: 'string',
            description: 'Task title',
          },
          description: {
            type: 'string',
            description: 'Detailed task description',
          },
          assigneeId: {
            type: 'string',
            description: 'User ID to assign the task to',
          },
          priority: {
            type: 'string',
            enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
            description: 'Task priority',
          },
          dueDate: {
            type: 'string',
            description: 'Due date in ISO format',
          },
        },
        required: ['projectId', 'title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_task_status',
      description: 'Update the status of a task',
      parameters: {
        type: 'object',
        properties: {
          taskId: {
            type: 'string',
            description: 'The task ID to update',
          },
          status: {
            type: 'string',
            enum: ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'DONE', 'CANCELLED'],
            description: 'New task status',
          },
        },
        required: ['taskId', 'status'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_my_tasks',
      description: 'Get tasks assigned to the current user',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'DONE'],
            description: 'Filter by task status',
          },
          overdue: {
            type: 'boolean',
            description: 'Show only overdue tasks',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_all_tasks',
      description: 'Get all tasks in the organization (admin only). Can filter by status, overdue, or project.',
      parameters: {
        type: 'object',
        properties: {
          projectId: {
            type: 'string',
            description: 'Filter tasks by project ID',
          },
          status: {
            type: 'string',
            enum: ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'DONE'],
            description: 'Filter by task status',
          },
          overdue: {
            type: 'boolean',
            description: 'Show only overdue tasks',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_budget_status',
      description: 'Get budget information for a project',
      parameters: {
        type: 'object',
        properties: {
          projectId: {
            type: 'string',
            description: 'The project ID',
          },
        },
        required: ['projectId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_team_members',
      description: 'Get list of team members, optionally filtered by skills or availability',
      parameters: {
        type: 'object',
        properties: {
          projectId: {
            type: 'string',
            description: 'Filter by project membership',
          },
          skills: {
            type: 'array',
            items: { type: 'string' },
            description: 'Filter by required skills',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_risk',
      description: 'Log a new risk for a project',
      parameters: {
        type: 'object',
        properties: {
          projectId: {
            type: 'string',
            description: 'The project ID',
          },
          title: {
            type: 'string',
            description: 'Risk title',
          },
          description: {
            type: 'string',
            description: 'Detailed risk description',
          },
          probability: {
            type: 'number',
            description: 'Risk probability (1-5)',
            minimum: 1,
            maximum: 5,
          },
          impact: {
            type: 'number',
            description: 'Risk impact (1-5)',
            minimum: 1,
            maximum: 5,
          },
        },
        required: ['projectId', 'title', 'description', 'probability', 'impact'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_project_risks',
      description: 'Get all risks for a project',
      parameters: {
        type: 'object',
        properties: {
          projectId: {
            type: 'string',
            description: 'The project ID',
          },
          level: {
            type: 'string',
            enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
            description: 'Filter by risk level',
          },
        },
        required: ['projectId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_projects_and_tasks',
      description: 'Search across projects and tasks using keywords',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query',
          },
        },
        required: ['query'],
      },
    },
  },
  // Sales-specific functions
  {
    type: 'function',
    function: {
      name: 'schedule_meeting',
      description: 'Schedule a meeting or call with a client, lead, or contact. Use this when user asks to schedule, book, or set up a meeting.',
      parameters: {
        type: 'object',
        properties: {
          subject: {
            type: 'string',
            description: 'Meeting subject/title',
          },
          description: {
            type: 'string',
            description: 'Meeting description or agenda',
          },
          dueDate: {
            type: 'string',
            description: 'Meeting date and time in ISO format (e.g., 2024-01-15T14:00:00Z)',
          },
          duration: {
            type: 'number',
            description: 'Meeting duration in minutes (default: 30)',
          },
          type: {
            type: 'string',
            enum: ['MEETING', 'CALL', 'EMAIL', 'TASK'],
            description: 'Activity type - use MEETING for in-person, CALL for phone/video calls',
          },
          leadId: {
            type: 'string',
            description: 'ID of the lead if meeting is with a lead',
          },
          contactId: {
            type: 'string',
            description: 'ID of the contact if meeting is with a contact',
          },
          accountId: {
            type: 'string',
            description: 'ID of the account if meeting is with an account',
          },
          opportunityId: {
            type: 'string',
            description: 'ID of the opportunity if meeting is related to a deal',
          },
          location: {
            type: 'string',
            description: 'Meeting location (for in-person meetings) or video call link',
          },
        },
        required: ['subject', 'dueDate'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_opportunity',
      description: 'Create a new sales opportunity (deal). Use this when user asks to add a new deal, opportunity, or sales prospect.',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Opportunity name (e.g., "Q1 Enterprise Deal with Acme Corp")',
          },
          description: {
            type: 'string',
            description: 'Opportunity description',
          },
          amount: {
            type: 'number',
            description: 'Deal amount/value',
          },
          stage: {
            type: 'string',
            enum: ['PROSPECTING', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'],
            description: 'Sales stage',
          },
          probability: {
            type: 'number',
            description: 'Win probability percentage (0-100)',
          },
          expectedCloseDate: {
            type: 'string',
            description: 'Expected close date in ISO format',
          },
          accountId: {
            type: 'string',
            description: 'Associated account ID',
          },
          leadId: {
            type: 'string',
            description: 'Associated lead ID if converted from lead',
          },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_my_schedule',
      description: "Get the user's schedule/calendar for a specific day. Shows meetings, calls, and activities scheduled for that day.",
      parameters: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            description: 'Date in ISO format (YYYY-MM-DD). If not provided, uses today.',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_my_priorities',
      description: "Get the user's priorities - high priority tasks, overdue items, and important activities that need attention.",
      parameters: {
        type: 'object',
        properties: {
          includeOverdue: {
            type: 'boolean',
            description: 'Include overdue tasks and activities',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_leads',
      description: 'List sales leads. Can search by name, company, or email.',
      parameters: {
        type: 'object',
        properties: {
          search: {
            type: 'string',
            description: 'Search term to find leads by name, company, or email',
          },
          status: {
            type: 'string',
            enum: ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST'],
            description: 'Filter by lead status',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_contacts',
      description: 'List sales contacts. Can search by name or email.',
      parameters: {
        type: 'object',
        properties: {
          search: {
            type: 'string',
            description: 'Search term to find contacts by name or email',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_opportunities',
      description: 'List sales opportunities (deals). Can filter by stage or search by name.',
      parameters: {
        type: 'object',
        properties: {
          search: {
            type: 'string',
            description: 'Search term to find opportunities by name',
          },
          stage: {
            type: 'string',
            enum: ['PROSPECTING', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'],
            description: 'Filter by sales stage',
          },
          status: {
            type: 'string',
            enum: ['OPEN', 'CLOSED'],
            description: 'Filter by opportunity status',
          },
        },
        required: [],
      },
    },
  },
]

/**
 * Trim conversation history to prevent token limit issues
 * Keep the system message and the most recent exchanges
 */
function trimConversationHistory(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  maxMessages: number = 10
): ChatMessage[] {
  const toChatMessage = (message: OpenAI.Chat.ChatCompletionMessageParam): ChatMessage => ({
    role: message.role === 'developer' ? 'system' : (message.role === 'function' ? 'tool' : message.role),
    content: typeof message.content === 'string' ? message.content : '',
    name: 'name' in message ? message.name : undefined,
    tool_call_id: 'tool_call_id' in message ? message.tool_call_id : undefined,
  })

  // Always keep system message
  const systemMessage = messages[0]?.role === 'system' ? toChatMessage(messages[0]) : null
  const conversationMessages = (systemMessage ? messages.slice(1) : messages).map(toChatMessage)
  
  // If we're under the limit, return as is
  if (conversationMessages.length <= maxMessages) {
    return systemMessage ? [systemMessage, ...conversationMessages] : conversationMessages
  }
  
  // Keep only the most recent messages
  const recentMessages = conversationMessages.slice(-maxMessages)
  return systemMessage ? [systemMessage, ...recentMessages] : recentMessages
}

/**
 * Process a chat message with the AI assistant
 */
export async function chatWithAssistant(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  availableFunctions?: Record<string, Function>,
  options?: {
    model?: string
    temperature?: number
    maxTokens?: number
  }
): Promise<{ message: string; functionCalls?: any[] }> {
  // Add system prompt if not present
  if (messages[0]?.role !== 'system') {
    messages.unshift({
      role: 'system',
      content: PROMPTS.ASSISTANT_SYSTEM,
    })
  }

  // Trim conversation history to prevent token overflow
  const trimmedMessages = trimConversationHistory(messages, 10)

  const completion = await generateFunctionCall(trimmedMessages, ASSISTANT_FUNCTIONS, {
    model: options?.model,
    temperature: options?.temperature,
    maxTokens: options?.maxTokens,
  })

  const responseMessage = completion.choices[0]?.message

  // Check if the model wants to call a function
  if (responseMessage?.tool_calls && availableFunctions) {
    const functionCalls = []

    for (const toolCall of responseMessage.tool_calls) {
      const functionName = toolCall.function.name
      const functionArgs = JSON.parse(toolCall.function.arguments)

      // Execute the function if available
      if (availableFunctions[functionName]) {
        try {
          const functionResult = await availableFunctions[functionName](functionArgs)
          functionCalls.push({
            name: functionName,
            arguments: functionArgs,
            result: functionResult,
          })

          // Add function result to messages
          trimmedMessages.push({
            role: responseMessage.role,
            content: responseMessage.content ?? '',
          })
          trimmedMessages.push({
            role: 'tool',
            content: JSON.stringify(functionResult),
            tool_call_id: toolCall.id,
          })
        } catch (error) {
          console.error(`Error executing function ${functionName}:`, error)
          functionCalls.push({
            name: functionName,
            arguments: functionArgs,
            error: 'Function execution failed',
          })
        }
      }
    }

    // Get final response after function calls
    const finalCompletion = await generateChatCompletion(trimmedMessages, {
      model: options?.model,
      temperature: options?.temperature ?? 0.7,
      maxTokens: options?.maxTokens,
    })
    const finalMessage = finalCompletion.choices[0]?.message?.content || ''

    return {
      message: finalMessage,
      functionCalls,
    }
  }

  return {
    message: responseMessage?.content || 'I apologize, but I could not generate a response.',
  }
}

/**
 * Simple query without function calling
 */
export async function askAssistant(question: string, context?: string): Promise<string> {
  const messages: ChatMessage[] = [
    { role: 'system', content: PROMPTS.ASSISTANT_SYSTEM },
  ]

  if (context) {
    messages.push({
      role: 'system',
      content: `Additional context:\n${context}`,
    })
  }

  messages.push({ role: 'user', content: question })

  const completion = await generateChatCompletion(messages)
  return completion.choices[0]?.message?.content || ''
}

