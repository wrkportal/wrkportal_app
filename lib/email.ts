import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

// Email configuration with performance optimizations
function createEmailConfig() {
  return {
    host: process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER || process.env.SMTP_USER,
      pass: process.env.EMAIL_PASSWORD || process.env.SMTP_PASS,
    },
    // Performance and reliability settings
    pool: true, // Use pooled connections
    maxConnections: 5, // Maximum simultaneous connections
    maxMessages: 100, // Max messages per connection
    rateDelta: 1000, // Time window for rate limiting (ms)
    rateLimit: 5, // Max messages per rateDelta
    connectionTimeout: 10000, // 10 seconds connection timeout
    greetingTimeout: 10000, // 10 seconds greeting timeout
    socketTimeout: 30000, // 30 seconds socket timeout
  }
}

// Create transporter (will be recreated for each serverless function invocation)
function getTransporter(): Transporter {
  return nodemailer.createTransport(createEmailConfig())
}

// Email templates
export const emailTemplates = {
  passwordReset: (resetUrl: string, userName?: string) => ({
    subject: 'Reset Your Password - ManagerBook',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%); padding: 40px 30px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">ManagerBook</h1>
                      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Project Management Platform</p>
                    </td>
                  </tr>
                  
                  <!-- Body -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      ${userName ? `<p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">Hi ${userName},</p>` : ''}
                      
                      <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">
                        We received a request to reset your password for your ManagerBook account. Click the button below to create a new password:
                      </p>
                      
                      <!-- Reset Button -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                        <tr>
                          <td align="center">
                            <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                              Reset Password
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="color: #6b7280; font-size: 14px; line-height: 20px; margin: 20px 0 0 0;">
                        Or copy and paste this link into your browser:
                      </p>
                      <p style="color: #7c3aed; font-size: 13px; word-break: break-all; margin: 8px 0 0 0;">
                        ${resetUrl}
                      </p>
                      
                      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                        <p style="color: #6b7280; font-size: 14px; line-height: 20px; margin: 0;">
                          <strong>⏱️ This link expires in 1 hour</strong> for security reasons.
                        </p>
                        <p style="color: #6b7280; font-size: 14px; line-height: 20px; margin: 15px 0 0 0;">
                          If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
                        </p>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="color: #6b7280; font-size: 13px; margin: 0 0 10px 0;">
                        © ${new Date().getFullYear()} ManagerBook. All rights reserved.
                      </p>
                      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                        If you have any questions, contact us at <a href="mailto:support@managerbook.in" style="color: #7c3aed; text-decoration: none;">support@managerbook.in</a>
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
    text: `
Hi ${userName || 'there'},

We received a request to reset your password for your ManagerBook account.

To reset your password, click the following link:
${resetUrl}

This link expires in 1 hour for security reasons.

If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.

---
© ${new Date().getFullYear()} ManagerBook
If you have any questions, contact us at support@managerbook.in
    `.trim(),
  }),

  welcomeEmail: (userName: string, loginUrl: string) => ({
    subject: 'Welcome to ManagerBook! 🎉',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to ManagerBook</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%); padding: 40px 30px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700;">Welcome to ManagerBook! 🎉</h1>
                    </td>
                  </tr>
                  
                  <!-- Body -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">Hi ${userName},</p>
                      
                      <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">
                        Thank you for joining ManagerBook! We're excited to have you on board. 🚀
                      </p>
                      
                      <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 30px 0;">
                        Your account has been successfully created. You can now start managing your projects smarter, faster, and better.
                      </p>
                      
                      <!-- Login Button -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                        <tr>
                          <td align="center">
                            <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                              Get Started
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <div style="margin-top: 30px; padding: 20px; background-color: #f9fafb; border-radius: 6px; border-left: 4px solid #7c3aed;">
                        <p style="color: #374151; font-size: 15px; font-weight: 600; margin: 0 0 10px 0;">✨ What's Next?</p>
                        <ul style="color: #6b7280; font-size: 14px; line-height: 20px; margin: 0; padding-left: 20px;">
                          <li style="margin-bottom: 8px;">Set up your profile and preferences</li>
                          <li style="margin-bottom: 8px;">Create your first project</li>
                          <li style="margin-bottom: 8px;">Invite your team members</li>
                          <li>Explore AI-powered features</li>
                        </ul>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="color: #6b7280; font-size: 13px; margin: 0 0 10px 0;">
                        © ${new Date().getFullYear()} ManagerBook. All rights reserved.
                      </p>
                      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                        Need help? Contact us at <a href="mailto:support@managerbook.in" style="color: #7c3aed; text-decoration: none;">support@managerbook.in</a>
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
    text: `
Hi ${userName},

Thank you for joining ManagerBook! We're excited to have you on board.

Your account has been successfully created. You can now start managing your projects smarter, faster, and better.

Get started: ${loginUrl}

What's Next?
• Set up your profile and preferences
• Create your first project
• Invite your team members
• Explore AI-powered features

---
© ${new Date().getFullYear()} ManagerBook
Need help? Contact us at support@managerbook.in
    `.trim(),
  }),
}

// Send email function
export interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text: string
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  const startTime = Date.now()
  let transporter: Transporter | null = null
  
  try {
    // Validate environment variables
    const emailUser = process.env.EMAIL_USER || process.env.SMTP_USER
    const emailPass = process.env.EMAIL_PASSWORD || process.env.SMTP_PASS
    const emailHost = process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com'
    const emailPort = process.env.EMAIL_PORT || process.env.SMTP_PORT || '587'
    
    console.log('📧 Email Configuration Check:', {
      hasHost: !!emailHost,
      hasUser: !!emailUser,
      hasPass: !!emailPass,
      host: emailHost,
      port: emailPort,
      user: emailUser,
      to,
    })
    
    if (!emailHost || !emailUser || !emailPass) {
      const missingVars = []
      if (!emailHost) missingVars.push('EMAIL_HOST/SMTP_HOST')
      if (!emailUser) missingVars.push('EMAIL_USER/SMTP_USER')
      if (!emailPass) missingVars.push('EMAIL_PASSWORD/SMTP_PASS')
      
      const errorMsg = `Email configuration missing: ${missingVars.join(', ')}`
      console.error('❌', errorMsg)
      throw new Error(errorMsg)
    }

    console.log('🔌 Creating SMTP transporter...')
    const createStart = Date.now()
    transporter = getTransporter()
    console.log(`✅ Transporter created in ${Date.now() - createStart}ms`)
    
    console.log('📤 Attempting to send email...')
    const sendStart = Date.now()
    
    const info = await transporter.sendMail({
      from: `"ManagerBook" <${process.env.EMAIL_FROM || emailUser}>`,
      to,
      subject,
      text,
      html,
    })

    const totalTime = Date.now() - startTime
    const sendTime = Date.now() - sendStart

    console.log('✅ Email sent successfully:', {
      messageId: info.messageId,
      to,
      subject,
      totalTime: `${totalTime}ms`,
      sendTime: `${sendTime}ms`,
    })

    // Close the transporter to free up resources
    if (transporter && transporter.close) {
      transporter.close()
    }

    return { success: true, messageId: info.messageId }
  } catch (error: any) {
    const totalTime = Date.now() - startTime
    console.error('❌ Error sending email:', {
      error: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      totalTime: `${totalTime}ms`,
    })
    
    // Close the transporter even on error
    if (transporter && transporter.close) {
      try {
        transporter.close()
      } catch (closeError) {
        console.error('Error closing transporter:', closeError)
      }
    }
    
    throw error
  }
}

// Helper function to send password reset email
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  userName?: string
) {
  const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`
  
  const { subject, html, text } = emailTemplates.passwordReset(resetUrl, userName)
  
  return sendEmail({
    to: email,
    subject,
    html,
    text,
  })
}

// Helper function to send welcome email
export async function sendWelcomeEmail(email: string, userName: string) {
  const loginUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login`
  
  const { subject, html, text } = emailTemplates.welcomeEmail(userName, loginUrl)
  
  return sendEmail({
    to: email,
    subject,
    html,
    text,
  })
}

