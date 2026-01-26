'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { ContactSupportDialog } from '@/components/contact-support-dialog'

// Prevent duplicate verification calls (StrictMode + refresh safe)
const verificationCache = new Map<string, Promise<any>>()

function VerifyEmailInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const email = searchParams.get('email')

  const [status, setStatus] = useState<'loading' | 'success' | 'already' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const hasRun = useRef(false)
  const [showSupport, setShowSupport] = useState(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    // If no token but email is provided, show "check your email" message
    // This happens when user is redirected from OAuth signup before clicking email link
    if (!token && email) {
      setStatus('success') // Use success state to show friendly message
      setMessage('Please check your email inbox and click the verification link we sent you.')
      return
    }

    if (!token) {
      setStatus('error')
      setMessage('Verification token is missing or invalid.')
      return
    }

    const key = `${token}-${email ?? 'no-email'}`

    if (verificationCache.has(key)) {
      verificationCache.get(key)!
        .then(handleResult)
        .catch(() => {
          setStatus('error')
          setMessage('Verification failed.')
        })
      return
    }

    const verifyPromise = fetch(
      `/api/auth/verify-email?token=${encodeURIComponent(token)}${email ? `&email=${encodeURIComponent(email)}` : ''
      }`,
      { cache: 'no-store' }
    ).then(async (res) => ({ res, data: await res.json() }))

    verificationCache.set(key, verifyPromise)

    verifyPromise
      .then(handleResult)
      .catch(() => {
        setStatus('error')
        setMessage('Verification failed.')
      })
  }, [token, email])

  function handleResult({ res, data }: any) {
    if (res.ok) {
      if (data.alreadyVerified) {
        setStatus('already')
        setMessage('Your email is already verified.')
      } else {
        setStatus('success')
        setMessage('Your email has been verified successfully.')
      }
    } else {
      setStatus('error')
      setMessage(
        data?.error ||
        'This verification link is invalid or expired. Please request a new one.'
      )
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4">
      <Card className="w-full max-w-md bg-white shadow-xl">
        <CardHeader className="text-center">
          <Image src="/logo.png" alt="wrkportal" width={110} height={33} className="mx-auto mb-4" />
          <CardTitle>Email Verification</CardTitle>
          <CardDescription>
            {status === 'loading' && 'Verifying your email…'}
            {status === 'success' && (token ? 'Verification successful' : 'Check your email')}
            {status === 'already' && 'Already verified'}
            {status === 'error' && 'Verification failed'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {status === 'loading' && (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-purple-600 mb-4" />
              <p className="text-sm text-slate-600">Please wait…</p>
            </div>
          )}

          {(status === 'success' || status === 'already') && (
            <div className="text-center space-y-4 py-6">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
              <p className="font-semibold text-slate-900">{message}</p>
              {!token && email ? (
                // Show "check email" state - user hasn't clicked link yet
                <div className="space-y-2">
                  <p className="text-sm text-slate-600">
                    We sent a verification link to <strong>{email}</strong>
                  </p>
                  <p className="text-xs text-slate-500">
                    Click the link in your email to verify your account and complete signup.
                  </p>
                </div>
              ) : (
                // Show "verified" state - user clicked link and verified
                <Button
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  onClick={() => {
                    if (!router) {
                      console.error('[VerifyEmail] Router not available')
                      return
                    }
                    router.push('/login')
                  }}
                >
                  Continue to Login
                </Button>
              )}
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-4 py-6">
              <XCircle className="h-12 w-12 text-red-600 mx-auto" />
              <p className="font-semibold text-slate-900">{message}</p>
              <Button variant="outline" className="w-full" onClick={() => router.push('/login')}>
                Go to Login
              </Button>
            </div>
          )}

          <div className="text-xs text-center text-slate-500 border-t pt-4">
            Need help?{' '}
            <button
              onClick={() => setShowSupport(true)}
              className="text-purple-600 underline"
            >
              Contact support
            </button>
          </div>
        </CardContent>
      </Card>

      <ContactSupportDialog open={showSupport} onOpenChange={setShowSupport} />
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
      <VerifyEmailInner />
    </Suspense>
  )
}
