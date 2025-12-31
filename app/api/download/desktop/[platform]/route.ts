import { NextRequest, NextResponse } from 'next/server'
import { readFile, stat } from 'fs/promises'
import { join } from 'path'

const DOWNLOADS_DIR = join(process.cwd(), 'public', 'downloads')

const PLATFORM_FILES: Record<string, string> = {
  windows: 'Project-Management-Studio-Setup.exe',
  mac: 'Project-Management-Studio.dmg',
  linux: 'Project-Management-Studio.AppImage'
}

const MIME_TYPES: Record<string, string> = {
  '.exe': 'application/x-msdownload',
  '.dmg': 'application/x-apple-diskimage',
  '.appimage': 'application/x-executable'
}

export async function GET(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  try {
    const platform = params.platform.toLowerCase()
    const fileName = PLATFORM_FILES[platform]

    if (!fileName) {
      return NextResponse.json(
        { error: 'Invalid platform' },
        { status: 400 }
      )
    }

    const filePath = join(DOWNLOADS_DIR, fileName)

    // Check if file exists
    try {
      const fileStats = await stat(filePath)
      
      // Read the file
      const fileBuffer = await readFile(filePath)
      
      // Get file extension for MIME type
      const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase()
      const contentType = MIME_TYPES[ext] || 'application/octet-stream'

      // Return file with proper headers
      // Use 'application/octet-stream' to force download and prevent browser from trying to open it
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/octet-stream', // Force download, don't let browser interpret
          'Content-Disposition': `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
          'Content-Length': fileStats.size.toString(),
          'X-Content-Type-Options': 'nosniff', // Prevent MIME type sniffing
          'Content-Security-Policy': "default-src 'none'", // Minimal CSP for downloads
          'Cache-Control': 'no-cache, no-store, must-revalidate', // Don't cache installers
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      })
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return NextResponse.json(
          { error: 'Installer not found. Please build the desktop app first.' },
          { status: 404 }
        )
      }
      throw error
    }
  } catch (error: any) {
    console.error('Error serving download:', error)
    return NextResponse.json(
      { error: 'Failed to serve download', details: error.message },
      { status: 500 }
    )
  }
}

