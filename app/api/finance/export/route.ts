import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'
import { PDFDocument, rgb } from 'pdf-lib'
import { Prisma } from '@prisma/client'

// GET /api/finance/export?type=BUDGET&format=excel&id=xxx
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // BUDGET, FORECAST, COST, INVOICE, RATE_CARD
    const format = searchParams.get('format') // excel, pdf
    const id = searchParams.get('id') // Optional: specific ID
    const projectId = searchParams.get('projectId') // Optional: filter by project

    if (!type || !format) {
      return NextResponse.json(
        { error: 'type and format parameters are required' },
        { status: 400 }
      )
    }

    const tenantId = (session.user as any).tenantId

    if (format === 'excel') {
      return await exportExcel(type, id, projectId, tenantId)
    } else if (format === 'pdf') {
      return await exportPDF(type, id, projectId, tenantId)
    } else {
      return NextResponse.json({ error: 'Invalid format. Use "excel" or "pdf"' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Error exporting finance data:', error)
    return NextResponse.json(
      { error: 'Failed to export data', details: error.message },
      { status: 500 }
    )
  }
}

async function exportExcel(
  type: string,
  id: string | null,
  projectId: string | null,
  tenantId: string
) {
  const workbook = XLSX.utils.book_new()

  switch (type) {
    case 'BUDGET': {
      const where: any = { tenantId }
      if (id) where.id = id
      if (projectId) where.projectId = projectId

      type BudgetWithIncludes = Prisma.BudgetGetPayload<{
        include: {
          project: {
            select: {
              name: true
              code: true
            }
          }
          program: {
            select: {
              name: true
              code: true
            }
          }
          categories: true
          lineItems: true
        }
      }>

      const budgets: BudgetWithIncludes[] = await prisma.budget.findMany({
        where,
        include: {
          project: { select: { name: true, code: true } },
          program: { select: { name: true, code: true } },
          categories: true,
          lineItems: true,
        },
      })

      // Budget summary sheet
      const budgetData = budgets.map((b: BudgetWithIncludes) => {
        // Calculate spent amount from categories
        const spentAmount = b.categories.reduce((sum, cat) => sum + Number(cat.spentAmount || 0), 0)
        const totalAmount = Number(b.totalAmount)
        return {
          'Budget Name': b.name,
          'Project': b.project?.name || b.program?.name || 'N/A',
          'Code': b.project?.code || b.program?.code || 'N/A',
          'Type': b.projectId ? 'Project' : b.programId ? 'Program' : (b as any).portfolioId ? 'Portfolio' : 'Standalone',
          'Status': b.status,
          'Total Amount': totalAmount,
          'Spent Amount': spentAmount,
          'Remaining': totalAmount - spentAmount,
          'Start Date': b.startDate.toISOString().split('T')[0],
          'End Date': b.endDate.toISOString().split('T')[0],
          'Currency': b.currency,
          'Created': b.createdAt.toISOString().split('T')[0],
        }
      })

      const ws1 = XLSX.utils.json_to_sheet(budgetData)
      XLSX.utils.book_append_sheet(workbook, ws1, 'Budgets')

      // Budget categories sheet
      type BudgetCategory = BudgetWithIncludes['categories'][0]
      const categoryData: any[] = []
      budgets.forEach((b: BudgetWithIncludes) => {
        b.categories.forEach((cat: BudgetCategory) => {
          categoryData.push({
            'Budget Name': b.name,
            'Category': cat.name,
            'Allocated': Number(cat.allocatedAmount),
            'Spent': Number(cat.spentAmount),
            'Percentage': Number(cat.percentage),
          })
        })
      })

      if (categoryData.length > 0) {
        const ws2 = XLSX.utils.json_to_sheet(categoryData)
        XLSX.utils.book_append_sheet(workbook, ws2, 'Categories')
      }

      break
    }

    case 'FORECAST': {
      const where: any = {
        budget: { tenantId },
      }
      if (id) where.id = id
      if (projectId) where.projectId = projectId

      type ForecastWithIncludes = Prisma.ForecastGetPayload<{
        include: {
          budget: {
            select: {
              name: true
              totalAmount: true
            }
          }
          project: {
            select: {
              name: true
              code: true
            }
          }
          dataPoints: true
        }
      }>

      const forecasts: ForecastWithIncludes[] = await prisma.forecast.findMany({
        where,
        include: {
          budget: { select: { name: true, totalAmount: true } },
          project: { select: { name: true, code: true } },
          dataPoints: true,
        },
      })

      const forecastData = forecasts.map((f: ForecastWithIncludes) => ({
        'Forecast Name': f.name,
        'Budget': f.budget.name,
        'Project': f.project?.name || 'N/A',
        'Type': f.forecastType,
        'Scenario': f.scenario || 'N/A',
        'Model': f.model,
        'Forecasted Amount': Number(f.forecastedAmount),
        'Budget Amount': Number(f.budget.totalAmount),
        'Variance': Number(f.forecastedAmount) - Number(f.budget.totalAmount),
        'Confidence': f.confidence,
        'Generated': f.generatedAt.toISOString().split('T')[0],
      }))

      const ws = XLSX.utils.json_to_sheet(forecastData)
      XLSX.utils.book_append_sheet(workbook, ws, 'Forecasts')
      break
    }

    case 'COST': {
      const where: any = { tenantId }
      if (id) where.id = id
      if (projectId) where.projectId = projectId

      type CostActualWithIncludes = Prisma.CostActualGetPayload<{
        include: {
          budget: {
            select: {
              name: true
            }
          }
          project: {
            select: {
              name: true
              code: true
            }
          }
          task: {
            select: {
              title: true
            }
          }
          category: {
            select: {
              name: true
            }
          }
        }
      }>

      const costs: CostActualWithIncludes[] = await prisma.costActual.findMany({
        where,
        include: {
          budget: { select: { name: true } },
          project: { select: { name: true, code: true } },
          task: { select: { title: true } },
          category: { select: { name: true } },
        },
      })

      const costData = costs.map((c: CostActualWithIncludes) => ({
        'Date': c.date.toISOString().split('T')[0],
        'Budget': c.budget?.name || 'N/A',
        'Project': c.project?.name || 'N/A',
        'Task': c.task?.title || 'N/A',
        'Description': c.description,
        'Category': c.category?.name || 'N/A',
        'Amount': Number(c.amount),
        'Currency': c.currency,
        'Status': c.approvedAt ? 'Approved' : 'Pending',
        'Approved': c.approvedAt ? 'Yes' : 'No',
      }))

      const ws = XLSX.utils.json_to_sheet(costData)
      XLSX.utils.book_append_sheet(workbook, ws, 'Costs')
      break
    }

    case 'INVOICE': {
      const where: any = { tenantId }
      if (id) where.id = id
      if (projectId) where.projectId = projectId

      type InvoiceWithIncludes = Prisma.InvoiceGetPayload<{
        include: {
          project: {
            select: {
              name: true
              code: true
            }
          }
          lineItems: true
          payments: true
        }
      }>

      type Payment = InvoiceWithIncludes['payments'][0]

      const invoices: InvoiceWithIncludes[] = await prisma.invoice.findMany({
        where,
        include: {
          project: { select: { name: true, code: true } },
          lineItems: true,
          payments: true,
        },
      })

      const invoiceData = invoices.map((inv: InvoiceWithIncludes) => {
        const paid = inv.payments.reduce((sum: number, p: Payment) => sum + Number(p.amount), 0)
        return {
          'Invoice Number': inv.invoiceNumber,
          'Client': inv.clientName,
          'Project': inv.project?.name || 'N/A',
          'Issue Date': inv.invoiceDate.toISOString().split('T')[0],
          'Due Date': inv.dueDate.toISOString().split('T')[0],
          'Subtotal': Number(inv.subtotal),
          'Tax': Number(inv.taxAmount),
          'Total': Number(inv.totalAmount),
          'Paid': paid,
          'Balance': Number(inv.totalAmount) - paid,
          'Status': inv.status,
          'Currency': inv.currency,
        }
      })

      const ws = XLSX.utils.json_to_sheet(invoiceData)
      XLSX.utils.book_append_sheet(workbook, ws, 'Invoices')
      break
    }

    case 'RATE_CARD': {
      const where: any = { tenantId }
      if (id) where.id = id

      type RateCardWithRates = Prisma.RateCardGetPayload<{
        include: {
          rates: true
        }
      }>

      type Rate = RateCardWithRates['rates'][0]

      const rateCards: RateCardWithRates[] = await prisma.rateCard.findMany({
        where,
        include: { rates: true },
      })

      const rateCardData: any[] = []
      rateCards.forEach((rc: RateCardWithRates) => {
        rc.rates.forEach((item: Rate) => {
          rateCardData.push({
            'Rate Card': rc.name,
            'Effective Date': rc.effectiveDate.toISOString().split('T')[0],
            'Expiry Date': rc.expiryDate?.toISOString().split('T')[0] || 'N/A',
            'Role': item.role,
            'Region': item.region || 'N/A',
            'Cost Rate': Number(item.costRate),
            'Billable Rate': Number(item.billableRate),
            'Currency': item.currency || rc.currency,
          })
        })
      })

      if (rateCardData.length > 0) {
        const ws = XLSX.utils.json_to_sheet(rateCardData)
        XLSX.utils.book_append_sheet(workbook, ws, 'Rate Cards')
      }
      break
    }

    default:
      return NextResponse.json({ error: 'Invalid export type' }, { status: 400 })
  }

  // Generate Excel buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

  const filename = `finance-${type.toLowerCase()}-${new Date().toISOString().split('T')[0]}.xlsx`

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

// Helper to draw text lines with pdf-lib (which doesn't auto-wrap)
function drawTextLines(page: any, lines: string[], x: number, startY: number, fontSize: number, color: any, lineHeight: number = 1.4) {
  let y = startY
  for (const line of lines) {
    page.drawText(line, { x, y, size: fontSize, color })
    y -= fontSize * lineHeight
  }
  return y
}

async function exportPDF(
  type: string,
  id: string | null,
  projectId: string | null,
  tenantId: string
) {
  const pdfDoc = await PDFDocument.create()
  const pageWidth = 612 // Letter width in points
  const pageHeight = 792 // Letter height in points
  const margin = 50

  // Header page
  let page = pdfDoc.addPage([pageWidth, pageHeight])
  let yPos = pageHeight - margin

  page.drawText('Finance Report', { x: margin, y: yPos, size: 20, color: rgb(0, 0, 0) })
  yPos -= 30
  page.drawText(`Type: ${type}`, { x: margin, y: yPos, size: 12, color: rgb(0.3, 0.3, 0.3) })
  yPos -= 20
  page.drawText(`Generated: ${new Date().toLocaleString()}`, { x: margin, y: yPos, size: 12, color: rgb(0.3, 0.3, 0.3) })
  yPos -= 40

  switch (type) {
    case 'BUDGET': {
      const where: any = { tenantId }
      if (id) where.id = id
      if (projectId) where.projectId = projectId

      type BudgetWithIncludesPDF = Prisma.BudgetGetPayload<{
        include: {
          project: {
            select: {
              name: true
              code: true
            }
          }
          program: {
            select: {
              name: true
              code: true
            }
          }
          categories: true
        }
      }>

      const budgets: BudgetWithIncludesPDF[] = await prisma.budget.findMany({
        where,
        include: {
          project: { select: { name: true, code: true } },
          program: { select: { name: true, code: true } },
          categories: true,
        },
      })

      page.drawText('Budget Report', { x: margin, y: yPos, size: 16, color: rgb(0, 0, 0) })
      yPos -= 30

      budgets.forEach((b: BudgetWithIncludesPDF, idx: number) => {
        if (yPos < 150) {
          page = pdfDoc.addPage([pageWidth, pageHeight])
          yPos = pageHeight - margin
        }

        const spentAmount = b.categories.reduce((sum, cat) => sum + Number(cat.spentAmount || 0), 0)
        const totalAmount = Number(b.totalAmount)

        page.drawText(b.name, { x: margin, y: yPos, size: 14, color: rgb(0, 0, 0) })
        yPos -= 20
        page.drawText(`Project: ${b.project?.name || b.program?.name || 'N/A'}`, { x: margin, y: yPos, size: 10, color: rgb(0.2, 0.2, 0.2) })
        yPos -= 15
        page.drawText(`Type: ${b.projectId ? 'Project' : b.programId ? 'Program' : (b as any).portfolioId ? 'Portfolio' : 'Standalone'} | Status: ${b.status}`, { x: margin, y: yPos, size: 10, color: rgb(0.2, 0.2, 0.2) })
        yPos -= 15
        page.drawText(`Total: ${b.currency} ${totalAmount.toLocaleString()}`, { x: margin, y: yPos, size: 10, color: rgb(0.2, 0.2, 0.2) })
        yPos -= 15
        page.drawText(`Spent: ${b.currency} ${spentAmount.toLocaleString()}`, { x: margin, y: yPos, size: 10, color: rgb(0.2, 0.2, 0.2) })
        yPos -= 15
        page.drawText(`Remaining: ${b.currency} ${(totalAmount - spentAmount).toLocaleString()}`, { x: margin, y: yPos, size: 10, color: rgb(0.2, 0.2, 0.2) })
        yPos -= 20

        if (b.categories.length > 0) {
          page.drawText('Categories:', { x: margin, y: yPos, size: 10, color: rgb(0, 0, 0) })
          yPos -= 15
          type BudgetCategoryPDF = BudgetWithIncludesPDF['categories'][0]
          b.categories.forEach((cat: BudgetCategoryPDF) => {
            if (yPos < 50) {
              page = pdfDoc.addPage([pageWidth, pageHeight])
              yPos = pageHeight - margin
            }
            page.drawText(`  - ${cat.name}: ${b.currency} ${Number(cat.allocatedAmount).toLocaleString()} (${Number(cat.percentage)}%)`, { x: margin + 20, y: yPos, size: 9, color: rgb(0.3, 0.3, 0.3) })
            yPos -= 13
          })
        }
        yPos -= 20
      })

      break
    }

    case 'INVOICE': {
      const where: any = { tenantId }
      if (id) where.id = id
      if (projectId) where.projectId = projectId

      type InvoiceWithIncludesPDF = Prisma.InvoiceGetPayload<{
        include: {
          project: {
            select: {
              name: true
              code: true
            }
          }
          lineItems: true
          payments: true
        }
      }>

      const invoices: InvoiceWithIncludesPDF[] = await prisma.invoice.findMany({
        where,
        include: {
          project: { select: { name: true, code: true } },
          lineItems: true,
          payments: true,
        },
      })

      page.drawText('Invoice Report', { x: margin, y: yPos, size: 16, color: rgb(0, 0, 0) })
      yPos -= 30

      invoices.forEach((inv: InvoiceWithIncludesPDF, idx: number) => {
        if (yPos < 200) {
          page = pdfDoc.addPage([pageWidth, pageHeight])
          yPos = pageHeight - margin
        }

        type PaymentPDF = InvoiceWithIncludesPDF['payments'][0]
        const paid = inv.payments.reduce((sum: number, p: PaymentPDF) => sum + Number(p.amount), 0)

        page.drawText(`Invoice #${inv.invoiceNumber}`, { x: margin, y: yPos, size: 14, color: rgb(0, 0, 0) })
        yPos -= 20
        page.drawText(`Client: ${inv.clientName}`, { x: margin, y: yPos, size: 10, color: rgb(0.2, 0.2, 0.2) })
        yPos -= 15
        page.drawText(`Project: ${inv.project?.name || 'N/A'}`, { x: margin, y: yPos, size: 10, color: rgb(0.2, 0.2, 0.2) })
        yPos -= 15
        page.drawText(`Issue Date: ${inv.invoiceDate.toISOString().split('T')[0]}`, { x: margin, y: yPos, size: 10, color: rgb(0.2, 0.2, 0.2) })
        yPos -= 15
        page.drawText(`Due Date: ${inv.dueDate.toISOString().split('T')[0]}`, { x: margin, y: yPos, size: 10, color: rgb(0.2, 0.2, 0.2) })
        yPos -= 15
        page.drawText(`Status: ${inv.status}`, { x: margin, y: yPos, size: 10, color: rgb(0.2, 0.2, 0.2) })
        yPos -= 20
        page.drawText(`Subtotal: ${inv.currency} ${Number(inv.subtotal).toLocaleString()}`, { x: margin, y: yPos, size: 10, color: rgb(0.2, 0.2, 0.2) })
        yPos -= 15
        page.drawText(`Tax: ${inv.currency} ${Number(inv.taxAmount).toLocaleString()}`, { x: margin, y: yPos, size: 10, color: rgb(0.2, 0.2, 0.2) })
        yPos -= 15
        page.drawText(`Total: ${inv.currency} ${Number(inv.totalAmount).toLocaleString()}`, { x: margin, y: yPos, size: 11, color: rgb(0, 0, 0) })
        yPos -= 15
        page.drawText(`Paid: ${inv.currency} ${paid.toLocaleString()}`, { x: margin, y: yPos, size: 10, color: rgb(0.2, 0.2, 0.2) })
        yPos -= 15
        page.drawText(`Balance: ${inv.currency} ${(Number(inv.totalAmount) - paid).toLocaleString()}`, { x: margin, y: yPos, size: 10, color: rgb(0.2, 0.2, 0.2) })
        yPos -= 30
      })

      break
    }

    default:
      page.drawText(`PDF export for ${type} is available in Excel format.`, { x: margin, y: yPos, size: 12, color: rgb(0.5, 0.5, 0.5) })
  }

  const pdfBytes = await pdfDoc.save()
  const filename = `finance-${type.toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
