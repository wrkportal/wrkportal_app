import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { put } from '@vercel/blob'
import { parseFile } from '@/lib/reporting-studio/file-parser'
import { detectSchema } from '@/lib/reporting-studio/schema-detector'
import { validateFileUpload } from '@/lib/reporting-studio/validators'
import crypto from 'crypto'

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'reporting-studio')
const isDevelopment = process.env.NODE_ENV === 'development'

// Ensure upload directory exists (development only)
async function ensureUploadDir() {
  if (!isDevelopment) return // Skip in production
  try {
    await mkdir(UPLOAD_DIR, { recursive: true })
  } catch (error) {
    // Directory might already exist
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await ensureUploadDir()

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

    // Generate unique filename
    const timestamp = Date.now()
    const randomHash = crypto.randomBytes(8).toString('hex')
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const uniqueName = `${timestamp}-${randomHash}-${sanitizedName}`
    
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()

    // Read file content
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    let filePath: string
    let blobUrl: string | null = null

    // Save file based on environment
    if (isDevelopment) {
      // Development: Save to local filesystem
      filePath = join(UPLOAD_DIR, uniqueName)
      await writeFile(filePath, buffer)
    } else {
      // Production: Save to Vercel Blob Storage
      const blob = await put(uniqueName, buffer, {
        access: 'public',
        contentType: file.type || 'application/octet-stream',
      })
      blobUrl = blob.url
      filePath = blob.url // Store the blob URL as filePath
    }

    // Parse file to get metadata and schema (limit rows for faster processing)
    let rowCount = 0
    let columnCount = 0
    let detectedSchema = null

    try {
      const parsedData = await parseFile(buffer, file.name, {
        limit: 1000, // Parse first 1000 rows for metadata
        detectSchema: true,
      })
      
      rowCount = parsedData.rowCount
      columnCount = parsedData.columnCount
      
      // Detect schema for better metadata
      detectedSchema = detectSchema(parsedData)
    } catch (parseError: any) {
      console.error('Error parsing file:', parseError)
      // Continue with upload even if parsing fails
    }

    // Get tenant ID
    const tenantId = (session.user as any).tenantId

    // Save file metadata to database
    const uploadedFile = await prisma.reportingFile.create({
      data: {
        name: uniqueName,
        originalName: file.name,
        filePath: filePath,
        size: file.size,
        type: file.type,
        rowCount: rowCount || null,
        columnCount: columnCount || null,
        uploadedBy: session.user.id,
        tenantId: tenantId,
      },
    })

    // Log activity (only if ReportingActivity model exists)
    try {
      await prisma.reportingActivity.create({
        data: {
          tenantId: tenantId,
          userId: session.user.id,
          entityType: 'DATASOURCE',
          entityId: uploadedFile.id,
          action: 'CREATE',
          details: {
            type: 'file_upload',
            fileName: file.name,
            fileSize: file.size,
            rowCount: rowCount,
            columnCount: columnCount,
          },
        },
      })
    } catch (activityError) {
      // Activity logging is not critical, continue even if it fails
      console.error('Error logging activity:', activityError)
    }

    return NextResponse.json({
      message: 'File uploaded successfully',
      file: uploadedFile,
      schema: detectedSchema,
    }, { status: 201 })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

