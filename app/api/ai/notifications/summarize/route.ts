import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { extractStructuredData } from '@/lib/ai/openai-service'
import { PROMPTS } from '@/lib/ai/prompts'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { notifications } = body

    if (!notifications || typeof notifications !== 'string' || !notifications.trim()) {
      return NextResponse.json(
        { error: 'Notifications text is required' },
        { status: 400 }
      )
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment variables.' },
        { status: 500 }
      )
    }

    // Create prompt for summarizing plain text notifications
    const notificationContext = `Analyze and summarize the following notifications that a user has pasted from various sources (email, Slack, Teams, etc.):

${notifications}

Create a clear, actionable summary that helps the user prioritize what needs attention.`

    // Define the schema matching the frontend's expected format
    const schema = `{
  "overview": "string (2-3 sentences summarizing the key points and overall situation)",
  "priorityActions": [
    {
      "priority": "urgent | high | medium | low",
      "action": "string (what needs to be done)",
      "from": "string (who or what system sent this notification)"
    }
  ],
  "keyUpdates": ["string (important updates or information)"],
  "canWait": ["string (items that can be addressed later)"]
}`

    const result = await extractStructuredData<any>(
      notificationContext,
      schema,
      PROMPTS.NOTIFICATION_SUMMARIZER
    )

    // Validate and ensure the response has the expected structure
    const summary = {
      overview: result.overview || 'No overview available',
      priorityActions: Array.isArray(result.priorityActions) 
        ? result.priorityActions 
        : [],
      keyUpdates: Array.isArray(result.keyUpdates) 
        ? result.keyUpdates 
        : [],
      canWait: Array.isArray(result.canWait) 
        ? result.canWait 
        : [],
    }

    return NextResponse.json({ summary })
  } catch (error: any) {
    console.error('Notification summarization error:', error)
    
    // Provide more helpful error messages
    let errorMessage = 'Failed to summarize notifications'
    if (error?.message?.includes('API key')) {
      errorMessage = 'OpenAI API key is invalid or missing'
    } else if (error?.message?.includes('rate limit')) {
      errorMessage = 'OpenAI API rate limit exceeded. Please try again later.'
    } else if (error?.message) {
      errorMessage = error.message
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
