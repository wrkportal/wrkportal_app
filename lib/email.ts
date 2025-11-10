import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

// Email configuration
const EMAIL_CONFIG = {
  host: process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || process.env.SMTP_USER,
    pass: process.env.EMAIL_PASSWORD || process.env.SMTP_PASS,
  },
}

// Create reusable transporter
let transporter: Transporter | null = null

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport(EMAIL_CONFIG)
  }
  return transporter
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
  try {
    // Validate environment variables
    const emailUser = process.env.EMAIL_USER || process.env.SMTP_USER
    const emailPass = process.env.EMAIL_PASSWORD || process.env.SMTP_PASS
    const emailHost = process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com'
    
    if (!emailHost || !emailUser || !emailPass) {
      console.error('Email configuration missing. Please set SMTP_USER and SMTP_PASS (or EMAIL_USER and EMAIL_PASSWORD) environment variables.')
      throw new Error('Email service is not configured properly.')
    }

    const transporter = getTransporter()
    
    const info = await transporter.sendMail({
      from: `"ManagerBook" <${process.env.EMAIL_FROM || emailUser}>`,
      to,
      subject,
      text,
      html,
    })

    console.log('✅ Email sent successfully:', {
      messageId: info.messageId,
      to,
      subject,
    })

    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('❌ Error sending email:', error)
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

