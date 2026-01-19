import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import PDFDocument from 'pdfkit'

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

    // Generate PDF
    const chunks: Buffer[] = []
    const doc = new PDFDocument({ margin: 50, size: 'LETTER' })

    doc.on('data', (chunk) => chunks.push(chunk))
    
    return new Promise<NextResponse>((resolve, reject) => {
      doc.on('end', () => {
        const buffer = Buffer.concat(chunks)
        const filename = `quote-${quote.quoteNumber}-${new Date().toISOString().split('T')[0]}.pdf`

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
      doc.fontSize(24).text('QUOTE', { align: 'center' })
      doc.moveDown()
      doc.fontSize(16).text(quote.name, { align: 'center' })
      doc.moveDown(2)

      // Quote Information
      doc.fontSize(12)
      doc.text(`Quote Number: ${quote.quoteNumber}`, { align: 'left' })
      doc.text(`Date: ${new Date(quote.createdAt).toLocaleDateString()}`, { align: 'left' })
      if (quote.validUntil) {
        doc.text(`Valid Until: ${new Date(quote.validUntil).toLocaleDateString()}`, { align: 'left' })
      }
      doc.moveDown()

      // Account Information
      if (quote.account) {
        doc.fontSize(14).text('Bill To:', { underline: true })
        doc.fontSize(12)
        doc.text(quote.account.name)
        if (quote.account.email) doc.text(quote.account.email)
        if (quote.account.phone) doc.text(quote.account.phone)
        doc.moveDown()
      }

      // Description
      if (quote.description) {
        doc.fontSize(12).text('Description:', { underline: true })
        doc.text(quote.description)
        doc.moveDown()
      }

      // Line Items Table
      doc.fontSize(14).text('Items', { underline: true })
      doc.moveDown(0.5)

      const tableTop = doc.y
      const itemHeight = 20
      const columns = [
        { x: 50, width: 250, label: 'Description' },
        { x: 300, width: 80, label: 'Quantity', align: 'right' },
        { x: 380, width: 100, label: 'Unit Price', align: 'right' },
        { x: 480, width: 80, label: 'Total', align: 'right' },
      ]

      // Table Header
      doc.fontSize(10)
      // Use default font (PDFKit has built-in fonts)
      columns.forEach((col) => {
        doc.text(col.label, col.x, tableTop, { width: col.width, align: col.align as any })
      })
      
      doc.moveDown(0.3)
      doc.strokeColor('#000000').lineWidth(1).moveTo(50, doc.y).lineTo(560, doc.y).stroke()
      doc.moveDown(0.5)

      // Table Rows
      doc.fontSize(10)
      quote.lineItems.forEach((item) => {
        const y = doc.y
        
        doc.text(item.name, columns[0].x, y, { width: columns[0].width })
        doc.text(item.quantity.toString(), columns[1].x, y, { width: columns[1].width, align: 'right' })
        doc.text(`$${parseFloat(item.unitPrice.toString()).toFixed(2)}`, columns[2].x, y, { width: columns[2].width, align: 'right' })
        doc.text(`$${parseFloat(item.totalPrice.toString()).toFixed(2)}`, columns[3].x, y, { width: columns[3].width, align: 'right' })
        
        doc.moveDown()
      })

      doc.moveDown()

      // Totals
      const totalsY = doc.y
      doc.text('Subtotal:', 400, totalsY, { width: 100, align: 'right' })
      doc.text(`$${parseFloat(quote.subtotal.toString()).toFixed(2)}`, 480, totalsY, { width: 80, align: 'right' })
      doc.moveDown()

      if (parseFloat(quote.discount.toString()) > 0) {
        doc.text('Discount:', 400, doc.y, { width: 100, align: 'right' })
        doc.text(`-$${parseFloat(quote.discount.toString()).toFixed(2)}`, 480, doc.y, { width: 80, align: 'right' })
        doc.moveDown()
      }

      if (parseFloat(quote.taxAmount.toString()) > 0) {
        doc.text(`Tax (${parseFloat(quote.taxRate.toString())}%):`, 400, doc.y, { width: 100, align: 'right' })
        doc.text(`$${parseFloat(quote.taxAmount.toString()).toFixed(2)}`, 480, doc.y, { width: 80, align: 'right' })
        doc.moveDown()
      }

      doc.fontSize(14)
      // Use default font for bold effect (size makes it stand out)
      doc.text('Total:', 400, doc.y, { width: 100, align: 'right' })
      doc.text(`$${parseFloat(quote.totalAmount.toString()).toFixed(2)}`, 480, doc.y, { width: 80, align: 'right' })
      doc.moveDown(2)

      // Terms
      if (quote.terms) {
        doc.fontSize(12)
        doc.text('Terms & Conditions:', { underline: true })
        doc.fontSize(10)
        doc.text(quote.terms)
        doc.moveDown()
      }

      // Footer
      doc.fontSize(8).text(`Created by: ${quote.createdBy.name || quote.createdBy.email}`, 50, doc.page.height - 50)

      doc.end()
    })
  } catch (error: any) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error.message },
      { status: 500 }
    )
  }
}

