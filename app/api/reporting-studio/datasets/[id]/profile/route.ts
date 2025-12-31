import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { fetchData } from '@/lib/reporting-studio/data-abstraction'
import { decryptJSON } from '@/lib/reporting-studio/encryption'
import { profileData, generateQualityReport } from '@/lib/reporting-studio/data-profiler'
import { REPORTING_STUDIO_CONFIG } from '@/lib/reporting-studio/constants'

/**
 * GET /api/reporting-studio/datasets/[id]/profile
 * Generate data profile and quality metrics for a dataset
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
    const sampleSize = Math.min(
      parseInt(searchParams.get('sampleSize') || '10000'),
      REPORTING_STUDIO_CONFIG.MAX_QUERY_ROWS
    )

    // Fetch sample data for profiling
    let dataResult
    if (dataset.dataSource) {
      // Database source
      const connectionConfig = decryptJSON(dataset.dataSource.connectionConfig as any)
      dataResult = await fetchData(
        {
          id: dataset.dataSource.id,
          name: dataset.dataSource.name,
          type: dataset.dataSource.type,
          provider: dataset.dataSource.provider || undefined,
        },
        connectionConfig,
        { limit: sampleSize }
      )
    } else if (dataset.fileId) {
      // File source
      const file = await prisma.reportingFile.findUnique({
        where: { id: dataset.fileId },
      })

      if (!file) {
        throw new Error('File not found')
      }

      dataResult = await fetchData(
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
        { limit: sampleSize }
      )
    } else {
      throw new Error('Dataset has no data source or file')
    }

    // Get schema from dataset or infer from data
    let columns: any[] = []
    if (dataset.schema && typeof dataset.schema === 'object' && 'columns' in dataset.schema) {
      columns = (dataset.schema as any).columns
    } else {
      // Infer columns from data
      if (dataResult.rows.length > 0) {
        columns = dataResult.columns.map((colName) => ({
          columnName: colName,
          dataType: 'string', // Default, would need type detection
          isNullable: true,
          isPrimaryKey: false,
        }))
      }
    }

    // Generate profile
    const profile = profileData(dataResult.rows, columns)

    // Generate quality report
    const report = generateQualityReport(profile)

    return NextResponse.json({
      profile,
      report,
      sampleSize: dataResult.rows.length,
      totalRows: dataResult.totalCount || dataResult.rowCount,
    })
  } catch (error: any) {
    console.error('Error generating data profile:', error)
    return NextResponse.json(
      { error: 'Failed to generate data profile', details: error.message },
      { status: 500 }
    )
  }
}

