import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
    request: NextRequest,
    { params }: { params: { tableId: string } }
) {
    try {
        const session = await auth()
        
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const tenantId = session.user.tenantId
        const { tableId } = params

        // Get query parameters
        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get('limit') || '100')

        // Use type assertion to access dynamic model names
        const model = (prisma as any)[tableId]
        
        if (!model || typeof model.findMany !== 'function') {
            return NextResponse.json(
                { error: 'Table not found' },
                { status: 404 }
            )
        }

        // Fetch data from the table (limited to tenant's data)
        const data = await model.findMany({
            where: { tenantId },
            take: limit,
        })

        if (!data || data.length === 0) {
            return NextResponse.json({
                columns: [],
                rows: [],
                rowCount: 0,
            })
        }

        // Extract column names from the first record
        const columns = Object.keys(data[0])

        // Convert data to rows format
        const rows = data.map((record: any) => {
            return columns.map(col => {
                const value = record[col]
                
                // Format dates
                if (value instanceof Date) {
                    return value.toISOString()
                }
                
                // Handle null/undefined
                if (value === null || value === undefined) {
                    return ''
                }
                
                // Handle objects (convert to JSON string)
                if (typeof value === 'object') {
                    return JSON.stringify(value)
                }
                
                return value
            })
        })

        // Get total count
        const totalCount = await model.count({
            where: { tenantId }
        })

        return NextResponse.json({
            columns,
            rows,
            rowCount: totalCount,
        })
    } catch (error) {
        console.error('Error fetching table data:', error)
        return NextResponse.json(
            { error: 'Failed to fetch table data' },
            { status: 500 }
        )
    }
}

