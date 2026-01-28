import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { readFile } from 'fs/promises'
import path from 'path'

// GET /api/collaborations/[id]/files/[fileName] - Serve a file
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; fileName: string }> }
) {
    try {
        const session = await auth()
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id, fileName } = await params

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

        // Find the file record
        const file = await prisma.collaborationFile.findFirst({
            where: {
                collaborationId: id,
                fileUrl: `/api/collaborations/${id}/files/${fileName}`
            }
        })

        if (!file) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 })
        }

        // Read file from /tmp directory
        const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
        const filePath = isServerless
            ? path.join('/tmp', 'collaborations', fileName)
            : path.join(process.cwd(), 'public', 'uploads', 'collaborations', fileName)

        try {
            const fileBuffer = await readFile(filePath)
            
            // Determine content type
            const contentType = file.fileType || 'application/octet-stream'
            
            return new NextResponse(fileBuffer, {
                headers: {
                    'Content-Type': contentType,
                    'Content-Disposition': `inline; filename="${file.fileName}"`,
                    'Content-Length': file.fileSize.toString(),
                },
            })
        } catch (fileError: any) {
            console.error('Error reading file:', fileError)
            return NextResponse.json(
                { error: 'File not found on server' },
                { status: 404 }
            )
        }
    } catch (error) {
        console.error('Error serving file:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
