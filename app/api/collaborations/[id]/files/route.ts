import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { writeFile } from 'fs/promises'
import path from 'path'

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
        const fileExtension = path.extname(file.name)
        const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${fileExtension}`
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'collaborations')
        const filePath = path.join(uploadDir, uniqueFileName)

        // Ensure the upload directory exists
        await require('fs/promises').mkdir(uploadDir, { recursive: true })

        await writeFile(filePath, buffer)

        const collaborationFile = await prisma.collaborationFile.create({
            data: {
                collaborationId: id,
                userId: session.user.id,
                fileName: file.name,
                fileUrl: `/uploads/collaborations/${uniqueFileName}`,
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

// DELETE /api/collaborations/[id]/files/[fileId] - Delete a file
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const { searchParams } = new URL(req.url)
        const fileId = searchParams.get('fileId')

        if (!fileId) {
            return NextResponse.json({ error: 'File ID is required' }, { status: 400 })
        }

        // Check if user uploaded the file or has delete permissions
        const file = await prisma.collaborationFile.findFirst({
            where: {
                id: fileId,
                collaborationId: id
            }
        })

        if (!file) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 })
        }

        if (file.userId !== session.user.id) {
            // Check if user has admin/owner role
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

        await prisma.collaborationFile.delete({
            where: { id: fileId }
        })

        // Optionally delete the physical file
        // const fs = require('fs')
        // try {
        //     fs.unlinkSync(path.join(process.cwd(), 'public', file.fileUrl))
        // } catch (err) {
        //     console.error('Error deleting physical file:', err)
        // }

        return NextResponse.json({ message: 'File deleted successfully' })
    } catch (error) {
        console.error('Error deleting file:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

