import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { unlink, readFile } from 'fs/promises'
import * as XLSX from 'xlsx'
import { parse } from 'csv-parse/sync'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = (session.user as any).tenantId

    // Find the file
    const file = await prisma.reportingFile.findFirst({
      where: {
        id: params.id,
        tenantId: tenantId,
      },
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Read and parse the file
    const buffer = await readFile(file.filePath)
    const fileExt = file.originalName.substring(file.originalName.lastIndexOf('.')).toLowerCase()

    let data: any[] = []

    if (fileExt === '.csv') {
      const content = buffer.toString('utf-8')
      const records = parse(content, { 
        columns: true, 
        skip_empty_lines: true
      })
      data = records
    } else {
      // Excel file
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      data = XLSX.utils.sheet_to_json(firstSheet)
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    console.error('Error loading file data:', error)
    return NextResponse.json(
      { error: 'Failed to load file data' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = (session.user as any).tenantId

    // Find the file
    const file = await prisma.reportingFile.findFirst({
      where: {
        id: params.id,
        tenantId: tenantId,
      },
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Delete physical file
    try {
      await unlink(file.filePath)
    } catch (error) {
      console.error('Error deleting physical file:', error)
      // Continue even if physical file deletion fails
    }

    // Delete from database
    await prisma.reportingFile.delete({
      where: { id: params.id },
    })

    return NextResponse.json(
      { message: 'File deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting file:', error)
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    )
  }
}

