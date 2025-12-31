import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { parseFile, getFileMetadata } from '@/lib/reporting-studio/file-parser'
import { detectSchema } from '@/lib/reporting-studio/schema-detector'
import { validateFileUpload } from '@/lib/reporting-studio/validators'
import { REPORTING_STUDIO_CONFIG } from '@/lib/reporting-studio/constants'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { put } from '@vercel/blob'
import crypto from 'crypto'

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'reporting-studio')
const isDevelopment = process.env.NODE_ENV === 'development'

/**
 * POST /api/reporting-studio/files/upload-enhanced
 * Enhanced file upload with schema detection and better parsing
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Ensure upload directory exists (development only)
    if (isDevelopment) {
      try {
        await mkdir(UPLOAD_DIR, { recursive: true })
      } catch (error) {
        // Directory might already exist
      }
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file
    const validation = validateFileUpload(file)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Read file content
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename
    const timestamp = Date.now()
    const randomHash = crypto.randomBytes(8).toString('hex')
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const uniqueName = `${timestamp}-${randomHash}-${sanitizedName}`

    // Save file
    let filePath: string
    if (isDevelopment) {
      filePath = join(UPLOAD_DIR, uniqueName)
      await writeFile(filePath, buffer)
    } else {
      // Production: Save to Vercel Blob Storage
      const blob = await put(uniqueName, buffer, {
        access: 'public',
        contentType: file.type || 'application/octet-stream',
      })
      filePath = blob.url
    }

    // Parse file with schema detection (limit rows for preview)
    const parsedData = await parseFile(buffer, file.name, {
      limit: 1000, // Parse first 1000 rows for schema detection
      detectSchema: true,
    })

    // Detect schema
    const detectedSchema = detectSchema(parsedData)

    // Save file metadata to database
    const uploadedFile = await prisma.reportingFile.create({
      data: {
        name: uniqueName,
        originalName: file.name,
        filePath: filePath,
        size: file.size,
        type: file.type || file.name.split('.').pop() || 'unknown',
        rowCount: parsedData.rowCount,
        columnCount: parsedData.columnCount,
        uploadedBy: user.id,
        tenantId: user.tenantId,
      },
    })

    // Log activity
    await prisma.reportingActivity.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        entityType: 'DATASOURCE',
        entityId: uploadedFile.id,
        action: 'CREATE',
        details: {
          type: 'file_upload',
          fileName: file.name,
          fileSize: file.size,
          rowCount: parsedData.rowCount,
          columnCount: parsedData.columnCount,
        },
      },
    })

    return NextResponse.json({
      message: 'File uploaded successfully',
      file: uploadedFile,
      schema: detectedSchema,
      preview: {
        rows: parsedData.sampleData,
        columns: parsedData.columns,
      },
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file', details: error.message },
      { status: 500 }
    )
  }
}

