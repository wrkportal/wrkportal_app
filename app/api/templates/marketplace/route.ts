/**
 * Phase 5.5: Template Marketplace API
 * 
 * Browse and search templates in the marketplace
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

// GET /api/templates/marketplace - Browse marketplace templates
export async function GET(request: NextRequest) {
  return withPermissionCheck(
    request,
    { resource: 'templates', action: 'READ' },
    async (req, userInfo) => {
      try {
        if (!prisma.reportingReportTemplate) {
          return NextResponse.json({ templates: [] })
        }

        const { searchParams } = new URL(req.url)
        const category = searchParams.get('category')
        const type = searchParams.get('type')
        const featured = searchParams.get('featured') === 'true'
        const search = searchParams.get('search')
        const sort = searchParams.get('sort') || 'popular' // popular, rating, newest, name
        const limit = parseInt(searchParams.get('limit') || '50')
        const offset = parseInt(searchParams.get('offset') || '0')

        const where: any = {
          isPublic: true,
          ...(category ? { category } : {}),
          ...(type ? { type } : {}),
          ...(featured ? { featured: true } : {}),
        }

        // Add search if provided
        if (search) {
          where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { tags: { has: search } },
          ]
        }

        // Build orderBy
        let orderBy: any = {}
        switch (sort) {
          case 'rating':
            orderBy = { rating: 'desc' }
            break
          case 'newest':
            orderBy = { createdAt: 'desc' }
            break
          case 'name':
            orderBy = { name: 'asc' }
            break
          case 'popular':
          default:
            orderBy = { usageCount: 'desc' }
            break
        }

        const templates = await prisma.reportingReportTemplate.findMany({
          where,
          include: {
            createdBy: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy,
          take: limit,
          skip: offset,
        })

        // Get categories for filtering
        const categories = await prisma.reportingReportTemplate.findMany({
          where: { isPublic: true },
          select: { category: true },
          distinct: ['category'],
        })

        return NextResponse.json({
          templates,
          categories: categories
            .map((c: { category: string | null }) => c.category)
            .filter(Boolean),
          total: templates.length,
        })
      } catch (error: any) {
        console.error('Error fetching marketplace templates:', error)
        return NextResponse.json(
          { error: 'Failed to fetch templates', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

