/**
 * Field Mappings API
 * 
 * Manage field mappings for integrations
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getFieldMappings, upsertFieldMapping, deleteFieldMapping } from '@/lib/integrations/field-mapping'

const getSalesIntegration = () => (prisma as any).salesIntegration

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const salesIntegration = getSalesIntegration()
    if (!salesIntegration) {
      return NextResponse.json({ error: 'Integrations are unavailable' }, { status: 503 })
    }

    const integration = await (salesIntegration as any).findUnique({
      where: { id: params.id },
    })

    if (!integration || integration.tenantId !== session.user.tenantId) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
    }

    const mappings = await getFieldMappings(params.id, session.user.tenantId)

    return NextResponse.json({ mappings })
  } catch (error: any) {
    console.error('Error fetching field mappings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch field mappings' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const salesIntegration = getSalesIntegration()
    if (!salesIntegration) {
      return NextResponse.json({ error: 'Integrations are unavailable' }, { status: 503 })
    }

    const integration = await (salesIntegration as any).findUnique({
      where: { id: params.id },
    })

    if (!integration || integration.tenantId !== session.user.tenantId) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
    }

    const body = await request.json()
    const { sourceField, targetField, mappingType, transformation, isActive } = body

    if (!sourceField || !targetField || !mappingType) {
      return NextResponse.json(
        { error: 'sourceField, targetField, and mappingType are required' },
        { status: 400 }
      )
    }

    const mapping = await upsertFieldMapping(
      params.id,
      session.user.tenantId,
      sourceField,
      targetField,
      mappingType,
      transformation,
      isActive !== undefined ? isActive : true
    )

    return NextResponse.json({ mapping }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating field mapping:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create field mapping' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const mappingId = searchParams.get('mappingId')

    if (!mappingId) {
      return NextResponse.json(
        { error: 'mappingId is required' },
        { status: 400 }
      )
    }

    await deleteFieldMapping(mappingId, session.user.tenantId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting field mapping:', error)
    return NextResponse.json(
      { error: 'Failed to delete field mapping' },
      { status: 500 }
    )
  }
}

