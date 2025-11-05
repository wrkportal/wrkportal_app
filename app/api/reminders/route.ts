import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// GET /api/reminders - Get all reminders for the current user
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const includeCompleted = searchParams.get('includeCompleted') === 'true';

        const where: any = {
            userId: session.user.id,
            tenantId: session.user.tenantId,
        };

        if (!includeCompleted) {
            where.completed = false;
            where.dismissed = false;
        }

        const reminders = await prisma.reminder.findMany({
            where,
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true,
                    },
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true,
                    },
                },
            },
            orderBy: {
                remindAt: 'asc',
            },
        });

        return NextResponse.json({ reminders });
    } catch (error) {
        console.error('Error fetching reminders:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/reminders - Create a new reminder
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { title, description, remindAt, userId, sourceType, sourceId } = body;

        if (!title || !remindAt) {
            return NextResponse.json(
                { error: 'Title and remind time are required' },
                { status: 400 }
            );
        }

        // If userId is provided, verify they're in the same tenant
        if (userId && userId !== session.user.id) {
            const targetUser = await prisma.user.findFirst({
                where: {
                    id: userId,
                    tenantId: session.user.tenantId,
                },
            });

            if (!targetUser) {
                return NextResponse.json(
                    { error: 'User not found or not in your organization' },
                    { status: 404 }
                );
            }
        }

        const reminder = await prisma.reminder.create({
            data: {
                title,
                description,
                remindAt: new Date(remindAt),
                userId: userId || session.user.id,
                createdById: session.user.id,
                tenantId: session.user.tenantId,
                sourceType,
                sourceId,
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true,
                    },
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true,
                    },
                },
            },
        });

        // Create a notification for the user
        await prisma.notification.create({
            data: {
                userId: userId || session.user.id,
                tenantId: session.user.tenantId,
                type: 'DEADLINE',
                title: `Reminder: ${title}`,
                message: description || 'You have a new reminder',
                entityType: 'REMINDER',
                entityId: reminder.id,
            },
        });

        return NextResponse.json({ reminder }, { status: 201 });
    } catch (error) {
        console.error('Error creating reminder:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

