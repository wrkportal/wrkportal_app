/**
 * Phase 5.3: Grid Editor API - Cell Operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'
import { z } from 'zod'
import { evaluateFormula, extractDependencies } from '@/lib/grid/formula-engine'

const updateCellSchema = z.object({
  rowIndex: z.number().int().min(0),
  columnIndex: z.number().int().min(0),
  value: z.string().nullable(),
  formula: z.string().optional(),
  dataType: z.enum(['TEXT', 'NUMBER', 'DATE', 'BOOLEAN', 'FORMULA', 'ERROR']).optional(),
})

const updateCellsSchema = z.object({
  cells: z.array(updateCellSchema),
})

// GET /api/grids/[id]/cells - Get cells in range
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermissionCheck(
    request,
    { resource: 'grids', action: 'READ' },
    async (req, userInfo) => {
      try {
        if (!prisma.grid || !prisma.gridCell) {
          return NextResponse.json({ cells: [] })
        }

        const { searchParams } = new URL(req.url)
        const startRow = parseInt(searchParams.get('startRow') || '0')
        const endRow = parseInt(searchParams.get('endRow') || '100')
        const startCol = parseInt(searchParams.get('startCol') || '0')
        const endCol = parseInt(searchParams.get('endCol') || '26')

        // Check grid access
        const grid = await prisma.grid.findUnique({
          where: { id: params.id },
        })

        if (!grid || (grid.tenantId !== userInfo.tenantId && !grid.isPublic)) {
          return NextResponse.json(
            { error: 'Access denied' },
            { status: 403 }
          )
        }

        const cells = await prisma.gridCell.findMany({
          where: {
            gridId: params.id,
            rowIndex: { gte: startRow, lte: endRow },
            columnIndex: { gte: startCol, lte: endCol },
          },
          orderBy: [
            { rowIndex: 'asc' },
            { columnIndex: 'asc' },
          ],
        })

        return NextResponse.json({ cells })
      } catch (error: any) {
        console.error('Error fetching cells:', error)
        return NextResponse.json(
          { error: 'Failed to fetch cells', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

// POST /api/grids/[id]/cells - Batch update cells
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermissionCheck(
    request,
    { resource: 'grids', action: 'UPDATE' },
    async (req, userInfo) => {
      try {
        if (!prisma.grid || !prisma.gridCell) {
          return NextResponse.json(
            { error: 'Grid model not available' },
            { status: 500 }
          )
        }

        const body = await req.json()
        const data = updateCellsSchema.parse(body)

        // Check grid access
        const grid = await prisma.grid.findUnique({
          where: { id: params.id },
        })

        if (!grid || grid.tenantId !== userInfo.tenantId) {
          return NextResponse.json(
            { error: 'Access denied' },
            { status: 403 }
          )
        }

        // Batch update cells
        const results = await Promise.all(
          data.cells.map(async (cellData) => {
            const isFormula = cellData.value?.startsWith('=') || cellData.formula
            const formula = isFormula ? (cellData.value || cellData.formula || '') : null

            // For formulas, we'll need to evaluate them later in a batch
            // For now, just store them
            const upsertData = {
              rowIndex: cellData.rowIndex,
              columnIndex: cellData.columnIndex,
              value: cellData.value,
              displayValue: cellData.value, // Will be updated by formula engine
              formula: formula,
              dataType: (cellData.dataType || (isFormula ? 'FORMULA' : 'TEXT')) as any,
              updatedById: userInfo.userId,
            }

            return prisma.gridCell.upsert({
              where: {
                gridId_rowIndex_columnIndex: {
                  gridId: params.id,
                  rowIndex: cellData.rowIndex,
                  columnIndex: cellData.columnIndex,
                },
              },
              create: {
                gridId: params.id,
                ...upsertData,
              },
              update: upsertData,
            })
          })
        )

        return NextResponse.json({ cells: results })
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Validation error', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error updating cells:', error)
        return NextResponse.json(
          { error: 'Failed to update cells', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

