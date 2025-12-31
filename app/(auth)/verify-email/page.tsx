'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react'
import Image from 'next/image'
import { ContactSupportDialog } from '@/components/contact-support-dialog'

// Global flag to prevent duplicate requests across all instances (for React StrictMode)
let globalVerificationInProgress = false
const verificationRequestCache = new Map<string, Promise<any>>()

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const email = searchParams.get('email')
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already-verified'>('loading')
  const [message, setMessage] = useState('')
  const hasVerifiedRef = useRef(false) // Use ref to prevent duplicate requests (more reliable than state)
  const [showContactDialog, setShowContactDialog] = useState(false)

  useEffect(() => {
    // Prevent running multiple times (React StrictMode issue)
    if (hasVerifiedRef.current) {
      console.log('⏭️ Skipping duplicate verification request (ref check)')
      return
    }

    if (!token) {
      setStatus('error')
      setMessage('Verification token is missing')
      return
    }

    // Check global flag to prevent duplicate requests across React StrictMode double renders
    const requestKey = `${token}-${email || 'no-email'}`
    if (verificationRequestCache.has(requestKey)) {
      console.log('⏭️ Using cached verification request')
      verificationRequestCache.get(requestKey)!.then((result) => {
        handleVerificationResult(result)
      }).catch((error) => {
        console.error('Cached request error:', error)
        setStatus('error')
        setMessage('An error occurred while verifying your email')
      })
      return
    }

    const verifyEmail = async () => {
      // Set flags immediately to prevent duplicate requests
      hasVerifiedRef.current = true
      globalVerificationInProgress = true
      
      console.log('🔄 Starting verification request (first time only):', { 
        hasToken: !!token, 
        hasEmail: !!email,
        tokenPreview: token.substring(0, 10) + '...'
      })

      try {
        // Ensure token and email are properly URL encoded
        const encodedToken = encodeURIComponent(token)
        // Build URL with both token and email (email helps with idempotency)
        let verifyUrl = `/api/auth/verify-email?token=${encodedToken}`
        if (email) {
          const encodedEmail = encodeURIComponent(email)
          verifyUrl += `&email=${encodedEmail}`
        }
        
        // Create and cache the request
        const requestPromise = fetch(verifyUrl).then(async (response) => {
          const data = await response.json()
          return { response, data }
        })
        
        verificationRequestCache.set(requestKey, requestPromise)
        
        const { response, data } = await requestPromise
        
        // Clean up cache after a delay
        setTimeout(() => {
          verificationRequestCache.delete(requestKey)
          globalVerificationInProgress = false
        }, 5000)
        
        handleVerificationResult({ response, data })
      } catch (error) {
        // Clean up on error too
        verificationRequestCache.delete(requestKey)
        globalVerificationInProgress = false
        
        console.error('Verification error:', error)
        setStatus('error')
        setMessage('An error occurred while verifying your email')
      }
    }

    verifyEmail()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount - use ref and cache to track if already executed

  // Helper function to handle verification result
  const handleVerificationResult = ({ response, data }: { response: Response, data: any }) => {
    console.log('📬 Verification response:', { status: response.status, data })

    if (response.ok) {
      if (data.alreadyVerified || data.verified) {
        // Show success state - either already verified or just verified
        if (data.alreadyVerified) {
          setStatus('already-verified')
          setMessage('Your email is already verified')
        } else {
          setStatus('success')
          setMessage(data.message || 'Your email has been verified successfully!')
        }
      } else {
        // Response OK but no verified flag - treat as success
        setStatus('success')
        setMessage(data.message || 'Your email has been verified successfully!')
      }
    } else {
      // Handle specific error cases
      setStatus('error')
      
      if (data.alreadyUsed) {
        // Token was used - if email is verified, show success instead of error
        if (email) {
          // Check if user is actually verified by making a quick check
          // But for now, just show helpful message
          setMessage('This verification link has already been used. If your email is verified, you can proceed to login.')
        } else {
          setMessage(data.error || 'This verification link has already been used. Please request a new verification email from the login page.')
        }
      } else if (data.expired) {
        setMessage('This verification link has expired. Please request a new verification email from the login page.')
      } else {
        setMessage(data.error || 'Failed to verify email. Please try again or request a new verification email.')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4">
      <Card className="w-full max-w-md border border-slate-200 bg-white shadow-xl">
        <CardHeader className="space-y-1 pb-4 text-center">
          <div className="flex items-center justify-center mb-4">
            <Image 
              src="/logo.png" 
              alt="wrkportal.com Logo" 
              width={110} 
              height={33}
              className="h-7 w-auto object-contain"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">
            Email Verification
          </CardTitle>
          <CardDescription className="text-slate-600">
            {status === 'loading' && 'Verifying your email address...'}
            {status === 'success' && 'Verification complete'}
            {status === 'already-verified' && 'Already verified'}
            {status === 'error' && 'Verification failed'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-purple-600 mb-4" />
              <p className="text-slate-600 text-sm">Please wait while we verify your email...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-slate-900 font-semibold text-lg">{message}</p>
                <p className="text-slate-600 text-sm">
                  You can now access all features of wrkportal.com.
                </p>
              </div>
              <Button
                onClick={() => router.push('/login')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                Continue to Login
              </Button>
            </div>
          )}

          {status === 'already-verified' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-blue-600" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-slate-900 font-semibold text-lg">{message}</p>
                <p className="text-slate-600 text-sm">
                  Your email was already verified. You can proceed to login.
                </p>
              </div>
              <Button
                onClick={() => router.push('/login')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                Continue to Login
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-slate-900 font-semibold text-lg">{message}</p>
                <p className="text-slate-600 text-sm">
                  The verification link may have expired or is invalid.
                </p>
              </div>
              <div className="space-y-3 w-full">
                <Button
                  onClick={() => router.push('/login')}
                  variant="outline"
                  className="w-full border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Go to Login
                </Button>
                <Button
                  onClick={() => router.push('/signup')}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Sign Up Again
                </Button>
              </div>
            </div>
          )}

          <div className="text-center text-xs text-slate-500 pt-4 border-t border-slate-200">
            <p>
              Need help?{' '}
              <button
                onClick={() => setShowContactDialog(true)}
                className="text-purple-600 hover:text-purple-700 underline cursor-pointer"
              >
                Contact Support
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
      <ContactSupportDialog open={showContactDialog} onOpenChange={setShowContactDialog} />
    </div>
  )
}

