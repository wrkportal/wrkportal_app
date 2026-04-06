import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { UserRole } from '@/types'
import { uploadFile, generateS3Key, getFileUrl } from '@/lib/storage/s3-storage'

// POST /api/upload/video - Upload video file to S3
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== UserRole.TENANT_SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'Only super admins can upload videos' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('video') as File

    if (!file) {
      return NextResponse.json({ error: 'No video file provided' }, { status: 400 })
    }

    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: MP4, WebM, OGG, MOV' },
        { status: 400 }
      )
    }

    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size: 100MB' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const s3Key = generateS3Key('videos', file.name)

    await uploadFile(s3Key, buffer, file.type, {
      uploadedBy: session.user.id || 'unknown',
      originalName: file.name,
    })

    const fileUrl = await getFileUrl(s3Key, 86400) // 24-hour presigned URL

    return NextResponse.json({
      success: true,
      fileUrl,
      s3Key,
      fileName: file.name,
      fileSize: file.size,
    })
  } catch (error) {
    console.error('Error uploading video:', error)
    return NextResponse.json({ error: 'Failed to upload video' }, { status: 500 })
  }
}
