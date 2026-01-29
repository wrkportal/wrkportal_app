import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getFileUrl } from '@/lib/storage/s3-storage'
import { readFile, mkdir } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

// GET /api/collaborations/[id]/files/[fileName] - Serve a file
// DELETE /api/collaborations/[id]/files/[fileId] - Delete a file (by database ID)
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

        // Find the file record - try by fileUrl first, then by fileName
        let file = await prisma.collaborationFile.findFirst({
            where: {
                collaborationId: id,
                fileUrl: `/api/collaborations/${id}/files/${fileName}`
            }
        })

        // If not found by fileUrl, try by fileName (in case fileName is the actual stored filename)
        if (!file) {
            file = await prisma.collaborationFile.findFirst({
                where: {
                    collaborationId: id,
                    OR: [
                        { fileName: fileName },
                        { fileUrl: { contains: fileName } }
                    ]
                }
            })
        }

        if (!file) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 })
        }

        // Check if file is stored in S3 or locally
        // S3 files have format: /api/collaborations/{id}/files/{s3Key}
        // Old local files have format: /api/collaborations/{id}/files/{uniqueFileName} or /uploads/collaborations/{uniqueFileName}
        const urlParts = file.fileUrl.split('/')
        const storedKey = urlParts[urlParts.length - 1] || fileName

        // Check if this is an S3 key (contains 'collaborations/' prefix pattern)
        const isS3File = storedKey.includes('collaborations/') || !file.fileUrl.startsWith('/uploads/')

        if (isS3File) {
            try {
                // Get presigned URL from S3 (valid for 1 hour)
                const presignedUrl = await getFileUrl(storedKey, 3600)
                
                // Redirect to S3 presigned URL
                return NextResponse.redirect(presignedUrl)
            } catch (fileError: any) {
                console.error('Error getting file from S3:', fileError)
                // Fallback to local file if S3 fails
                if (fileError.message?.includes('S3_BUCKET_NAME') || fileError.message?.includes('not set')) {
                    // S3 not configured, try local file
                    return await tryLocalFile(storedKey, file)
                }
                return NextResponse.json(
                    { 
                        error: 'Error retrieving file from S3',
                        details: fileError.message 
                    },
                    { status: 500 }
                )
            }
        } else {
            // Legacy local file - try to read from local storage
            return await tryLocalFile(storedKey, file)
        }
    } catch (error) {
        console.error('Error serving file:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

async function tryLocalFile(storedFileName: string, file: any) {
    const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
    const uploadDir = isServerless
        ? path.join('/tmp', 'collaborations')
        : path.join(process.cwd(), 'public', 'uploads', 'collaborations')
    const filePath = path.join(uploadDir, storedFileName)

    // Ensure directory exists
    if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true })
    }

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
        console.error('Error reading local file:', fileError)
        if (fileError.code === 'ENOENT') {
            return NextResponse.json(
                { 
                    error: 'File not found on server',
                    details: 'The file may have been deleted or migrated to S3 storage.'
                },
                { status: 404 }
            )
        }
        return NextResponse.json(
            { 
                error: 'Error reading file',
                details: fileError.message 
            },
            { status: 500 }
        )
    }
}

// DELETE /api/collaborations/[id]/files/[fileId] - Delete a file by database ID
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; fileName: string }> }
) {
    try {
        const session = await auth()
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id, fileName } = await params

        // Check if file exists and user has permission
        // fileName could be either a fileId (database ID) or fileName (actual file name)
        // Try to find by ID first (cuid format), then by fileName
        const file = await prisma.collaborationFile.findFirst({
            where: {
                OR: [
                    { id: fileName, collaborationId: id }, // Try as fileId
                    { fileName: fileName, collaborationId: id } // Try as fileName
                ]
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
                    collaborationId: id,
                    userId: session.user.id,
                    OR: [
                        { role: 'OWNER' },
                        { role: 'ADMIN' },
                        { canDelete: true }
                    ]
                }
            })

            if (!member) {
                return NextResponse.json({ error: 'No permission to delete this file' }, { status: 403 })
            }
        }

        // Delete the file record
        await prisma.collaborationFile.delete({
            where: { id: file.id }
        })

        return NextResponse.json({ message: 'File deleted successfully' })
    } catch (error) {
        console.error('Error deleting file:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
