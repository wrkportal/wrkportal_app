import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    // For security, always return success even if user doesn't exist
    // This prevents email enumeration attacks
    if (!user) {
      return NextResponse.json({
        message:
          'If an account exists with that email, a reset link has been sent.',
      })
    }

    // Check if user has a password (not OAuth only)
    if (!user.password) {
      return NextResponse.json({
        message:
          'If an account exists with that email, a reset link has been sent.',
      })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour from now

    // Save token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    })

    // In production, send email here
    // For now, we'll log the reset link
    const resetUrl = `${
      process.env.NEXTAUTH_URL || 'http://localhost:3000'
    }/reset-password?token=${resetToken}`

    console.log('Password Reset Link:', resetUrl)
    console.log('Reset token for user:', user.email, '- Token:', resetToken)

    // TODO: Send email with reset link
    // Example:
    // await sendEmail({
    //   to: user.email,
    //   subject: 'Password Reset Request',
    //   html: `Click here to reset your password: ${resetUrl}`,
    // })

    return NextResponse.json({
      message:
        'If an account exists with that email, a reset link has been sent.',
    })
  } catch (error) {
    console.error('Error in forgot password:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
