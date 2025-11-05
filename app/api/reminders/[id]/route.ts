import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// PUT /api/reminders/[id] - Update a reminder
export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { completed, dismissed } = body;

        // Verify the reminder belongs to the user or was created by them
        const existingReminder = await prisma.reminder.findFirst({
            where: {
                id: params.id,
                tenantId: session.user.tenantId,
                OR: [
                    { userId: session.user.id },
                    { createdById: session.user.id },
                ],
            },
        });

        if (!existingReminder) {
            return NextResponse.json(
                { error: 'Reminder not found' },
                { status: 404 }
            );
        }

        const reminder = await prisma.reminder.update({
            where: { id: params.id },
            data: {
                completed: completed !== undefined ? completed : existingReminder.completed,
                dismissed: dismissed !== undefined ? dismissed : existingReminder.dismissed,
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

        return NextResponse.json({ reminder });
    } catch (error) {
        console.error('Error updating reminder:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE /api/reminders/[id] - Delete a reminder
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify the reminder belongs to the user or was created by them
        const existingReminder = await prisma.reminder.findFirst({
            where: {
                id: params.id,
                tenantId: session.user.tenantId,
                OR: [
                    { userId: session.user.id },
                    { createdById: session.user.id },
                ],
            },
        });

        if (!existingReminder) {
            return NextResponse.json(
                { error: 'Reminder not found' },
                { status: 404 }
            );
        }

        await prisma.reminder.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ message: 'Reminder deleted' });
    } catch (error) {
        console.error('Error deleting reminder:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

