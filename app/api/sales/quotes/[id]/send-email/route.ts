import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { AutoActivityCapture } from '@/lib/sales/auto-activity-capture'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { to, subject, message } = body

    if (!to || !subject) {
      return NextResponse.json(
        { error: 'Recipient email and subject are required' },
        { status: 400 }
      )
    }

    const quote = await prisma.salesQuote.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId!,
      },
      include: {
        account: true,
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

    // Generate PDF URL (for attachment or link)
    const pdfUrl = `${request.nextUrl.origin}/api/sales/quotes/${quote.id}/pdf`

    // Build email HTML
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
            .quote-info { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
            th { background: #f3f4f6; font-weight: bold; }
            .total { font-weight: bold; font-size: 18px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Quote ${quote.quoteNumber}</h1>
            </div>
            <div class="content">
              <p>${message || `Please find attached quote ${quote.quoteNumber} for your review.`}</p>
              
              <div class="quote-info">
                <h2>${quote.name}</h2>
                <p><strong>Quote Number:</strong> ${quote.quoteNumber}</p>
                <p><strong>Date:</strong> ${new Date(quote.createdAt).toLocaleDateString()}</p>
                ${quote.validUntil ? `<p><strong>Valid Until:</strong> ${new Date(quote.validUntil).toLocaleDateString()}</p>` : ''}
                ${quote.account ? `<p><strong>Account:</strong> ${quote.account.name}</p>` : ''}
              </div>

              ${quote.description ? `<p>${quote.description}</p>` : ''}

              <h3>Items</h3>
              <table>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${quote.lineItems.map((item: any) => `
                    <tr>
                      <td>${item.name}</td>
                      <td>${item.quantity}</td>
                      <td>$${parseFloat(item.unitPrice.toString()).toFixed(2)}</td>
                      <td>$${parseFloat(item.totalPrice.toString()).toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <div style="text-align: right; margin-top: 20px;">
                <p>Subtotal: $${parseFloat(quote.subtotal.toString()).toFixed(2)}</p>
                ${parseFloat(quote.discount.toString()) > 0 ? `<p>Discount: -$${parseFloat(quote.discount.toString()).toFixed(2)}</p>` : ''}
                ${parseFloat(quote.taxAmount.toString()) > 0 ? `<p>Tax: $${parseFloat(quote.taxAmount.toString()).toFixed(2)}</p>` : ''}
                <p class="total">Total: $${parseFloat(quote.totalAmount.toString()).toFixed(2)}</p>
              </div>

              ${quote.terms ? `<div style="margin-top: 20px;"><h3>Terms & Conditions</h3><p>${quote.terms}</p></div>` : ''}

              <div style="text-align: center; margin: 30px 0;">
                <a href="${pdfUrl}" class="button">Download PDF Quote</a>
              </div>
            </div>
            <div class="footer">
              <p>This quote was generated by ${quote.createdBy.name || quote.createdBy.email}</p>
              <p>If you have any questions, please contact us.</p>
            </div>
          </div>
        </body>
      </html>
    `

    const textContent = `
Quote ${quote.quoteNumber}

${quote.name}

Quote Number: ${quote.quoteNumber}
Date: ${new Date(quote.createdAt).toLocaleDateString()}
${quote.validUntil ? `Valid Until: ${new Date(quote.validUntil).toLocaleDateString()}` : ''}

${message || 'Please find the quote details below.'}

Items:
${quote.lineItems.map((item: any) => `- ${item.name}: ${item.quantity} x $${parseFloat(item.unitPrice.toString()).toFixed(2)} = $${parseFloat(item.totalPrice.toString()).toFixed(2)}`).join('\n')}

Subtotal: $${parseFloat(quote.subtotal.toString()).toFixed(2)}
${parseFloat(quote.discount.toString()) > 0 ? `Discount: -$${parseFloat(quote.discount.toString()).toFixed(2)}` : ''}
${parseFloat(quote.taxAmount.toString()) > 0 ? `Tax: $${parseFloat(quote.taxAmount.toString()).toFixed(2)}` : ''}
Total: $${parseFloat(quote.totalAmount.toString()).toFixed(2)}

Download PDF: ${pdfUrl}
    `

    // Send email
    await sendEmail({
      to,
      subject,
      html: htmlContent,
      text: textContent,
    })

    // Update quote status to SENT
    await prisma.salesQuote.update({
      where: { id: quote.id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
    })

    // Automatically capture activity
    await AutoActivityCapture.capture({
      tenantId: session.user.tenantId!,
      userId: session.user.id,
      type: 'QUOTE_SENT',
      data: {
        quoteId: quote.id,
        quote,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Quote sent successfully',
    })
  } catch (error: any) {
    console.error('Error sending quote email:', error)
    return NextResponse.json(
      { error: 'Failed to send quote email', details: error.message },
      { status: 500 }
    )
  }
}

