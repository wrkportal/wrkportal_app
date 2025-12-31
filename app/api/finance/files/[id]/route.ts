import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET /api/finance/files/[id] - Get file upload status
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const file = await prisma.financialFile.findFirst({
      where: {
        id: params.id,
        tenantId: (session.user as any).tenantId,
      },
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    return NextResponse.json({ file })
  } catch (error: any) {
    console.error('Error fetching file:', error)
    return NextResponse.json(
      { error: 'Failed to fetch file', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE /api/finance/files/[id] - Delete file
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    const userRole = (session.user as any).role
    const allowedRoles = ['FINANCE_CONTROLLER', 'ORG_ADMIN', 'TENANT_SUPER_ADMIN']
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const file = await prisma.financialFile.findFirst({
      where: {
        id: params.id,
        tenantId: (session.user as any).tenantId,
      },
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Delete physical file if exists
    if (file.status === 'COMPLETED' || file.status === 'FAILED') {
      try {
        const fs = await import('fs/promises')
        await fs.unlink(file.filePath)
      } catch (error) {
        // File might not exist, continue with database deletion
        console.warn('Could not delete physical file:', error)
      }
    }

    await prisma.financialFile.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'File deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting file:', error)
    return NextResponse.json(
      { error: 'Failed to delete file', details: error.message },
      { status: 500 }
    )
  }
}

