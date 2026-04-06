import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { authenticator } from 'otplib'
import QRCode from 'qrcode'

/**
 * GET /api/auth/mfa — Get MFA status for current user
 */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { mfaEnabled: true },
  })

  return NextResponse.json({ mfaEnabled: user?.mfaEnabled ?? false })
}

/**
 * POST /api/auth/mfa — Enable MFA (generate secret + QR code)
 */
export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const secret = authenticator.generateSecret()
  const otpauth = authenticator.keyuri(
    session.user.email || session.user.id,
    'wrkportal',
    secret
  )

  // Store secret temporarily (user must verify before it's active)
  await prisma.user.update({
    where: { id: session.user.id },
    data: { mfaSecret: secret, mfaEnabled: false },
  })

  const qrCode = await QRCode.toDataURL(otpauth)

  return NextResponse.json({
    secret,
    qrCode,
    message: 'Scan QR code with your authenticator app, then verify with POST /api/auth/mfa/verify',
  })
}

/**
 * DELETE /api/auth/mfa — Disable MFA
 */
export async function DELETE(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { token } = body

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { mfaSecret: true, mfaEnabled: true },
  })

  if (!user?.mfaEnabled || !user?.mfaSecret) {
    return NextResponse.json({ error: 'MFA is not enabled' }, { status: 400 })
  }

  // Verify token before disabling
  const isValid = authenticator.verify({ token, secret: user.mfaSecret })
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { mfaSecret: null, mfaEnabled: false },
  })

  return NextResponse.json({ success: true, message: 'MFA disabled' })
}
