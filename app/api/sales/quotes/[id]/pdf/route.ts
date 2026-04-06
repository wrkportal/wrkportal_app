import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { PDFDocument, rgb } from 'pdf-lib'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const quote = await prisma.salesQuote.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId!,
      },
      include: {
        account: true,
        opportunity: true,
        lineItems: {
          include: {
            product: true,
          },
          orderBy: {
            sortOrder: 'asc',
          },
        },
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    // Generate PDF using pdf-lib
    const pdfDoc = await PDFDocument.create()
    const pageWidth = 612 // Letter width in points
    const pageHeight = 792 // Letter height in points
    const margin = 50

    let page = pdfDoc.addPage([pageWidth, pageHeight])
    let yPos = pageHeight - margin

    // Header
    page.drawText('QUOTE', { x: margin, y: yPos, size: 24, color: rgb(0, 0, 0) })
    yPos -= 35
    page.drawText(quote.name, { x: margin, y: yPos, size: 16, color: rgb(0.2, 0.2, 0.2) })
    yPos -= 40

    // Quote Information
    page.drawText(`Quote Number: ${quote.quoteNumber}`, { x: margin, y: yPos, size: 12, color: rgb(0, 0, 0) })
    yPos -= 18
    page.drawText(`Date: ${new Date(quote.createdAt).toLocaleDateString()}`, { x: margin, y: yPos, size: 12, color: rgb(0, 0, 0) })
    yPos -= 18
    if (quote.validUntil) {
      page.drawText(`Valid Until: ${new Date(quote.validUntil).toLocaleDateString()}`, { x: margin, y: yPos, size: 12, color: rgb(0, 0, 0) })
      yPos -= 18
    }
    yPos -= 15

    // Account Information
    if (quote.account) {
      page.drawText('Bill To:', { x: margin, y: yPos, size: 14, color: rgb(0, 0, 0) })
      yPos -= 20
      page.drawText(quote.account.name, { x: margin, y: yPos, size: 12, color: rgb(0.2, 0.2, 0.2) })
      yPos -= 16
      if (quote.account.email) {
        page.drawText(quote.account.email, { x: margin, y: yPos, size: 12, color: rgb(0.2, 0.2, 0.2) })
        yPos -= 16
      }
      if (quote.account.phone) {
        page.drawText(quote.account.phone, { x: margin, y: yPos, size: 12, color: rgb(0.2, 0.2, 0.2) })
        yPos -= 16
      }
      yPos -= 15
    }

    // Description
    if (quote.description) {
      page.drawText('Description:', { x: margin, y: yPos, size: 12, color: rgb(0, 0, 0) })
      yPos -= 16
      page.drawText(quote.description.substring(0, 100), { x: margin, y: yPos, size: 10, color: rgb(0.3, 0.3, 0.3) })
      yPos -= 25
    }

    // Line Items Header
    page.drawText('Items', { x: margin, y: yPos, size: 14, color: rgb(0, 0, 0) })
    yPos -= 5

    // Draw header underline
    page.drawLine({
      start: { x: margin, y: yPos },
      end: { x: pageWidth - margin, y: yPos },
      thickness: 1,
      color: rgb(0, 0, 0),
    })
    yPos -= 20

    // Table Header
    const col1X = margin          // Description
    const col2X = 350             // Quantity
    const col3X = 420             // Unit Price
    const col4X = 510             // Total

    page.drawText('Description', { x: col1X, y: yPos, size: 10, color: rgb(0, 0, 0) })
    page.drawText('Qty', { x: col2X, y: yPos, size: 10, color: rgb(0, 0, 0) })
    page.drawText('Unit Price', { x: col3X, y: yPos, size: 10, color: rgb(0, 0, 0) })
    page.drawText('Total', { x: col4X, y: yPos, size: 10, color: rgb(0, 0, 0) })
    yPos -= 5

    page.drawLine({
      start: { x: margin, y: yPos },
      end: { x: pageWidth - margin, y: yPos },
      thickness: 0.5,
      color: rgb(0.5, 0.5, 0.5),
    })
    yPos -= 18

    // Table Rows
    quote.lineItems.forEach((item: any) => {
      if (yPos < 100) {
        page = pdfDoc.addPage([pageWidth, pageHeight])
        yPos = pageHeight - margin
      }

      page.drawText(item.name.substring(0, 45), { x: col1X, y: yPos, size: 10, color: rgb(0.2, 0.2, 0.2) })
      page.drawText(item.quantity.toString(), { x: col2X, y: yPos, size: 10, color: rgb(0.2, 0.2, 0.2) })
      page.drawText(`$${parseFloat(item.unitPrice.toString()).toFixed(2)}`, { x: col3X, y: yPos, size: 10, color: rgb(0.2, 0.2, 0.2) })
      page.drawText(`$${parseFloat(item.totalPrice.toString()).toFixed(2)}`, { x: col4X, y: yPos, size: 10, color: rgb(0.2, 0.2, 0.2) })
      yPos -= 18
    })

    yPos -= 10

    // Separator line
    page.drawLine({
      start: { x: col3X - 10, y: yPos },
      end: { x: pageWidth - margin, y: yPos },
      thickness: 0.5,
      color: rgb(0.5, 0.5, 0.5),
    })
    yPos -= 18

    // Totals
    page.drawText('Subtotal:', { x: col3X, y: yPos, size: 10, color: rgb(0.2, 0.2, 0.2) })
    page.drawText(`$${parseFloat(quote.subtotal.toString()).toFixed(2)}`, { x: col4X, y: yPos, size: 10, color: rgb(0.2, 0.2, 0.2) })
    yPos -= 16

    if (parseFloat(quote.discount.toString()) > 0) {
      page.drawText('Discount:', { x: col3X, y: yPos, size: 10, color: rgb(0.2, 0.2, 0.2) })
      page.drawText(`-$${parseFloat(quote.discount.toString()).toFixed(2)}`, { x: col4X, y: yPos, size: 10, color: rgb(0.2, 0.2, 0.2) })
      yPos -= 16
    }

    if (parseFloat(quote.taxAmount.toString()) > 0) {
      page.drawText(`Tax (${parseFloat(quote.taxRate.toString())}%):`, { x: col3X, y: yPos, size: 10, color: rgb(0.2, 0.2, 0.2) })
      page.drawText(`$${parseFloat(quote.taxAmount.toString()).toFixed(2)}`, { x: col4X, y: yPos, size: 10, color: rgb(0.2, 0.2, 0.2) })
      yPos -= 16
    }

    yPos -= 5
    page.drawText('Total:', { x: col3X, y: yPos, size: 14, color: rgb(0, 0, 0) })
    page.drawText(`$${parseFloat(quote.totalAmount.toString()).toFixed(2)}`, { x: col4X, y: yPos, size: 14, color: rgb(0, 0, 0) })
    yPos -= 35

    // Terms
    if (quote.terms) {
      page.drawText('Terms & Conditions:', { x: margin, y: yPos, size: 12, color: rgb(0, 0, 0) })
      yPos -= 16
      page.drawText(quote.terms.substring(0, 200), { x: margin, y: yPos, size: 10, color: rgb(0.3, 0.3, 0.3) })
      yPos -= 20
    }

    // Footer
    page.drawText(`Created by: ${quote.createdBy.name || quote.createdBy.email}`, { x: margin, y: 30, size: 8, color: rgb(0.5, 0.5, 0.5) })

    // Generate PDF
    const pdfBytes = await pdfDoc.save()
    const filename = `quote-${quote.quoteNumber}-${new Date().toISOString().split('T')[0]}.pdf`

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error.message },
      { status: 500 }
    )
  }
}
