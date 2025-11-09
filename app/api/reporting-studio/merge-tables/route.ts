import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { readFile } from 'fs/promises'
import * as XLSX from 'xlsx'
import { parse } from 'csv-parse/sync'

interface JoinConfig {
    leftTable: string
    leftTableName?: string // User-friendly name for column prefixes
    rightTable: string
    rightTableName?: string // User-friendly name for column prefixes
    joinType: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL'
    leftKey: string
    rightKey: string
    selectedColumns?: {
        left: string[]
        right: string[]
    }
}

async function fetchTableData(tableId: string, tenantId: string, limit: number): Promise<any[]> {
    // Check if it's a database table or uploaded file
    // Uploaded files have IDs that are cuid (start with 'c' and are longer than typical table names)
    // Database tables are short lowercase names like 'user', 'project', 'task'
    const isDatabaseTable = tableId.length < 20 && !tableId.startsWith('c') && !/[A-Z]/.test(tableId)
    
    if (isDatabaseTable) {
        // It's a database table
        const model = (prisma as any)[tableId]
        
        if (!model || typeof model.findMany !== 'function') {
            throw new Error(`Table ${tableId} not found`)
        }

        const data = await model.findMany({
            where: { tenantId },
            take: limit,
        })

        return data
    } else {
        // It's an uploaded file - fetch from ReportingFile
        const file = await prisma.reportingFile.findUnique({
            where: { id: tableId }
        })

        if (!file) {
            throw new Error(`File ${tableId} not found`)
        }

        // Read and parse the file
        const fileBuffer = await readFile(file.filePath)
        let data: any[] = []

        if (file.type.includes('csv')) {
            const csvContent = fileBuffer.toString('utf-8')
            const records = parse(csvContent, {
                columns: true,
                skip_empty_lines: true,
                trim: true,
            })
            data = records.slice(0, limit)
        } else if (file.type.includes('excel') || file.type.includes('spreadsheet')) {
            const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
            const sheetName = workbook.SheetNames[0]
            const worksheet = workbook.Sheets[sheetName]
            const jsonData = XLSX.utils.sheet_to_json(worksheet)
            data = jsonData.slice(0, limit)
        }

        return data
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const tenantId = session.user.tenantId
        const body = await request.json()
        const { joins, limit = 100 } = body as { joins: JoinConfig[], limit?: number }

        if (!joins || joins.length === 0) {
            return NextResponse.json(
                { error: 'At least one join configuration is required' },
                { status: 400 }
            )
        }

        // Fetch data for the first join
        const firstJoin = joins[0]
        const leftData = await fetchTableData(firstJoin.leftTable, tenantId, limit)
        const rightData = await fetchTableData(firstJoin.rightTable, tenantId, limit)

        if (!leftData || leftData.length === 0) {
            return NextResponse.json({
                columns: [],
                rows: [],
                rowCount: 0,
                message: `No data in ${firstJoin.leftTable}`,
            })
        }

        // Perform the join in JavaScript
        let mergedData = performJoin(
            leftData,
            rightData,
            firstJoin.joinType,
            firstJoin.leftKey,
            firstJoin.rightKey,
            firstJoin.leftTableName || firstJoin.leftTable,
            firstJoin.rightTableName || firstJoin.rightTable,
            firstJoin.selectedColumns
        )

        // Handle multiple joins sequentially
        for (let i = 1; i < joins.length; i++) {
            const join = joins[i]
            const nextData = await fetchTableData(join.rightTable, tenantId, limit)

            mergedData = performJoin(
                mergedData,
                nextData,
                join.joinType,
                join.leftKey,
                join.rightKey,
                'merged',
                join.rightTableName || join.rightTable,
                join.selectedColumns
            )
        }

        if (mergedData.length === 0) {
            return NextResponse.json({
                columns: [],
                rows: [],
                rowCount: 0,
                message: 'No matching records found after join',
            })
        }

        // Extract columns and convert to row format
        const columns = Object.keys(mergedData[0])
        const rows = mergedData.map((record: any) => {
            return columns.map(col => {
                const value = record[col]
                
                if (value instanceof Date) {
                    return value.toISOString()
                }
                if (value === null || value === undefined) {
                    return ''
                }
                if (typeof value === 'object') {
                    return JSON.stringify(value)
                }
                return value
            })
        })

        return NextResponse.json({
            columns,
            rows,
            rowCount: mergedData.length,
            totalLeft: leftData.length,
            totalRight: rightData.length,
        })
    } catch (error) {
        console.error('Error merging tables:', error)
        return NextResponse.json(
            { error: 'Failed to merge tables', details: (error as Error).message },
            { status: 500 }
        )
    }
}

function performJoin(
    leftData: any[],
    rightData: any[],
    joinType: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL',
    leftKey: string,
    rightKey: string,
    leftTableName: string,
    rightTableName: string,
    selectedColumns?: { left: string[], right: string[] }
): any[] {
    const result: any[] = []
    const rightIndex = new Map<any, any[]>()

    // Index right data for faster lookup
    rightData.forEach(rightRow => {
        const key = rightRow[rightKey]
        if (!rightIndex.has(key)) {
            rightIndex.set(key, [])
        }
        rightIndex.get(key)!.push(rightRow)
    })

    // Track which right rows were matched (for FULL join)
    const matchedRightRows = new Set<any>()

    // Process left rows
    leftData.forEach(leftRow => {
        const key = leftRow[leftKey]
        const matchingRightRows = rightIndex.get(key) || []

        if (matchingRightRows.length > 0) {
            // Match found
            matchingRightRows.forEach(rightRow => {
                matchedRightRows.add(rightRow)
                result.push(mergeRows(
                    leftRow,
                    rightRow,
                    leftTableName,
                    rightTableName,
                    selectedColumns
                ))
            })
        } else if (joinType === 'LEFT' || joinType === 'FULL') {
            // No match, but LEFT/FULL join includes left row
            result.push(mergeRows(
                leftRow,
                null,
                leftTableName,
                rightTableName,
                selectedColumns
            ))
        }
    })

    // For RIGHT or FULL join, add unmatched right rows
    if (joinType === 'RIGHT' || joinType === 'FULL') {
        rightData.forEach(rightRow => {
            if (!matchedRightRows.has(rightRow)) {
                result.push(mergeRows(
                    null,
                    rightRow,
                    leftTableName,
                    rightTableName,
                    selectedColumns
                ))
            }
        })
    }

    return result
}

function mergeRows(
    leftRow: any | null,
    rightRow: any | null,
    leftTableName: string,
    rightTableName: string,
    selectedColumns?: { left: string[], right: string[] }
): any {
    const merged: any = {}

    // Add left columns WITHOUT prefix
    if (leftRow) {
        const leftCols = selectedColumns?.left || Object.keys(leftRow)
        leftCols.forEach(col => {
            if (leftRow[col] !== undefined) {
                // If column exists in merged already (duplicate name), add table prefix only then
                const finalColName = merged[col] !== undefined ? `${leftTableName}_${col}` : col
                merged[finalColName] = leftRow[col]
            }
        })
    } else if (rightRow) {
        // For RIGHT join, add null values for left columns
        const sampleLeftCols = selectedColumns?.left || []
        sampleLeftCols.forEach(col => {
            const finalColName = merged[col] !== undefined ? `${leftTableName}_${col}` : col
            merged[finalColName] = null
        })
    }

    // Add right columns WITHOUT prefix
    if (rightRow) {
        const rightCols = selectedColumns?.right || Object.keys(rightRow)
        rightCols.forEach(col => {
            if (rightRow[col] !== undefined) {
                // If column exists in merged already (duplicate name), add table prefix only then
                const finalColName = merged[col] !== undefined ? `${rightTableName}_${col}` : col
                merged[finalColName] = rightRow[col]
            }
        })
    } else if (leftRow) {
        // For LEFT join, add null values for right columns
        const sampleRightCols = selectedColumns?.right || []
        sampleRightCols.forEach(col => {
            const finalColName = merged[col] !== undefined ? `${rightTableName}_${col}` : col
            merged[finalColName] = null
        })
    }

    return merged
}

