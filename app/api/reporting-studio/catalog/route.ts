import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { createCatalogEntry, searchCatalog, filterCatalogByType, getCatalogStatistics } from '@/lib/reporting-studio/data-catalog'

/**
 * GET /api/reporting-studio/catalog
 * Get unified data catalog (files, database tables, datasets)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')
    const type = searchParams.get('type') // file, database_table, query, virtual
    const sourceType = searchParams.get('sourceType') // FILE, DATABASE, API, CLOUD

    // Fetch files
    const files = await prisma.reportingFile.findMany({
      where: {
        tenantId: user.tenantId,
      },
      select: {
        id: true,
        name: true,
        originalName: true,
        type: true,
        rowCount: true,
        columnCount: true,
        uploadedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Fetch database data sources and their tables
    const dataSources = await prisma.reportingDataSource.findMany({
      where: {
        tenantId: user.tenantId,
        type: 'DATABASE',
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        type: true,
        provider: true,
      },
    })

    // Fetch datasets
    const datasets = await prisma.reportingDataset.findMany({
      where: {
        tenantId: user.tenantId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        rowCount: true,
        lastRefreshedAt: true,
        createdAt: true,
        updatedAt: true,
        dataSource: {
          select: {
            id: true,
            name: true,
            type: true,
            provider: true,
          },
        },
      },
    })

    // Build catalog entries
    const catalogEntries: any[] = []

    // Add files
    files.forEach((file) => {
      catalogEntries.push(createCatalogEntry({
        ...file,
        type: 'FILE',
        lastRefreshedAt: file.uploadedAt,
      }, 'file'))
    })

    // Add datasets (they can be query-based, merged, or transformation-based)
    datasets.forEach((dataset) => {
      let entryType: 'file' | 'database_table' | 'query' | 'virtual' = 'file'
      if (dataset.type === 'QUERY') {
        entryType = 'query'
      } else if (dataset.type === 'TRANSFORMATION' || dataset.type === 'MERGED') {
        entryType = 'virtual'
      }
      
      catalogEntries.push(createCatalogEntry({
        ...dataset,
        sourceType: dataset.dataSource?.type || 'FILE',
        provider: dataset.dataSource?.provider,
      }, entryType))
    })

    // Add database tables (simplified - in production, you'd fetch actual table list)
    // For now, we'll just note that tables are available through data sources
    dataSources.forEach((ds) => {
      catalogEntries.push(createCatalogEntry({
        id: `db_${ds.id}`,
        name: `${ds.name} (Tables)`,
        type: 'DATABASE',
        provider: ds.provider,
        description: `Database tables from ${ds.name}`,
      }, 'database_table'))
    })

    // Apply filters
    let filteredEntries = catalogEntries

    if (type) {
      const types = type.split(',').map(t => t.trim()) as any[]
      filteredEntries = filterCatalogByType(filteredEntries, types)
    }

    if (search) {
      filteredEntries = searchCatalog(filteredEntries, search)
    }

    // Get statistics
    const statistics = getCatalogStatistics(filteredEntries)

    return NextResponse.json({
      entries: filteredEntries,
      statistics,
      total: filteredEntries.length,
    })
  } catch (error: any) {
    console.error('Error fetching catalog:', error)
    return NextResponse.json(
      { error: 'Failed to fetch catalog', details: error.message },
      { status: 500 }
    )
  }
}

