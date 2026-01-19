import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { PrismaClient } from '@prisma/client'

// GET: Get data source schema (table/field metadata)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const dataSource = await prisma.dataSource.findUnique({
      where: { id },
    })

    if (!dataSource) {
      return NextResponse.json({ error: 'Data source not found' }, { status: 404 })
    }

    // If schema is cached, return it
    if (dataSource.schema) {
      return NextResponse.json({ schema: dataSource.schema })
    }

    // Otherwise, discover schema from Prisma models
    if (dataSource.type === 'DATABASE_TABLE') {
      const connection = dataSource.connection as any
      const tableName = connection.tableName

      if (tableName) {
        // Try to get schema from Prisma
        const prismaClient = prisma as any
        const model = prismaClient[tableName]

        if (model) {
          // Get fields from Prisma schema
          // This is a simplified version - in production, you'd parse the Prisma schema
          const schema = {
            tableName,
            fields: [], // Would be populated from Prisma schema
            // For now, return empty - will be implemented with schema parser
          }

          // Cache the schema
          await prisma.dataSource.update({
            where: { id },
            data: { schema: schema as any },
          })

          return NextResponse.json({ schema })
        }
      }
    }

    return NextResponse.json({ schema: dataSource.schema || null })
  } catch (error: any) {
    console.error('Error fetching data source schema:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schema', details: error.message },
      { status: 500 }
    )
  }
}
