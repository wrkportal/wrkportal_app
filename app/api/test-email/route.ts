import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

export async function GET(req: NextRequest) {
  try {
    // Get email from query params
    const { searchParams } = new URL(req.url)
    const testEmail = searchParams.get('email')

    if (!testEmail) {
      return NextResponse.json({
        error: 'Please provide an email parameter. Example: /api/test-email?email=your@email.com',
      }, { status: 400 })
    }

    // Check environment variables
    const config = {
      EMAIL_HOST: process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com (default)',
      EMAIL_PORT: process.env.EMAIL_PORT || process.env.SMTP_PORT || '587 (default)',
      EMAIL_USER: process.env.EMAIL_USER || process.env.SMTP_USER || 'NOT SET',
      EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || process.env.SMTP_PASS ? '***SET***' : 'NOT SET',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
    }

    console.log('📧 Email Configuration:', config)

    // Try to send test email
    try {
      await sendEmail({
        to: testEmail,
        subject: 'ManagerBook Test Email ✅',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
            <h1 style="color: #7c3aed;">✅ Email Test Successful!</h1>
            <p style="color: #374151; font-size: 16px;">
              Your SMTP configuration is working correctly! 🎉
            </p>
            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
              This is a test email from ManagerBook.
            </p>
            <div style="margin-top: 20px; padding: 15px; background-color: #ffffff; border-radius: 6px;">
              <strong>Configuration:</strong>
              <ul style="color: #6b7280; font-size: 13px;">
                <li>Host: ${config.EMAIL_HOST}</li>
                <li>Port: ${config.EMAIL_PORT}</li>
                <li>User: ${config.EMAIL_USER}</li>
                <li>Password: ${config.EMAIL_PASSWORD}</li>
              </ul>
            </div>
          </div>
        `,
        text: `
✅ Email Test Successful!

Your SMTP configuration is working correctly! 🎉

Configuration:
- Host: ${config.EMAIL_HOST}
- Port: ${config.EMAIL_PORT}
- User: ${config.EMAIL_USER}
- Password: ${config.EMAIL_PASSWORD}

This is a test email from ManagerBook.
        `.trim(),
      })

      return NextResponse.json({
        success: true,
        message: `✅ Test email sent successfully to ${testEmail}`,
        config,
      })
    } catch (emailError: any) {
      console.error('❌ Email sending failed:', emailError)
      return NextResponse.json({
        success: false,
        error: emailError.message,
        config,
        fullError: JSON.stringify(emailError, null, 2),
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('❌ Test email API error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 })
  }
}

