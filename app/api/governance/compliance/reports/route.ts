/**
 * Phase 4.4: Compliance Reports API
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'
import { ComplianceReportType, ComplianceReportStatus } from '@prisma/client'

const createReportSchema = z.object({
  reportType: z.nativeEnum(ComplianceReportType),
  name: z.string(),
  description: z.string().optional(),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  data: z.record(z.any()),
})

// GET /api/governance/compliance/reports - Get compliance reports
export async function GET(request: NextRequest) {
  return withPermissionCheck(
    request,
    { resource: 'governance', action: 'READ' },
    async (req, userInfo) => {
      try {
        const { searchParams } = new URL(req.url)
        const reportType = searchParams.get('reportType') as ComplianceReportType | null
        const status = searchParams.get('status') as ComplianceReportStatus | null

        const where: any = {
          tenantId: userInfo.tenantId,
        }

        if (reportType) where.reportType = reportType
        if (status) where.status = status

        const reports = await prisma.complianceReport.findMany({
          where,
          include: {
            generatedBy: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            generatedAt: 'desc',
          },
        })

        return NextResponse.json({ reports })
      } catch (error: any) {
        console.error('Error fetching compliance reports:', error)
        return NextResponse.json(
          { error: 'Failed to fetch compliance reports', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

// POST /api/governance/compliance/reports - Generate compliance report
export async function POST(request: NextRequest) {
  return withPermissionCheck(
    request,
    { resource: 'governance', action: 'CREATE' },
    async (req, userInfo) => {
      try {
        const body = await request.json()
        const data = createReportSchema.parse(body)

        const report = await prisma.complianceReport.create({
          data: {
            tenantId: userInfo.tenantId,
            reportType: data.reportType,
            name: data.name,
            description: data.description,
            periodStart: new Date(data.periodStart),
            periodEnd: new Date(data.periodEnd),
            generatedById: userInfo.userId,
            data: data.data,
            status: ComplianceReportStatus.DRAFT,
          },
          include: {
            generatedBy: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        })

        return NextResponse.json({ report }, { status: 201 })
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Validation error', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error creating compliance report:', error)
        return NextResponse.json(
          { error: 'Failed to create compliance report', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

