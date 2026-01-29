import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// POST /api/collaborations/[id]/members - Add a member
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
        const { userId, role = 'MEMBER' } = await req.json()

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
        }

        if (!id) {
            return NextResponse.json({ error: 'Collaboration ID is required' }, { status: 400 })
        }

        // Verify current user is a member with permission to add others
        const currentMember = await prisma.collaborationMember.findFirst({
            where: {
                collaborationId: id,
                userId: session.user.id,
            }
        })

        if (!currentMember) {
            return NextResponse.json({ error: 'Not a member of this collaboration' }, { status: 403 })
        }

        // Check if user is already a member
        const existingMember = await prisma.collaborationMember.findFirst({
            where: {
                collaborationId: id,
                userId: userId
            }
        })

        if (existingMember) {
            return NextResponse.json({ error: 'User is already a member' }, { status: 400 })
        }

        // Add the new member
        const member = await prisma.collaborationMember.create({
            data: {
                collaborationId: id,
                userId: userId,
                role: role,
                joinedAt: new Date()
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

        return NextResponse.json({ member }, { status: 201 })
    } catch (error) {
        console.error('Error adding member:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

