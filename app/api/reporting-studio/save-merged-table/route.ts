import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import * as XLSX from 'xlsx'

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'reporting-studio')

async function ensureUploadDir() {
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

        const body = await request.json()
        const { name, data, mergeConfig } = body

        if (!name || !data || !data.columns || !data.rows) {
            return NextResponse.json(
                { error: 'Invalid data: name, columns, and rows are required' },
                { status: 400 }
            )
        }

        // Extract source file IDs from merge config
        const sourceFiles: string[] = []
        if (mergeConfig && mergeConfig.joins) {
            mergeConfig.joins.forEach((join: any) => {
                if (join.leftTable && !sourceFiles.includes(join.leftTable)) {
                    sourceFiles.push(join.leftTable)
                }
                if (join.rightTable && !sourceFiles.includes(join.rightTable)) {
                    sourceFiles.push(join.rightTable)
                }
            })
        }

        // Create a workbook from the merged data
        const worksheet = XLSX.utils.aoa_to_sheet([
            data.columns, // Header row
            ...data.rows  // Data rows
        ])

        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Merged Data')

        // Generate unique filename
        const timestamp = Date.now()
        const safeName = name.replace(/[^a-z0-9_-]/gi, '_')
        const filename = `merged_${safeName}_${timestamp}.xlsx`
        const filePath = join(UPLOAD_DIR, filename)

        // Write the Excel file to buffer first, then to disk
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
        await writeFile(filePath, buffer)

        // Get file size
        const fs = await import('fs/promises')
        const stats = await fs.stat(filePath)

        // Save metadata to database
        const reportingFile = await prisma.reportingFile.create({
            data: {
                name: filename, // Unique filename on disk (with timestamp)
                originalName: name, // User's chosen name (clean, without timestamp)
                filePath: filePath,
                size: stats.size,
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                rowCount: data.rows.length,
                columnCount: data.columns.length,
                uploadedBy: session.user.id,
                tenantId: session.user.tenantId,
                isMerged: true,
                mergeConfig: mergeConfig || null,
                sourceFiles: sourceFiles,
            },
        })

        return NextResponse.json({
            id: reportingFile.id,
            name: reportingFile.originalName, // Return the user's clean name
            rowCount: reportingFile.rowCount,
            columnCount: reportingFile.columnCount,
            message: 'Merged table saved successfully'
        })
    } catch (error) {
        console.error('Error saving merged table:', error)
        return NextResponse.json(
            { error: 'Failed to save merged table', details: (error as Error).message },
            { status: 500 }
        )
    }
}

