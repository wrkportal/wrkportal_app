import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { TestConnectionRequest } from '@/types/reporting-studio'
import { decryptJSON } from '@/lib/reporting-studio/encryption'
import { testDatabaseConnection } from '@/lib/reporting-studio/database-connections'

/**
 * POST /api/reporting-studio/data-sources/[id]/test
 * Test a data source connection
 */
export async function POST(
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

    // Find the data source
    const dataSource = await prisma.reportingDataSource.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId,
      },
    })

    if (!dataSource) {
      return NextResponse.json({ error: 'Data source not found' }, { status: 404 })
    }

    // Update status to testing
    await prisma.reportingDataSource.update({
      where: { id: params.id },
      data: {
        status: 'TESTING',
        lastTestedAt: new Date(),
      },
    })

    try {
      // Decrypt connection config
      const connectionConfig = decryptJSON(dataSource.connectionConfig as any)

      // Test the connection
      if (!dataSource.provider) {
        throw new Error('Data source provider is required')
      }

      const testResult = await testDatabaseConnection(
        dataSource.type,
        dataSource.provider,
        connectionConfig as any
      )

      if (testResult.success) {
        // Update status to active
        await prisma.reportingDataSource.update({
          where: { id: params.id },
          data: {
            status: 'ACTIVE',
            lastTestedAt: new Date(),
            lastError: null,
          },
        })

        return NextResponse.json({
          success: true,
          message: testResult.message || 'Connection successful',
          testedAt: new Date(),
          latency: testResult.latency,
        })
      } else {
        throw new Error(testResult.message || 'Connection test failed')
      }
    } catch (error: any) {
      // Update status to error
      await prisma.reportingDataSource.update({
        where: { id: params.id },
        data: {
          status: 'ERROR',
          lastError: error.message,
        },
      })

      return NextResponse.json(
        {
          success: false,
          error: 'Connection failed',
          message: error.message,
        },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Error testing data source connection:', error)
    return NextResponse.json(
      { error: 'Failed to test connection', details: error.message },
      { status: 500 }
    )
  }
}

