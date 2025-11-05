import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// DELETE /api/collaborations/[id]/files/[fileId] - Delete a file
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string; fileId: string } }
) {
    try {
        const session = await auth()
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check if file exists and user has permission
        const file = await prisma.collaborationFile.findFirst({
            where: {
                id: params.fileId,
                collaborationId: params.id
            }
        })

        if (!file) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 })
        }

        // Only the uploader or collaboration owner can delete
        if (file.userId !== session.user.id) {
            // Check if user is owner/admin of the collaboration
            const member = await prisma.collaborationMember.findFirst({
                where: {
                    collaborationId: params.id,
                    userId: session.user.id,
                    OR: [
                        { role: 'OWNER' },
                        { role: 'ADMIN' }
                    ]
                }
            })

            if (!member) {
                return NextResponse.json({ error: 'No permission to delete this file' }, { status: 403 })
            }
        }

        // Delete the file record
        await prisma.collaborationFile.delete({
            where: { id: params.fileId }
        })

        return NextResponse.json({ message: 'File deleted successfully' })
    } catch (error) {
        console.error('Error deleting file:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

