/**
 * Phase 5.3: Grid Editor API
 * 
 * CRUD operations for grids
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'
import { z } from 'zod'

const createGridSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  rowCount: z.number().int().min(1).max(100000).default(1000),
  columnCount: z.number().int().min(1).max(1000).default(26),
  frozenRows: z.number().int().min(0).default(0),
  frozenColumns: z.number().int().min(0).default(0),
  isPublic: z.boolean().default(false),
})

// GET /api/grids - List grids
export async function GET(request: NextRequest) {
  return withPermissionCheck(
    request,
    { resource: 'grids', action: 'READ' },
    async (req, userInfo) => {
      try {
        // Check if Grid model exists in Prisma client
        // Access via bracket notation to avoid TypeScript errors if model doesn't exist
        const gridModel = (prisma as any).grid
        if (!gridModel) {
          console.error('Grid model not found in Prisma client')
          console.error('Available Prisma models:', Object.keys(prisma).filter(k => !k.startsWith('$') && typeof (prisma as any)[k] === 'object'))
          return NextResponse.json({ 
            grids: [],
            warning: 'Grid model not available. Please restart the dev server after running: npx prisma generate'
          })
        }

        const { searchParams } = new URL(req.url)
        const isPublic = searchParams.get('public') === 'true'

        const grids = await gridModel.findMany({
          where: {
            tenantId: userInfo.tenantId,
            ...(isPublic ? { isPublic: true } : {}),
          },
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
                cells: true,
                formulas: true,
              },
            },
          },
          orderBy: {
            updatedAt: 'desc',
          },
          take: 100,
        })

        return NextResponse.json({ grids })
      } catch (error: any) {
        if (error.code === 'P2001' || error.message?.includes('does not exist') || error.message?.includes('Unknown model')) {
          return NextResponse.json({ grids: [] })
        }
        console.error('Error fetching grids:', error)
        return NextResponse.json(
          { error: 'Failed to fetch grids', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

// POST /api/grids - Create grid
export async function POST(request: NextRequest) {
  return withPermissionCheck(
    request,
    { resource: 'grids', action: 'CREATE' },
    async (req, userInfo) => {
      try {
        const body = await req.json()
        console.log('Creating grid with data:', { ...body, tenantId: userInfo.tenantId, userId: userInfo.userId })
        
        const data = createGridSchema.parse(body)

        // Check if Grid model exists
        const gridModel = (prisma as any).grid
        if (!gridModel) {
          console.error('Grid model not found in Prisma client')
          console.error('Available Prisma models:', Object.keys(prisma).filter(k => !k.startsWith('$') && typeof (prisma as any)[k] === 'object'))
          return NextResponse.json(
            { 
              error: 'Grid model not available',
              details: 'The Grid model is not available in the Prisma client.',
              solution: 'Please restart the dev server after running: npx prisma generate',
              note: 'The Prisma client has been regenerated, but Next.js needs to be restarted to load it.'
            },
            { status: 500 }
          )
        }

        // Check if GridColumn model exists
        const gridColumnModel = (prisma as any).gridColumn
        if (!gridColumnModel) {
          console.error('GridColumn model not found')
          return NextResponse.json(
            { error: 'GridColumn model not available. Please restart the dev server.' },
            { status: 500 }
          )
        }

        // Create grid with default columns
        const grid = await gridModel.create({
          data: {
            tenantId: userInfo.tenantId,
            name: data.name,
            description: data.description,
            rowCount: data.rowCount,
            columnCount: data.columnCount,
            frozenRows: data.frozenRows,
            frozenColumns: data.frozenColumns,
            isPublic: data.isPublic,
            createdById: userInfo.userId,
            columns: {
              create: Array.from({ length: data.columnCount }, (_, i) => ({
                index: i,
                width: 100,
                type: 'TEXT',
                isVisible: true,
                isLocked: false,
              })),
            },
          },
          include: {
            createdBy: {
              select: {
                id: true,
                email: true,
              },
            },
            columns: true,
          },
        })

        console.log('Grid created successfully:', grid.id)
        return NextResponse.json({ grid }, { status: 201 })
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          console.error('Validation error:', error.errors)
          return NextResponse.json(
            { error: 'Validation error', details: error.errors },
            { status: 400 }
          )
        }
        
        // Handle Prisma errors
        if (error.code === 'P2001' || error.message?.includes('does not exist') || error.message?.includes('Unknown model')) {
          console.error('Database table not found:', error.message)
          return NextResponse.json(
            { 
              error: 'Database tables not found. Please run: npx prisma db push',
              details: error.message 
            },
            { status: 500 }
          )
        }
        
        // Handle Prisma model not found errors
        if (
          error.message?.includes('grid') || 
          error.message?.includes('Grid') ||
          error.code === 'P2001' ||
          error.message?.includes('does not exist') ||
          error.message?.includes('Unknown model') ||
          error.message?.includes('Cannot read properties of undefined')
        ) {
          console.error('Grid model not available in Prisma client')
          return NextResponse.json(
            { 
              error: 'Grid model not available',
              details: 'The Grid model is not available in the Prisma client. This usually means:',
              steps: [
                '1. The Prisma client needs to be regenerated (already done)',
                '2. **The dev server MUST be restarted** to load the new Prisma client',
                '3. Stop the dev server (Ctrl+C) and run: npm run dev',
              ],
              note: 'Simply running prisma generate is not enough - you must restart the Next.js dev server!'
            },
            { status: 500 }
          )
        }
        
        console.error('Error creating grid:', error)
        return NextResponse.json(
          { 
            error: 'Failed to create grid', 
            details: error.message,
            code: error.code,
          },
          { status: 500 }
        )
      }
    }
  )
}

