/**
 * Phase 4.4: Data Catalog API
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'
import { DataClassification, DataSensitivity } from '@prisma/client'

const createCatalogEntrySchema = z.object({
  resourceType: z.string(),
  resourceId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  ownerId: z.string().optional().nullable(),
  classification: z.nativeEnum(DataClassification).optional().nullable(),
  sensitivity: z.nativeEnum(DataSensitivity).optional().nullable(),
  businessGlossary: z.record(z.any()).optional(),
  technicalMetadata: z.record(z.any()).optional(),
  customFields: z.record(z.any()).optional(),
  isPublished: z.boolean().default(true),
})

// GET /api/governance/catalog - Get catalog entries
export async function GET(request: NextRequest) {
  return withPermissionCheck(
    request,
    { resource: 'governance', action: 'READ' },
    async (req, userInfo) => {
      try {
        const { searchParams } = new URL(req.url)
        const resourceType = searchParams.get('resourceType')
        const resourceId = searchParams.get('resourceId')
        const category = searchParams.get('category')
        const classification = searchParams.get('classification') as DataClassification | null
        const search = searchParams.get('search')

        const where: any = {
          tenantId: userInfo.tenantId,
          isPublished: true,
        }

        if (resourceType) where.resourceType = resourceType
        if (resourceId) where.resourceId = resourceId
        if (category) where.category = category
        if (classification) where.classification = classification
        if (search) {
          where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { tags: { has: search } },
          ]
        }

        const entries = await prisma.dataCatalogEntry.findMany({
          where,
          include: {
            owner: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            updatedAt: 'desc',
          },
        })

        return NextResponse.json({ entries })
      } catch (error: any) {
        console.error('Error fetching catalog entries:', error)
        return NextResponse.json(
          { error: 'Failed to fetch catalog entries', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

// POST /api/governance/catalog - Create/update catalog entry
export async function POST(request: NextRequest) {
  return withPermissionCheck(
    request,
    { resource: 'governance', action: 'CREATE' },
    async (req, userInfo) => {
      try {
        const body = await request.json()
        const data = createCatalogEntrySchema.parse(body)

        const entry = await prisma.dataCatalogEntry.upsert({
          where: {
            tenantId_resourceType_resourceId: {
              tenantId: userInfo.tenantId,
              resourceType: data.resourceType,
              resourceId: data.resourceId,
            },
          },
          create: {
            tenantId: userInfo.tenantId,
            resourceType: data.resourceType,
            resourceId: data.resourceId,
            name: data.name,
            description: data.description,
            tags: data.tags || [],
            category: data.category || null,
            ownerId: data.ownerId || null,
            classification: data.classification || null,
            sensitivity: data.sensitivity || null,
            businessGlossary: data.businessGlossary || null,
            technicalMetadata: data.technicalMetadata || null,
            customFields: data.customFields || null,
            isPublished: data.isPublished,
          },
          update: {
            name: data.name,
            description: data.description,
            tags: data.tags,
            category: data.category || null,
            ownerId: data.ownerId || null,
            classification: data.classification || null,
            sensitivity: data.sensitivity || null,
            businessGlossary: data.businessGlossary || null,
            technicalMetadata: data.technicalMetadata || null,
            customFields: data.customFields || null,
            isPublished: data.isPublished,
          },
          include: {
            owner: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        })

        return NextResponse.json({ entry }, { status: 201 })
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Validation error', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error creating catalog entry:', error)
        return NextResponse.json(
          { error: 'Failed to create catalog entry', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

