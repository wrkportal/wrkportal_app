/**
 * Phase 5.2: Integration Marketplace API
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserForPermissionCheck } from '@/lib/permissions/permission-middleware'
import { getTemplates, getTemplate, installTemplate, addTemplateReview, initializeDefaultTemplates } from '@/lib/integrations/templates'
import { IntegrationType } from '@prisma/client'
import { z } from 'zod'

// GET /api/integrations/marketplace - Get marketplace templates
export async function GET(request: NextRequest) {
  // Check if user is admin (simpler check for marketplace access)
  const userInfo = await getUserForPermissionCheck()
  
  if (!userInfo) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Allow access for admins only
  const isAdmin = userInfo.role === 'ORG_ADMIN' || 
                  userInfo.role === 'TENANT_SUPER_ADMIN' || 
                  userInfo.role === 'PLATFORM_OWNER' ||
                  userInfo.role === 'INTEGRATION_ADMIN'

  if (!isAdmin) {
    return NextResponse.json({ error: 'Permission denied. Admin access required.' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const integrationType = searchParams.get('integrationType') as IntegrationType | null
    const featured = searchParams.get('featured') === 'true'
    const search = searchParams.get('search')
    const init = searchParams.get('init') === 'true'

    // Initialize default templates if requested (admin only)
    if (init && (userInfo.role === 'TENANT_SUPER_ADMIN' || userInfo.role === 'PLATFORM_OWNER')) {
      await initializeDefaultTemplates()
    }

    const templates = await getTemplates({
      category: category || undefined,
      integrationType: integrationType || undefined,
      featured: featured || undefined,
      search: search || undefined,
    })

    return NextResponse.json({ templates })
  } catch (error: any) {
    console.error('Error fetching marketplace templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch marketplace templates', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/integrations/marketplace/install - Install template
export async function POST(request: NextRequest) {
  // Check if user is admin
  const userInfo = await getUserForPermissionCheck()
  
  if (!userInfo) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Allow access for admins only
  const isAdmin = userInfo.role === 'ORG_ADMIN' || 
                  userInfo.role === 'TENANT_SUPER_ADMIN' || 
                  userInfo.role === 'PLATFORM_OWNER' ||
                  userInfo.role === 'INTEGRATION_ADMIN'

  if (!isAdmin) {
    return NextResponse.json({ error: 'Permission denied. Admin access required.' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { templateId, name } = body

    if (!templateId) {
      return NextResponse.json(
        { error: 'templateId is required' },
        { status: 400 }
      )
    }

    const integration = await installTemplate(
      templateId,
      userInfo.tenantId,
      userInfo.userId,
      name
    )

    console.log('Installation successful, created integration:', {
      id: integration.id,
      name: integration.name,
      type: integration.type,
      tenantId: integration.tenantId,
      status: integration.status,
    })

    // Include related data in response
    const integrationWithDetails = await prisma.integration.findUnique({
      where: { id: integration.id },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            syncJobs: true,
          },
        },
      },
    })

    return NextResponse.json({ integration: integrationWithDetails || integration }, { status: 201 })
  } catch (error: any) {
    console.error('Error installing template:', error)
    return NextResponse.json(
      { error: 'Failed to install template', details: error.message },
      { status: 500 }
    )
  }
}

