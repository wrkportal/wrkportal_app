/**
 * Phase 5.3: Grid Editor API - Single Grid Operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'
import { z } from 'zod'

const updateGridSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  frozenRows: z.number().int().min(0).optional(),
  frozenColumns: z.number().int().min(0).optional(),
  isPublic: z.boolean().optional(),
})

// GET /api/grids/[id] - Get grid details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermissionCheck(
    request,
    { resource: 'grids', action: 'READ' },
    async (req, userInfo) => {
      try {
        if (!prisma.grid) {
          return NextResponse.json(
            { error: 'Grid model not available' },
            { status: 500 }
          )
        }

        const grid = await prisma.grid.findUnique({
          where: { id: params.id },
          include: {
            createdBy: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            columns: {
              orderBy: { index: 'asc' },
            },
            _count: {
              select: {
                cells: true,
                formulas: true,
                validations: true,
                formats: true,
              },
            },
          },
        })

        if (!grid) {
          return NextResponse.json(
            { error: 'Grid not found' },
            { status: 404 }
          )
        }

        // Check access (must be same tenant or public)
        if (grid.tenantId !== userInfo.tenantId && !grid.isPublic) {
          return NextResponse.json(
            { error: 'Access denied' },
            { status: 403 }
          )
        }

        return NextResponse.json({ grid })
      } catch (error: any) {
        console.error('Error fetching grid:', error)
        return NextResponse.json(
          { error: 'Failed to fetch grid', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

// PUT /api/grids/[id] - Update grid
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermissionCheck(
    request,
    { resource: 'grids', action: 'UPDATE' },
    async (req, userInfo) => {
      try {
        if (!prisma.grid) {
          return NextResponse.json(
            { error: 'Grid model not available' },
            { status: 500 }
          )
        }

        const body = await req.json()
        const data = updateGridSchema.parse(body)

        // Check if grid exists and user has access
        const existing = await prisma.grid.findUnique({
          where: { id: params.id },
        })

        if (!existing) {
          return NextResponse.json(
            { error: 'Grid not found' },
            { status: 404 }
          )
        }

        if (existing.tenantId !== userInfo.tenantId) {
          return NextResponse.json(
            { error: 'Access denied' },
            { status: 403 }
          )
        }

        const grid = await prisma.grid.update({
          where: { id: params.id },
          data: {
            ...data,
            updatedById: userInfo.userId,
          },
          include: {
            createdBy: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        })

        return NextResponse.json({ grid })
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Validation error', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error updating grid:', error)
        return NextResponse.json(
          { error: 'Failed to update grid', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

// DELETE /api/grids/[id] - Delete grid
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermissionCheck(
    request,
    { resource: 'grids', action: 'DELETE' },
    async (req, userInfo) => {
      try {
        if (!prisma.grid) {
          return NextResponse.json(
            { error: 'Grid model not available' },
            { status: 500 }
          )
        }

        const existing = await prisma.grid.findUnique({
          where: { id: params.id },
        })

        if (!existing) {
          return NextResponse.json(
            { error: 'Grid not found' },
            { status: 404 }
          )
        }

        if (existing.tenantId !== userInfo.tenantId) {
          return NextResponse.json(
            { error: 'Access denied' },
            { status: 403 }
          )
        }

        await prisma.grid.delete({
          where: { id: params.id },
        })

        return NextResponse.json({ success: true })
      } catch (error: any) {
        console.error('Error deleting grid:', error)
        return NextResponse.json(
          { error: 'Failed to delete grid', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

