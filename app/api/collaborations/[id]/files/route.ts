import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { uploadFile, generateS3Key } from '@/lib/storage/s3-storage'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

// GET /api/collaborations/[id]/files - Get all files
export async function GET(
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

        const files = await prisma.collaborationFile.findMany({
            where: {
                collaborationId: id
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
                uploadedAt: 'desc'
            }
        })

        return NextResponse.json({ files })
    } catch (error) {
        console.error('Error fetching files:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/collaborations/[id]/files - Upload a file
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

        const formData = await req.formData()
        const file = formData.get('file') as File
        const description = formData.get('description') as string

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit` },
                { status: 400 }
            )
        }

        const buffer = Buffer.from(await file.arrayBuffer())
        
        // Upload to S3
        const s3Key = generateS3Key('collaborations', file.name)
        await uploadFile(s3Key, buffer, file.type, {
            collaborationId: id,
            uploadedBy: session.user.id,
            originalFileName: file.name
        })

        // Store S3 key in fileUrl for retrieval
        const fileUrl = `/api/collaborations/${id}/files/${s3Key}`

        const collaborationFile = await prisma.collaborationFile.create({
            data: {
                collaborationId: id,
                userId: session.user.id,
                fileName: file.name,
                fileUrl: fileUrl,
                fileSize: file.size,
                fileType: file.type,
                description: description || null
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

        return NextResponse.json({ file: collaborationFile }, { status: 201 })
    } catch (error) {
        console.error('Error uploading file:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}


