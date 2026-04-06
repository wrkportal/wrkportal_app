import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { authenticator } from 'otplib'

/**
 * POST /api/auth/mfa/verify — Verify TOTP token and activate MFA
 */
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { token } = body

  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { mfaSecret: true, mfaEnabled: true },
  })

  if (!user?.mfaSecret) {
    return NextResponse.json(
      { error: 'MFA setup not initiated. Call POST /api/auth/mfa first.' },
      { status: 400 }
    )
  }

  const isValid = authenticator.verify({ token, secret: user.mfaSecret })

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 })
  }

  // Activate MFA
  await prisma.user.update({
    where: { id: session.user.id },
    data: { mfaEnabled: true },
  })

  return NextResponse.json({ success: true, message: 'MFA enabled successfully' })
}
