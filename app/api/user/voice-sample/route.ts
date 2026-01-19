import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const VOICE_SAMPLES_DIR = join(process.cwd(), 'public', 'voice-samples')

// Ensure directory exists
async function ensureVoiceSamplesDir() {
  if (!existsSync(VOICE_SAMPLES_DIR)) {
    await mkdir(VOICE_SAMPLES_DIR, { recursive: true })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await ensureVoiceSamplesDir()

    const formData = await req.formData()
    const audioFile = formData.get('audio') as File

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    // Validate file type
    if (!audioFile.type.startsWith('audio/')) {
      return NextResponse.json({ error: 'Invalid file type. Only audio files are allowed.' }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const userId = session.user.id
    const fileExtension = audioFile.name.split('.').pop() || 'webm'
    const filename = `${userId}-${timestamp}.${fileExtension}`
    const filePath = join(VOICE_SAMPLES_DIR, filename)

    // Convert File to Buffer
    const bytes = await audioFile.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Save file
    await writeFile(filePath, buffer)

    // Generate URL
    const voiceSampleUrl = `/voice-samples/${filename}`

    // Update user record
    await prisma.user.update({
      where: { id: userId },
      data: { voiceSampleUrl },
    })

    return NextResponse.json({ voiceSampleUrl })
  } catch (error) {
    console.error('Error uploading voice sample:', error)
    return NextResponse.json(
      { error: 'Failed to upload voice sample' },
      { status: 500 }
    )
  }
}

