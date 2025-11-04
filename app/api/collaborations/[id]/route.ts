import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET /api/collaborations/[id] - Get single collaboration with all details
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth()
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const collaboration = await prisma.collaboration.findFirst({
            where: {
                id: params.id,
                tenantId: session.user.tenantId,
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
                                avatar: true,
                                role: true
                            }
                        }
                    },
                    orderBy: {
                        joinedAt: 'asc'
                    }
                },
                messages: {
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
                        replies: {
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
                    },
                    where: {
                        isDeleted: false,
                        parentId: null  // Only top-level messages (replies included via nested include)
                    },
                    orderBy: {
                        createdAt: 'asc'
                    }
                },
                files: {
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
                    },
                    orderBy: {
                        uploadedAt: 'desc'
                    }
                },
                suggestions: {
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
                    },
                    orderBy: {
                        createdAt: 'desc'
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
                }
            }
        })

        if (!collaboration) {
            return NextResponse.json({ error: 'Collaboration not found' }, { status: 404 })
        }

        // Update last seen for current user
        await prisma.collaborationMember.updateMany({
            where: {
                collaborationId: params.id,
                userId: session.user.id
            },
            data: {
                lastSeenAt: new Date()
            }
        })

        return NextResponse.json({ collaboration })
    } catch (error) {
        console.error('Error fetching collaboration:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// PUT /api/collaborations/[id] - Update collaboration
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
        const { name, description, status, isArchived } = body

        // Check if user has edit permissions
        const member = await prisma.collaborationMember.findFirst({
            where: {
                collaborationId: params.id,
                userId: session.user.id,
                OR: [
                    { canEdit: true },
                    { role: 'OWNER' },
                    { role: 'ADMIN' }
                ]
            }
        })

        if (!member) {
            return NextResponse.json({ error: 'No permission to edit' }, { status: 403 })
        }

        const collaboration = await prisma.collaboration.update({
            where: { id: params.id },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(status && { status }),
                ...(isArchived !== undefined && { isArchived })
            },
            include: {
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

        return NextResponse.json({ collaboration })
    } catch (error) {
        console.error('Error updating collaboration:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE /api/collaborations/[id] - Delete collaboration
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth()
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check if user is owner
        const collaboration = await prisma.collaboration.findFirst({
            where: {
                id: params.id,
                tenantId: session.user.tenantId,
                createdById: session.user.id
            }
        })

        if (!collaboration) {
            return NextResponse.json(
                { error: 'Collaboration not found or no permission to delete' },
                { status: 404 }
            )
        }

        await prisma.collaboration.delete({
            where: { id: params.id }
        })

        return NextResponse.json({ message: 'Collaboration deleted successfully' })
    } catch (error) {
        console.error('Error deleting collaboration:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

