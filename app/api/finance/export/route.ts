import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'
import PDFDocument from 'pdfkit'

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

      const budgets = await prisma.budget.findMany({
        where,
        include: {
          project: { select: { name: true, code: true } },
          program: { select: { name: true, code: true } },
          categories: true,
          lineItems: true,
        },
      })

      // Budget summary sheet
      const budgetData = budgets.map((b) => ({
        'Budget Name': b.name,
        'Project': b.project?.name || b.program?.name || 'N/A',
        'Code': b.project?.code || b.program?.code || 'N/A',
        'Type': b.type,
        'Status': b.status,
        'Total Amount': Number(b.totalAmount),
        'Spent Amount': Number(b.spentAmount),
        'Remaining': Number(b.totalAmount) - Number(b.spentAmount),
        'Start Date': b.startDate.toISOString().split('T')[0],
        'End Date': b.endDate.toISOString().split('T')[0],
        'Currency': b.currency,
        'Created': b.createdAt.toISOString().split('T')[0],
      }))

      const ws1 = XLSX.utils.json_to_sheet(budgetData)
      XLSX.utils.book_append_sheet(workbook, ws1, 'Budgets')

      // Budget categories sheet
      const categoryData: any[] = []
      budgets.forEach((b) => {
        b.categories.forEach((cat) => {
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

      const forecasts = await prisma.forecast.findMany({
        where,
        include: {
          budget: { select: { name: true, totalAmount: true } },
          project: { select: { name: true, code: true } },
          dataPoints: true,
        },
      })

      const forecastData = forecasts.map((f) => ({
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

      const costs = await prisma.costActual.findMany({
        where,
        include: {
          budget: { select: { name: true } },
          project: { select: { name: true, code: true } },
          task: { select: { title: true } },
        },
      })

      const costData = costs.map((c) => ({
        'Date': c.date.toISOString().split('T')[0],
        'Budget': c.budget?.name || 'N/A',
        'Project': c.project?.name || 'N/A',
        'Task': c.task?.title || 'N/A',
        'Description': c.description,
        'Category': c.category,
        'Amount': Number(c.amount),
        'Currency': c.currency,
        'Status': c.status,
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

      const invoices = await prisma.invoice.findMany({
        where,
        include: {
          project: { select: { name: true, code: true } },
          lineItems: true,
          payments: true,
        },
      })

      const invoiceData = invoices.map((inv) => {
        const paid = inv.payments.reduce((sum, p) => sum + Number(p.amount), 0)
        return {
          'Invoice Number': inv.invoiceNumber,
          'Client': inv.clientName,
          'Project': inv.project?.name || 'N/A',
          'Issue Date': inv.invoiceDate.toISOString().split('T')[0],
          'Due Date': inv.dueDate.toISOString().split('T')[0],
          'Subtotal': Number(inv.subtotal),
          'Tax': Number(inv.tax),
          'Total': Number(inv.total),
          'Paid': paid,
          'Balance': Number(inv.total) - paid,
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

      const rateCards = await prisma.rateCard.findMany({
        where,
        include: { rates: true },
      })

      const rateCardData: any[] = []
      rateCards.forEach((rc) => {
        rc.rates.forEach((item) => {
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

async function exportPDF(
  type: string,
  id: string | null,
  projectId: string | null,
  tenantId: string
) {
  return new Promise<NextResponse>((resolve, reject) => {
    const chunks: Buffer[] = []
    const doc = new PDFDocument({ margin: 50 })

    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => {
      const buffer = Buffer.concat(chunks)
      const filename = `finance-${type.toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`

      resolve(
        new NextResponse(buffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`,
          },
        })
      )
    })
    doc.on('error', reject)

    // Header
    doc.fontSize(20).text('Finance Report', { align: 'center' })
    doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' })
    doc.moveDown(2)

  switch (type) {
    case 'BUDGET': {
      const where: any = { tenantId }
      if (id) where.id = id
      if (projectId) where.projectId = projectId

      const budgets = await prisma.budget.findMany({
        where,
        include: {
          project: { select: { name: true, code: true } },
          program: { select: { name: true, code: true } },
          categories: true,
        },
      })

      doc.fontSize(16).text('Budget Report', { underline: true })
      doc.moveDown()

      budgets.forEach((b, idx) => {
        if (idx > 0) doc.addPage()

        doc.fontSize(14).text(b.name, { bold: true })
        doc.fontSize(10)
        doc.text(`Project: ${b.project?.name || b.program?.name || 'N/A'}`)
        doc.text(`Type: ${b.type} | Status: ${b.status}`)
        doc.text(`Total: ${b.currency} ${Number(b.totalAmount).toLocaleString()}`)
        doc.text(`Spent: ${b.currency} ${Number(b.spentAmount).toLocaleString()}`)
        doc.text(`Remaining: ${b.currency} ${(Number(b.totalAmount) - Number(b.spentAmount)).toLocaleString()}`)
        doc.moveDown()

        if (b.categories.length > 0) {
          doc.text('Categories:', { bold: true })
          b.categories.forEach((cat) => {
            doc.text(
              `  • ${cat.name}: ${b.currency} ${Number(cat.allocatedAmount).toLocaleString()} (${Number(cat.percentage)}%)`,
              { indent: 20 }
            )
          })
        }
      })

      break
    }

    case 'INVOICE': {
      const where: any = { tenantId }
      if (id) where.id = id
      if (projectId) where.projectId = projectId

      const invoices = await prisma.invoice.findMany({
        where,
        include: {
          project: { select: { name: true, code: true } },
          lineItems: true,
          payments: true,
        },
      })

      doc.fontSize(16).text('Invoice Report', { underline: true })
      doc.moveDown()

      invoices.forEach((inv, idx) => {
        if (idx > 0) doc.addPage()

        doc.fontSize(14).text(`Invoice #${inv.invoiceNumber}`, { bold: true })
        doc.fontSize(10)
        doc.text(`Client: ${inv.clientName}`)
        doc.text(`Project: ${inv.project?.name || 'N/A'}`)
        doc.text(`Issue Date: ${inv.invoiceDate.toISOString().split('T')[0]}`)
        doc.text(`Due Date: ${inv.dueDate.toISOString().split('T')[0]}`)
        doc.text(`Status: ${inv.status}`)
        doc.moveDown()

        const paid = inv.payments.reduce((sum, p) => sum + Number(p.amount), 0)
        doc.text(`Subtotal: ${inv.currency} ${Number(inv.subtotal).toLocaleString()}`)
        doc.text(`Tax: ${inv.currency} ${Number(inv.tax).toLocaleString()}`)
        doc.text(`Total: ${inv.currency} ${Number(inv.total).toLocaleString()}`)
        doc.text(`Paid: ${inv.currency} ${paid.toLocaleString()}`)
        doc.text(`Balance: ${inv.currency} ${(Number(inv.total) - paid).toLocaleString()}`)
      })

      break
    }

    default:
      doc.text(`PDF export for ${type} is not yet implemented.`)
  }

    doc.end()
  })
}

