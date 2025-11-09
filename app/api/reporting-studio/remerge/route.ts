import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import * as XLSX from 'xlsx'

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'reporting-studio')

export async function POST(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { fileId } = body

        if (!fileId) {
            return NextResponse.json({ error: 'File ID is required' }, { status: 400 })
        }

        // Get the merged file
        const mergedFile = await prisma.reportingFile.findUnique({
            where: { id: fileId }
        })

        if (!mergedFile || !mergedFile.isMerged || !mergedFile.mergeConfig) {
            return NextResponse.json({ error: 'File not found or is not a merged file' }, { status: 404 })
        }

        // Re-execute the merge using the stored configuration
        const mergeConfig = mergedFile.mergeConfig as any
        
        const mergeResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/reporting-studio/merge-tables`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Cookie': request.headers.get('cookie') || ''
            },
            body: JSON.stringify(mergeConfig)
        })

        if (!mergeResponse.ok) {
            throw new Error('Failed to re-merge tables')
        }

        const mergedData = await mergeResponse.json()

        // Update the file with new data
        const worksheet = XLSX.utils.aoa_to_sheet([
            mergedData.columns,
            ...mergedData.rows
        ])

        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Merged Data')

        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
        await writeFile(mergedFile.filePath, buffer)

        // Update metadata
        const fs = await import('fs/promises')
        const stats = await fs.stat(mergedFile.filePath)

        await prisma.reportingFile.update({
            where: { id: fileId },
            data: {
                size: stats.size,
                rowCount: mergedData.rowCount,
                columnCount: mergedData.columns.length,
                updatedAt: new Date(),
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Merged file updated successfully'
        })
    } catch (error) {
        console.error('Error re-merging file:', error)
        return NextResponse.json(
            { error: 'Failed to re-merge file', details: (error as Error).message },
            { status: 500 }
        )
    }
}

