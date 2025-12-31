import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { fetchData } from '@/lib/reporting-studio/data-abstraction'
import { decryptJSON } from '@/lib/reporting-studio/encryption'
import { getDatasetCacheKey, getOrSetCache } from '@/lib/reporting-studio/data-cache'
import { REPORTING_STUDIO_CONFIG } from '@/lib/reporting-studio/constants'

/**
 * GET /api/reporting-studio/datasets/[id]/data
 * Get data from a dataset (with abstraction layer)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Find the dataset
    const dataset = await prisma.reportingDataset.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId,
      },
      include: {
        dataSource: true,
      },
    })

    if (!dataset) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(
      parseInt(searchParams.get('limit') || String(REPORTING_STUDIO_CONFIG.MAX_QUERY_ROWS)),
      REPORTING_STUDIO_CONFIG.MAX_QUERY_ROWS
    )
    const offset = parseInt(searchParams.get('offset') || '0')
    const columns = searchParams.get('columns')?.split(',').filter(Boolean)
    const filtersParam = searchParams.get('filters')
    const orderByParam = searchParams.get('orderBy')

    const options: any = {
      limit,
      offset,
      columns,
    }

    // Parse filters
    if (filtersParam) {
      try {
        options.filters = JSON.parse(filtersParam)
      } catch {
        // Invalid JSON, ignore
      }
    }

    // Parse orderBy
    if (orderByParam) {
      try {
        options.orderBy = JSON.parse(orderByParam)
      } catch {
        // Invalid JSON, ignore
      }
    }

    // Generate cache key
    const cacheKey = getDatasetCacheKey(params.id, options)

    // Fetch data (with caching)
    const result = await getOrSetCache(cacheKey, async () => {
      // Determine data source and fetch accordingly
      if (dataset.dataSource) {
        // Database source
        const connectionConfig = decryptJSON(dataset.dataSource.connectionConfig as any)
        return await fetchData(
          {
            id: dataset.dataSource.id,
            name: dataset.dataSource.name,
            type: dataset.dataSource.type,
            provider: dataset.dataSource.provider || undefined,
          },
          connectionConfig,
          options
        )
      } else if (dataset.fileId) {
        // File source
        const file = await prisma.reportingFile.findUnique({
          where: { id: dataset.fileId },
        })

        if (!file) {
          throw new Error('File not found')
        }

        return await fetchData(
          {
            id: file.id,
            name: file.name,
            type: 'FILE',
          },
          {
            filePath: file.filePath,
            fileName: file.originalName,
            type: file.type,
          },
          options
        )
      } else {
        throw new Error('Dataset has no data source or file')
      }
    }, 5 * 60 * 1000) // Cache for 5 minutes

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error fetching dataset data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dataset data', details: error.message },
      { status: 500 }
    )
  }
}

