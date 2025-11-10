import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    console.log('🔐 Forgot password request received')
    
    const { email } = await req.json()

    if (!email) {
      console.log('❌ No email provided')
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    console.log('🔍 Looking for user with email:', email)

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    // For security, always return success even if user doesn't exist
    // This prevents email enumeration attacks
    if (!user) {
      console.log('⚠️ User not found for email:', email)
      return NextResponse.json({
        message:
          'If an account exists with that email, a reset link has been sent.',
      })
    }

    console.log('✅ User found:', user.email, '- Has password:', !!user.password)

    // Check if user has a password (not OAuth only)
    if (!user.password) {
      console.log('⚠️ User has no password (OAuth-only account)')
      return NextResponse.json({
        message:
          'If an account exists with that email, a reset link has been sent.',
      })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour from now

    console.log('🔑 Generated reset token for:', user.email)

    // Save token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    })

    console.log('💾 Token saved to database')

    // Send password reset email
    try {
      console.log('📧 Attempting to send password reset email to:', user.email)
      
      await sendPasswordResetEmail(
        user.email,
        resetToken,
        user.firstName || user.name || undefined
      )
      
      console.log('✅ Password reset email sent successfully to:', user.email)
    } catch (emailError: any) {
      console.error('❌ Failed to send password reset email:', {
        error: emailError.message,
        code: emailError.code,
        email: user.email,
      })
      // Still return success to prevent email enumeration
      // But log the error for debugging
    }

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
