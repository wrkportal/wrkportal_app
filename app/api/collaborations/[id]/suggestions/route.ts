import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// POST /api/collaborations/[id]/suggestions - Create a suggestion
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth()
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { title, description, suggestionType, targetType, targetId, originalContent, suggestedContent } = body

        if (!title || !description || !suggestionType) {
            return NextResponse.json(
                { error: 'Title, description, and suggestion type are required' },
                { status: 400 }
            )
        }

        // Verify user is a member
        const member = await prisma.collaborationMember.findFirst({
            where: {
                collaborationId: params.id,
                userId: session.user.id
            }
        })

        if (!member) {
            return NextResponse.json({ error: 'Not a member of this collaboration' }, { status: 403 })
        }

        const suggestion = await prisma.collaborationSuggestion.create({
            data: {
                collaborationId: params.id,
                userId: session.user.id,
                title,
                description,
                suggestionType,
                targetType: targetType || null,
                targetId: targetId || null,
                originalContent: originalContent || null,
                suggestedContent: suggestedContent || null
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true
                    }
                }
            }
        })

        return NextResponse.json({ suggestion }, { status: 201 })
    } catch (error) {
        console.error('Error creating suggestion:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// PUT /api/collaborations/[id]/suggestions/[suggestionId] - Respond to a suggestion
export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth()
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { suggestionId, status, responseNote } = body

        if (!suggestionId || !status) {
            return NextResponse.json(
                { error: 'Suggestion ID and status are required' },
                { status: 400 }
            )
        }

        // Check if user has permission to respond (owner, admin, or canEdit)
        const member = await prisma.collaborationMember.findFirst({
            where: {
                collaborationId: params.id,
                userId: session.user.id,
                OR: [
                    { role: 'OWNER' },
                    { role: 'ADMIN' },
                    { canEdit: true }
                ]
            }
        })

        if (!member) {
            return NextResponse.json({ error: 'No permission to respond to suggestions' }, { status: 403 })
        }

        const suggestion = await prisma.collaborationSuggestion.update({
            where: { id: suggestionId },
            data: {
                status,
                respondedById: session.user.id,
                responseNote: responseNote || null,
                respondedAt: new Date()
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true
                    }
                },
                respondedBy: {
                    select: {
                        id: true,
                        name: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true
                    }
                }
            }
        })

        return NextResponse.json({ suggestion })
    } catch (error) {
        console.error('Error responding to suggestion:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

