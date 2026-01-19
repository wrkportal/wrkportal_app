import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET /api/collaborations - List all collaborations for the current user
export async function GET(req: NextRequest) {
    try {
        const session = await auth()
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const status = searchParams.get('status')
        const type = searchParams.get('type')

        const collaborations = await prisma.collaboration.findMany({
            where: {
                tenantId: session.user.tenantId,
                isArchived: false,
                ...(status && { status: status as any }),
                ...(type && { type: type as any }),
                OR: [
                    { createdById: session.user.id },
                    {
                        members: {
                            some: {
                                userId: session.user.id
                            }
                        }
                    }
                ]
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true
                    }
                },
                members: {
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
                },
                project: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                },
                task: {
                    select: {
                        id: true,
                        title: true
                    }
                },
                messages: {
                    take: 1,
                    orderBy: {
                        createdAt: 'desc'
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                firstName: true,
                                lastName: true
                            }
                        }
                    },
                    where: {
                        isDeleted: false
                    }
                },
                _count: {
                    select: {
                        messages: true,
                        files: true,
                        suggestions: {
                            where: {
                                status: 'PENDING'
                            }
                        }
                    }
                }
            },
            orderBy: {
                updatedAt: 'desc'
            }
        })

        return NextResponse.json({ collaborations })
    } catch (error) {
        console.error('Error fetching collaborations:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/collaborations - Create a new collaboration
export async function POST(req: NextRequest) {
    try {
        const session = await auth()
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        console.log('[collaborations POST] Body:', body)
        const { name, description, type, projectId, taskId, memberIds } = body

        if (!name || !type) {
            return NextResponse.json(
                { error: 'Name and type are required' },
                { status: 400 }
            )
        }

        console.log('[collaborations POST] Creating collaboration:', {
            name,
            type,
            tenantId: session.user.tenantId,
            createdById: session.user.id
        })

        // Create collaboration with creator as owner
        const collaboration = await prisma.collaboration.create({
            data: {
                tenantId: session.user.tenantId,
                name,
                description,
                type,
                projectId: projectId || null,
                taskId: taskId || null,
                createdById: session.user.id,
                members: {
                    create: [
                        // Add creator as owner
                        {
                            userId: session.user.id,
                            role: 'OWNER',
                            canEdit: true,
                            canInvite: true,
                            canDelete: true
                        },
                        // Add other members
                        ...(memberIds || []).map((userId: string) => ({
                            userId,
                            role: 'MEMBER',
                            canEdit: false,
                            canInvite: false,
                            canDelete: false
                        }))
                    ]
                }
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true
                    }
                },
                members: {
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
                }
            }
        })

        console.log('[collaborations POST] Success:', collaboration.id)
        return NextResponse.json({ collaboration }, { status: 201 })
    } catch (error) {
        console.error('[collaborations POST] Error creating collaboration:', error)
        console.error('[collaborations POST] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
        return NextResponse.json({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}

