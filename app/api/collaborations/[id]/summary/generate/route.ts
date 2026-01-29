import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { generateChatCompletion } from '@/lib/ai/openai-service'

// POST /api/collaborations/[id]/summary/generate - Generate AI summary
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify user is a member
    const member = await prisma.collaborationMember.findFirst({
      where: {
        collaborationId: id,
        userId: session.user.id
      }
    })

    if (!member) {
      return NextResponse.json({ error: 'Not a member of this collaboration' }, { status: 403 })
    }

    // Get collaboration details
    const collaboration = await prisma.collaboration.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    })

    if (!collaboration) {
      return NextResponse.json({ error: 'Collaboration not found' }, { status: 404 })
    }

    // Fetch all messages from the collaboration
    const messages = await prisma.collaborationMessage.findMany({
      where: {
        collaborationId: id,
        isDeleted: false
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      },
      take: 100 // Limit to last 100 messages for context
    })

    // Fetch calls where participants are members of this collaboration
    const memberUserIds = collaboration.members.map(m => m.userId)
    let calls: any[] = []
    
    try {
      // Get calls where any member is a participant
      const allCalls = await prisma.call.findMany({
        where: {
          tenantId: session.user.tenantId,
          participants: {
            some: {
              userId: { in: memberUserIds }
            }
          }
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              firstName: true,
              lastName: true
            }
          },
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 20 // Limit to last 20 calls
      })

      // Filter calls where title contains collaboration name or all participants are members
      calls = allCalls.filter(call => {
        const callParticipantIds = call.participants.map(p => p.userId)
        const allParticipantsAreMembers = callParticipantIds.every(id => memberUserIds.includes(id))
        const titleMatches = call.title?.toLowerCase().includes(collaboration.name.toLowerCase())
        return allParticipantsAreMembers || titleMatches
      })
    } catch (error: any) {
      // If Call model doesn't exist, just log and continue
      if (error.code === 'P2001' || error.code === 'P2021' || error.code === 'P2022' || 
          error.message?.includes('does not exist') || error.message?.includes('Unknown model')) {
        console.warn('Call model not available, skipping call context')
      } else {
        throw error
      }
    }

    // Build context from messages
    const messagesContext = messages.map(msg => {
      const userName = msg.user.firstName && msg.user.lastName 
        ? `${msg.user.firstName} ${msg.user.lastName}`
        : msg.user.name || msg.user.email
      return `[${new Date(msg.createdAt).toLocaleString()}] ${userName}: ${msg.content}`
    }).join('\n')

    // Build context from calls
    const callsContext = calls.map(call => {
      const participants = call.participants.map(p => {
        const name = p.user.firstName && p.user.lastName 
          ? `${p.user.firstName} ${p.user.lastName}`
          : p.user.name || 'Unknown'
        return name
      }).join(', ')
      const callDate = call.scheduledAt || call.createdAt
      return `Call: "${call.title || 'Untitled'}" on ${new Date(callDate).toLocaleString()} with ${participants}${call.description ? ` - ${call.description}` : ''}`
    }).join('\n')

    // Create prompt for AI summary
    const prompt = `You are analyzing a collaboration group called "${collaboration.name}".

${collaboration.description ? `Description: ${collaboration.description}\n` : ''}

Group Members: ${collaboration.members.map(m => {
  const name = m.user.firstName && m.user.lastName 
    ? `${m.user.firstName} ${m.user.lastName}`
    : m.user.name || m.user.email
  return name
}).join(', ')}

${messages.length > 0 ? `\n\n=== FULL DISCUSSION HISTORY ===\nPlease carefully read and analyze ALL the messages below. Extract key information, topics discussed, decisions made, action items, and important details:\n\n${messagesContext}\n\n=== END OF DISCUSSION HISTORY ===` : '\n\nNo discussion messages yet.'}

${calls.length > 0 ? `\n\n=== SCHEDULED CALLS/MEETINGS ===\n${callsContext}\n=== END OF CALLS ===` : '\n\nNo calls scheduled yet.'}

IMPORTANT: Read through the ENTIRE discussion history above. Do NOT just count messages. Analyze the ACTUAL CONTENT of each message to understand:
- What topics are being discussed
- What decisions have been made
- What action items or tasks were mentioned
- What problems or issues were raised
- What solutions or ideas were proposed
- Who contributed what to the discussion
- What the current status is

Create a comprehensive, detailed summary that shows you've actually read and understood the conversation content. Include specific examples from the messages, not just generic statements. Format it as a clear, well-structured summary with sections for:
1. Key Topics Discussed (with specific details from messages)
2. Important Decisions Made (quote or reference specific messages)
3. Action Items and Next Steps (extract from the discussion)
4. Main Contributors and Their Input (what each person said)
5. Upcoming Calls/Meetings (if any)
6. Overall Status and Summary`

    // Generate summary using AI
    let summary = ''
    try {
      const completion = await generateChatCompletion([
        {
          role: 'system',
          content: 'You are a helpful assistant that creates clear, concise summaries of collaboration discussions and meetings.'
        },
        {
          role: 'user',
          content: prompt
        }
      ], {
        temperature: 0.7,
        maxTokens: 1000
      })

      summary = completion.choices[0]?.message?.content || 'Unable to generate summary at this time.'
    } catch (aiError: any) {
      console.error('Error generating AI summary:', aiError)
      // Fallback summary if AI fails
      summary = `Summary for "${collaboration.name}"

${messages.length > 0 ? `This group has ${messages.length} discussion messages. ` : 'No messages yet. '}
${calls.length > 0 ? `${calls.length} call(s) have been scheduled. ` : 'No calls scheduled yet. '}

${collaboration.members.length} member(s) are part of this collaboration.`
    }

    // Save summary to database
    await prisma.collaboration.update({
      where: { id },
      data: {
        summary,
        summaryGeneratedAt: new Date()
      }
    })

    return NextResponse.json({ summary })
  } catch (error) {
    console.error('Error generating summary:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
