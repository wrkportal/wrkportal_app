/**
 * Sales AI Assistant Chat API
 * 
 * Conversational AI assistant for sales data
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { chatWithSalesAssistant, createSalesFunctionImplementations } from '@/lib/ai/services/sales/sales-assistant'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messages } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      )
    }

    // Create function implementations with user context
    const functionImplementations = createSalesFunctionImplementations(
      session.user.id,
      session.user.tenantId
    )

    const result = await chatWithSalesAssistant(
      messages,
      session.user.id,
      session.user.tenantId,
      functionImplementations
    )

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Sales AI Chat API error:', error)
    
    return NextResponse.json(
      { 
        error: error?.message || 'Failed to process chat request',
        message: 'Sorry, I encountered an error. Please check your OpenAI API key configuration.'
      },
      { status: 500 }
    )
  }
}

