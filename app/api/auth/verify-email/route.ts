import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    let token = searchParams.get('token')
    let email = searchParams.get('email')

    // Decode email if provided
    if (email) {
      email = decodeURIComponent(email).trim().toLowerCase()
    }

    if (!token) {
      console.error('❌ Verification: No token provided')
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      )
    }

    // Decode the token in case it's URL encoded
    token = decodeURIComponent(token).trim()
    console.log('🔍 Verification: Looking for token:', token.substring(0, 10) + '...', 'email:', email || 'not provided')
    
    // IDEMPOTENCY CHECK: If email is provided, check user status first (even if token is missing)
    // This makes verification idempotent - clicking link multiple times won't cause errors
    if (email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      })
      
      if (existingUser && existingUser.emailVerified) {
        console.log('✅ User already verified (idempotency check):', email)
        return NextResponse.json(
          { 
            message: 'Email is already verified', 
            alreadyVerified: true,
            verified: true,
            email: existingUser.email,
          },
          { status: 200 }
        )
      }
    }

    // Find verification token
    let verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    })

    // If not found with exact match, try without trimming or with different encoding
    if (!verificationToken) {
      console.log('⚠️ Token not found with exact match, trying alternative lookups...')
      
      // Try with trimmed token
      const trimmedToken = token.trim()
      if (trimmedToken !== token) {
        verificationToken = await prisma.verificationToken.findUnique({
          where: { token: trimmedToken },
        })
        if (verificationToken) {
          console.log('✅ Found token after trimming')
        }
      }
    }

    if (!verificationToken) {
      console.log('⚠️ Verification: Token not found in database - may have been used already')
      
      // Token might have been deleted because verification already succeeded
      // If email was provided in URL, check user status directly (idempotency)
      if (email) {
        const existingUser = await prisma.user.findUnique({
          where: { email },
        })
        
        if (existingUser) {
          if (existingUser.emailVerified) {
            console.log('✅ User already verified (token deleted but email verified):', email)
            return NextResponse.json(
              { 
                message: 'Email is already verified', 
                alreadyVerified: true,
                verified: true,
                email: existingUser.email,
              },
              { status: 200 }
            )
          } else {
            // User exists but not verified - token was deleted prematurely
            console.log('⚠️ Token deleted but user not verified - requesting new verification:', email)
            return NextResponse.json(
              { 
                error: 'This verification link has already been used. Please request a new verification email from the login page.',
                alreadyUsed: true,
                email: email,
              },
              { status: 400 }
            )
          }
        }
      }
      
      // If we can't determine user status, return helpful error
      console.log('📋 Checking for available tokens...')
      type VerificationTokenWithSelected = Prisma.VerificationTokenGetPayload<{
        select: {
          token: true
          identifier: true
          expires: true
        }
      }>

      const availableTokens: VerificationTokenWithSelected[] = await prisma.verificationToken.findMany({
        take: 5,
        select: { token: true, identifier: true, expires: true },
      })
      console.log('📋 Available tokens in database:', availableTokens.map((t: VerificationTokenWithSelected) => ({
        token: t.token.substring(0, 10) + '...',
        identifier: t.identifier,
        expires: t.expires,
        isExpired: t.expires < new Date(),
      })))
      
      // Return a helpful error message
      return NextResponse.json(
        { 
          error: 'This verification link has already been used. If your email is not yet verified, please request a new verification email from the login page.',
          alreadyUsed: true,
        },
        { status: 400 }
      )
    }

    console.log('✅ Token found:', {
      identifier: verificationToken.identifier,
      expires: verificationToken.expires,
      now: new Date(),
      isExpired: verificationToken.expires < new Date(),
    })

    // Check if token has expired
    const now = new Date()
    if (verificationToken.expires < now) {
      console.error('❌ Verification: Token expired', {
        expires: verificationToken.expires,
        now: now,
        diffMinutes: Math.round((now.getTime() - verificationToken.expires.getTime()) / 1000 / 60),
      })
      
      // Delete expired token
      await prisma.verificationToken.delete({
        where: { token: verificationToken.token },
      })
      return NextResponse.json(
        { 
          error: 'Verification token has expired. Please request a new one using the "Resend Verification Email" option on the login page.',
          expired: true,
        },
        { status: 400 }
      )
    }

    // Security check: If email was provided in URL, verify it matches token identifier
    if (email && email.toLowerCase() !== verificationToken.identifier.toLowerCase()) {
      console.error('❌ Verification: Email mismatch', {
        urlEmail: email,
        tokenIdentifier: verificationToken.identifier,
      })
      return NextResponse.json(
        { error: 'Email mismatch. Please use the verification link sent to your email address.' },
        { status: 400 }
      )
    }

    // Find user by email (use token identifier as source of truth)
    const userEmail = email || verificationToken.identifier
    const user = await prisma.user.findUnique({
      where: { email: userEmail.toLowerCase() },
    })

    if (!user) {
      console.error('❌ Verification: User not found for email:', userEmail)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    console.log('👤 User found:', {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
    })

    // Check if already verified
    if (user.emailVerified) {
      console.log('ℹ️ User already verified - returning success (token may have been used)')
      // Try to delete token, but don't fail if it's already deleted
      try {
        await prisma.verificationToken.delete({
          where: { token: verificationToken.token },
        })
        console.log('🗑️ Token deleted (user already verified)')
      } catch (deleteError: any) {
        // Token might have been deleted already - that's okay
        console.log('⚠️ Token already deleted:', deleteError.message)
      }
      
      return NextResponse.json(
        { 
          message: 'Email is already verified', 
          alreadyVerified: true,
          verified: true,
          email: user.email,
        },
        { status: 200 }
      )
    }

    // Verify the email
    console.log('✅ Verifying email for user:', user.email)
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
      },
    })

    console.log('✅ Email verified successfully:', {
      userId: updatedUser.id,
      email: updatedUser.email,
      emailVerified: updatedUser.emailVerified,
    })

    // Delete used token AFTER successful verification
    // Use try-catch to handle race condition where token might be deleted by another request
    try {
      await prisma.verificationToken.delete({
        where: { token: verificationToken.token },
      })
      console.log('🗑️ Token deleted after successful verification')
    } catch (deleteError: any) {
      // Token might have been deleted already (race condition) - that's okay
      console.log('⚠️ Token already deleted (possibly by another request):', deleteError.message)
    }

    return NextResponse.json(
      { 
        message: 'Email verified successfully', 
        verified: true,
        email: updatedUser.email,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { error: 'An error occurred during email verification' },
      { status: 500 }
    )
  }
}

