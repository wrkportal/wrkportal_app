import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')
    const emailParam = searchParams.get('email')?.toLowerCase()

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 })
    }

    // If email provided, short-circuit if already verified
    if (emailParam) {
      const existingUser = await prisma.user.findUnique({ where: { email: emailParam } })
      if (existingUser?.emailVerified) {
        return NextResponse.json({ alreadyVerified: true }, { status: 200 })
      }
    }

    const record = await prisma.verificationToken.findUnique({
      where: { token },
    })

    if (!record) {
      return NextResponse.json(
        { error: 'Verification link has already been used or is invalid.' },
        { status: 400 }
      )
    }

    if (record.expires < new Date()) {
      await prisma.verificationToken.delete({ where: { token } })
      return NextResponse.json(
        { error: 'Verification link has expired.' },
        { status: 400 }
      )
    }

    const email = emailParam || record.identifier.toLowerCase()

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 })
    }

    if (!user.emailVerified) {
      await prisma.user.update({
        where: { email },
        data: { emailVerified: new Date() },
      })
    }

    await prisma.verificationToken.delete({ where: { token } })

    return NextResponse.json({ verified: true }, { status: 200 })
  } catch (err) {
    console.error('VERIFY EMAIL ERROR:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
