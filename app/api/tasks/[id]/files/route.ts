import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

// GET /api/tasks/[id]/files - Get all files for a task
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

        // Verify task exists and user has access
        const task = await prisma.task.findFirst({
            where: {
                id,
                tenantId: session.user.tenantId,
                deletedAt: null,
            },
        })

        if (!task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 })
        }

        // Extract file metadata from task tags
        const files: any[] = []
        if (Array.isArray(task.tags)) {
            for (const tag of task.tags) {
                if (typeof tag === 'string' && tag.startsWith('file:')) {
                    try {
                        const fileMetadata = JSON.parse(tag.substring(5)) // Remove 'file:' prefix
                        files.push(fileMetadata)
                    } catch (error) {
                        // Skip invalid file metadata
                        console.error('Error parsing file metadata:', error)
                    }
                }
            }
        }

        // Sort files by upload date (newest first)
        files.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())

        return NextResponse.json({ files }, { status: 200 })
    } catch (error) {
        console.error('Error fetching task files:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// POST /api/tasks/[id]/files - Upload a file to a task
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

        // Verify task exists and user has access
        const task = await prisma.task.findFirst({
            where: {
                id,
                tenantId: session.user.tenantId,
                deletedAt: null,
            },
        })

        if (!task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 })
        }

        const formData = await req.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit` },
                { status: 400 }
            )
        }

        // Create uploads directory if it doesn't exist
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'tasks')
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true })
        }

        // Generate unique filename
        const timestamp = Date.now()
        const randomHash = Math.random().toString(36).substring(2, 9)
        const fileExtension = file.name.split('.').pop() || ''
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const uniqueFileName = `${timestamp}-${randomHash}-${sanitizedName}`

        // Save file
        const buffer = Buffer.from(await file.arrayBuffer())
        const filePath = join(uploadDir, uniqueFileName)
        await writeFile(filePath, buffer)

        // Store file metadata in task tags (temporary solution until TaskFile model is added)
        const fileUrl = `/uploads/tasks/${uniqueFileName}`
        const fileMetadata = {
            fileName: file.name,
            fileUrl,
            fileSize: file.size,
            fileType: file.type,
            uploadedBy: session.user.id,
            uploadedAt: new Date().toISOString(),
        }

        // Get existing tags
        const existingTags = Array.isArray(task.tags) ? task.tags.filter((tag: any) => typeof tag === 'string' && !tag.startsWith('file:')) : []
        
        // Add file metadata as a tag (JSON stringified)
        const fileTag = `file:${JSON.stringify(fileMetadata)}`
        const updatedTags = [...existingTags, fileTag]

        // Update task with file metadata
        await prisma.task.update({
            where: { id },
            data: {
                tags: updatedTags,
            },
        })

        return NextResponse.json({
            file: {
                id: uniqueFileName,
                fileName: file.name,
                fileUrl,
                fileSize: file.size,
                fileType: file.type,
                uploadedBy: {
                    id: session.user.id,
                    name: session.user.name,
                    firstName: session.user.firstName,
                    lastName: session.user.lastName,
                },
                uploadedAt: new Date().toISOString(),
            },
        }, { status: 201 })
    } catch (error) {
        console.error('Error uploading file:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
