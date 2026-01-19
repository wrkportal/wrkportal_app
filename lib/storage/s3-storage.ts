/**
 * AWS S3 Storage Utility
 * 
 * Handles file uploads, downloads, and deletions using AWS S3.
 * All tiers use AWS S3 for file storage.
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = process.env.S3_BUCKET_NAME!

/**
 * Upload a file to S3
 * @param key - S3 object key (path/filename)
 * @param buffer - File buffer
 * @param contentType - MIME type (e.g., 'image/png', 'application/pdf')
 * @param metadata - Optional metadata to store with the object
 * @returns The S3 key of the uploaded file
 */
export async function uploadFile(
  key: string,
  buffer: Buffer,
  contentType: string,
  metadata?: Record<string, string>
): Promise<string> {
  if (!BUCKET_NAME) {
    throw new Error('S3_BUCKET_NAME environment variable is not set')
  }

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    Metadata: metadata,
  })

  await s3Client.send(command)
  return key
}

/**
 * Get a presigned URL for downloading a file from S3
 * @param key - S3 object key
 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns Presigned URL
 */
export async function getFileUrl(key: string, expiresIn: number = 3600): Promise<string> {
  if (!BUCKET_NAME) {
    throw new Error('S3_BUCKET_NAME environment variable is not set')
  }

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  return await getSignedUrl(s3Client, command, { expiresIn })
}

/**
 * Delete a file from S3
 * @param key - S3 object key
 */
export async function deleteFile(key: string): Promise<void> {
  if (!BUCKET_NAME) {
    throw new Error('S3_BUCKET_NAME environment variable is not set')
  }

  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  await s3Client.send(command)
}

/**
 * Check if a file exists in S3
 * @param key - S3 object key
 * @returns True if file exists, false otherwise
 */
export async function fileExists(key: string): Promise<boolean> {
  if (!BUCKET_NAME) {
    throw new Error('S3_BUCKET_NAME environment variable is not set')
  }

  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })
    await s3Client.send(command)
    return true
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return false
    }
    throw error
  }
}

/**
 * Generate a unique S3 key for a file
 * @param prefix - Folder prefix (e.g., 'uploads', 'finance', 'collaborations')
 * @param filename - Original filename
 * @returns Unique S3 key
 */
export function generateS3Key(prefix: string, filename: string): string {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 9)
  const extension = filename.split('.').pop() || ''
  const baseName = filename.replace(/\.[^/.]+$/, '')
  const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_')
  
  return `${prefix}/${timestamp}-${randomString}-${sanitizedBaseName}.${extension}`
}
