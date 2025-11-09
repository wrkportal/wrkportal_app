import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, readFile, unlink } from 'fs/promises'
import { join } from 'path'
import * as XLSX from 'xlsx'
import { parse } from 'csv-parse/sync'

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'reporting-studio')

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const fileId = params.id

        // Get the existing file
        const existingFile = await prisma.reportingFile.findUnique({
            where: { id: fileId }
        })

        if (!existingFile) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 })
        }

        if (existingFile.uploadedBy !== session.user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        // Parse the uploaded file
        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        // Read and parse the new file to get its headers
        const fileBuffer = Buffer.from(await file.arrayBuffer())
        let newColumns: string[] = []
        let newRows: any[] = []

        if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
            const csvContent = fileBuffer.toString('utf-8')
            const records = parse(csvContent, {
                columns: true,
                skip_empty_lines: true,
                trim: true,
            })
            newRows = records
            if (records.length > 0) {
                newColumns = Object.keys(records[0])
            }
        } else if (file.type.includes('spreadsheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
            const sheetName = workbook.SheetNames[0]
            const worksheet = workbook.Sheets[sheetName]
            const jsonData = XLSX.utils.sheet_to_json(worksheet)
            newRows = jsonData
            if (jsonData.length > 0) {
                newColumns = Object.keys(jsonData[0])
            }
        } else {
            return NextResponse.json(
                { error: 'Unsupported file type. Please upload CSV or Excel files.' },
                { status: 400 }
            )
        }

        // Read the old file to get its headers
        const oldFileBuffer = await readFile(existingFile.filePath)
        let oldColumns: string[] = []

        if (existingFile.type.includes('csv')) {
            const csvContent = oldFileBuffer.toString('utf-8')
            const records = parse(csvContent, {
                columns: true,
                skip_empty_lines: true,
                trim: true,
            })
            if (records.length > 0) {
                oldColumns = Object.keys(records[0])
            }
        } else if (existingFile.type.includes('excel') || existingFile.type.includes('spreadsheet')) {
            const workbook = XLSX.read(oldFileBuffer, { type: 'buffer' })
            const sheetName = workbook.SheetNames[0]
            const worksheet = workbook.Sheets[sheetName]
            const jsonData = XLSX.utils.sheet_to_json(worksheet)
            if (jsonData.length > 0) {
                oldColumns = Object.keys(jsonData[0])
            }
        }

        // Validate headers match
        const oldColumnsSet = new Set(oldColumns)
        const newColumnsSet = new Set(newColumns)

        if (oldColumns.length !== newColumns.length || 
            !oldColumns.every(col => newColumnsSet.has(col))) {
            return NextResponse.json({
                error: 'Header mismatch',
                message: 'The new file headers do not match the original file headers',
                oldHeaders: oldColumns,
                newHeaders: newColumns
            }, { status: 400 })
        }

        // Delete the old file
        try {
            await unlink(existingFile.filePath)
        } catch (err) {
            console.error('Error deleting old file:', err)
            // Continue anyway
        }

        // Write the new file
        await writeFile(existingFile.filePath, fileBuffer)

        // Update the database record
        const updatedFile = await prisma.reportingFile.update({
            where: { id: fileId },
            data: {
                size: file.size,
                rowCount: newRows.length,
                columnCount: newColumns.length,
                updatedAt: new Date(),
            }
        })

        // Find all merged files that depend on this file
        const dependentFiles = await prisma.reportingFile.findMany({
            where: {
                tenantId: session.user.tenantId,
                isMerged: true,
                sourceFiles: {
                    has: fileId
                }
            }
        })

        // Trigger re-merge for dependent files
        const remergeTasks = []
        for (const dependentFile of dependentFiles) {
            if (dependentFile.mergeConfig) {
                remergeTasks.push({
                    id: dependentFile.id,
                    name: dependentFile.originalName,
                    config: dependentFile.mergeConfig
                })
            }
        }

        return NextResponse.json({
            success: true,
            file: {
                id: updatedFile.id,
                name: updatedFile.originalName,
                rowCount: updatedFile.rowCount,
                columnCount: updatedFile.columnCount,
            },
            dependentFiles: remergeTasks,
            message: 'File updated successfully'
        })
    } catch (error) {
        console.error('Error updating file:', error)
        return NextResponse.json(
            { error: 'Failed to update file', details: (error as Error).message },
            { status: 500 }
        )
    }
}

