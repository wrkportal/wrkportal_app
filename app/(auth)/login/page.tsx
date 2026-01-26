'use client'

import { useState, useEffect, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Mail, Lock, Chrome, AlertCircle, Building2, MailCheck, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

// Component to handle OAuth error from URL params
function OAuthErrorHandler({ onError }: { onError: (error: string) => void }) {
    const searchParams = useSearchParams()

    useEffect(() => {
        const errorParam = searchParams.get('error')
        const emailParam = searchParams.get('email')
        const providerParam = searchParams.get('provider')
        const reasonParam = searchParams.get('reason')
        
        // Check if we need to redirect to verify-email page
        if (errorParam === 'AccessDenied' && emailParam && providerParam === 'google') {
            // Redirect to verify-email page with email parameter
            const verifyUrl = `/verify-email?email=${encodeURIComponent(emailParam)}&provider=google&reason=${reasonParam || 'unverified'}`
            router.push(verifyUrl)
            return
        }
        
        if (errorParam === 'AccessDenied') {
            onError('Please sign up first before using Google sign-in. Click "Sign up" to create an account.')
        } else if (errorParam === 'Configuration') {
            onError('Authentication configuration error. Please try again or contact support.')
        } else if (errorParam === 'Verification') {
            onError('Email verification required. Please check your email and verify your account.')
        }
    }, [searchParams, onError, router])

    return null
}

function LoginPageContent({ initialError = '', onErrorChange }: { initialError?: string; onErrorChange?: (error: string) => void }) {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(initialError)
    const [loading, setLoading] = useState(false)
    const [showSSO, setShowSSO] = useState(false)
    const [ssoIdentifier, setSsoIdentifier] = useState('')
    const [showResendVerification, setShowResendVerification] = useState(false)
    const [resendLoading, setResendLoading] = useState(false)
    const [resendSuccess, setResendSuccess] = useState(false)

    // Sync error state from parent
    useEffect(() => {
        if (initialError) {
            setError(initialError)
        }
    }, [initialError])

    // Update parent when error changes
    useEffect(() => {
        if (onErrorChange) {
            onErrorChange(error)
        }
    }, [error, onErrorChange])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        onErrorChange?.('')
        setLoading(true)

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            })

            if (result?.error) {
                // Check if error is related to email verification
                const errorMessage = result.error.toLowerCase()
                if (errorMessage.includes('email_not_verified') || errorMessage.includes('verify')) {
                    setError('Please verify your email address before signing in. Check your inbox for the verification link.')
                    setShowResendVerification(true)
                } else {
                    setError('Invalid email or password')
                }
            } else {
                console.log('[Login] ✅ Login successful, clearing cache and redirecting...')

                // Clear auth store cache to force fresh fetch
                useAuthStore.getState().setUser(null)

                // Clear localStorage cache
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('auth-storage')
                    console.log('[Login] Cleared localStorage cache')
                }

                // Force a hard navigation to wrkboard directly
                // This avoids the race condition with session establishment
                console.log('[Login] Redirecting to wrkboard...')
                window.location.href = '/wrkboard'
            }
        } catch (error) {
            setError('An error occurred. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleSignIn = async () => {
        console.log('Google Sign-In button clicked!')
        setLoading(true)
        setError('')
        onErrorChange?.('')

        try {
            // Clear any signup flag to ensure login flow
            if (typeof window !== 'undefined') {
                sessionStorage.removeItem('oauth_signup_flow')
            }
            
            console.log('Calling signIn with google provider...')
            // Use signIn from next-auth/react for proper OAuth flow
            await signIn('google', {
                callbackUrl: '/wrkboard',
                redirect: true, // Will redirect on success
            })

            // This code will only run if there's an error (redirect prevents reaching here)
        } catch (error) {
            console.error('Google Sign-In exception:', error)
            setError('Failed to sign in with Google. Please try again.')
            setLoading(false)
        }
    }

    const handleSSOLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        onErrorChange?.('')
        setLoading(true)

        try {
            // Call the SSO API endpoint to get the organization's SSO configuration
            const response = await fetch('/api/auth/sso/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier: ssoIdentifier }),
            })

            const data = await response.json()

            if (!response.ok) {
                setError(data.error || 'Organization not found or SSO not configured')
                setLoading(false)
                return
            }

            // If SSO is configured, redirect to the SSO provider
            if (data.ssoProvider === 'SAML') {
                // Redirect to SAML SSO endpoint
                window.location.href = `/api/auth/saml/login?tenant=${data.tenantId}`
            } else if (data.ssoProvider === 'OIDC') {
                // Use NextAuth with OIDC provider
                const result = await signIn('oidc', {
                    callbackUrl: '/wrkboard',
                    redirect: true,
                    tenant: data.tenantId,
                })
            } else if (data.ssoProvider === 'AZURE_AD') {
                // Use NextAuth with Azure AD
                const result = await signIn('azure-ad', {
                    callbackUrl: '/wrkboard',
                    redirect: true,
                    tenant: data.tenantId,
                })
            } else {
                setError('SSO provider not supported')
            }
        } catch (error) {
            setError('An error occurred during SSO login. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex relative bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
            {/* Form Container - Left Side */}
            <div className="relative z-10 w-full lg:w-1/2 min-h-screen flex items-center justify-center p-3 sm:p-4 lg:p-8">
                <div className="w-full max-w-[280px] sm:max-w-[320px] md:max-w-sm">
                    {/* Logo/Brand */}
                    <div className="text-center mb-3 sm:mb-4 md:mb-5">
                        <div className="flex items-center justify-center gap-2 mb-1.5">
                            <Image
                                src="/logo.png"
                                alt="wrkportal.com Logo"
                                width={110}
                                height={33}
                                className="h-7 sm:h-7 md:h-8 w-auto object-contain"
                            />
                        </div>
                        <p className="text-slate-600 text-xs sm:text-sm">Welcome Back</p>
                    </div>

                    <Card className="border border-slate-200 bg-white shadow-xl">
                        <CardHeader className="space-y-1 pb-3 sm:pb-4 px-3 sm:px-4 md:px-5">
                            <CardTitle className="text-base sm:text-lg md:text-xl font-bold text-slate-900">Sign In</CardTitle>
                            <CardDescription className="text-xs sm:text-sm text-slate-600">Enter your credentials to continue</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2.5 sm:space-y-3 px-3 sm:px-4 md:px-5 pb-3 sm:pb-4">
                            {/* SSO Login Button */}
                            <Button
                                variant="outline"
                                className="w-full border border-purple-200 hover:border-purple-300 hover:bg-purple-50 text-slate-700 text-xs sm:text-sm h-8 sm:h-9"
                                onClick={() => setShowSSO(!showSSO)}
                                disabled={loading}
                            >
                                <Building2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                                Log in with SSO
                            </Button>

                            {/* SSO Form (expandable) */}
                            {showSSO && (
                                <form onSubmit={handleSSOLogin} className="space-y-2 sm:space-y-2.5 p-2.5 sm:p-3 bg-purple-50 rounded-lg border border-purple-200">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="ssoIdentifier" className="text-xs sm:text-sm font-medium text-slate-700">
                                            Organization Domain or ID
                                        </Label>
                                        <Input
                                            id="ssoIdentifier"
                                            type="text"
                                            placeholder="company.com"
                                            value={ssoIdentifier}
                                            onChange={(e) => setSsoIdentifier(e.target.value)}
                                            required
                                            disabled={loading}
                                            className="bg-white border-purple-200 text-slate-900 placeholder:text-slate-400 text-sm h-8 sm:h-9"
                                        />
                                        <p className="text-[10px] sm:text-xs text-slate-500">
                                            Enter your organization&apos;s domain
                                        </p>
                                    </div>
                                    <Button type="submit" className="w-full text-xs sm:text-sm h-8 sm:h-9 bg-purple-600 hover:bg-purple-700" disabled={loading || !ssoIdentifier}>
                                        {loading ? 'Verifying...' : 'Continue with SSO'}
                                    </Button>
                                </form>
                            )}

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <Separator className="bg-slate-200" />
                                </div>
                                <div className="relative flex justify-center text-[10px] sm:text-xs uppercase">
                                    <span className="bg-white px-2 text-slate-500">Or continue with</span>
                                </div>
                            </div>

                            {/* Google Sign In */}
                            <Button
                                variant="outline"
                                className="w-full border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm h-8 sm:h-9"
                                onClick={handleGoogleSignIn}
                                disabled={loading}
                            >
                                <Chrome className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                                Continue with Google
                            </Button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <Separator className="bg-slate-200" />
                                </div>
                                <div className="relative flex justify-center text-[10px] sm:text-xs uppercase">
                                    <span className="bg-white px-2 text-slate-500">Or use email</span>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-xs sm:text-sm text-red-700 bg-red-50 border border-red-200 p-2.5 sm:p-3 rounded-lg">
                                        <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                        {error}
                                    </div>

                                    {/* Resend Verification Button */}
                                    {showResendVerification && (
                                        <div className="space-y-2">
                                            {resendSuccess ? (
                                                <div className="flex items-center gap-2 text-xs sm:text-sm text-green-700 bg-green-50 border border-green-200 p-2.5 sm:p-3 rounded-lg">
                                                    <MailCheck className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                                    Verification email sent! Please check your inbox.
                                                </div>
                                            ) : (
                                                <Button
                                                    type="button"
                                                    onClick={async () => {
                                                        if (!email) {
                                                            setError('Please enter your email address first')
                                                            return
                                                        }
                                                        setResendLoading(true)
                                                        setResendSuccess(false)
                                                        try {
                                                            const response = await fetch('/api/auth/resend-verification', {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({ email }),
                                                            })
                                                            const data = await response.json()
                                                            if (response.ok) {
                                                                setResendSuccess(true)
                                                                setTimeout(() => setResendSuccess(false), 5000)
                                                            } else {
                                                                setError(data.error || 'Failed to resend verification email')
                                                            }
                                                        } catch (error) {
                                                            setError('An error occurred. Please try again.')
                                                        } finally {
                                                            setResendLoading(false)
                                                        }
                                                    }}
                                                    variant="outline"
                                                    className="w-full border border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 text-xs sm:text-sm h-8 sm:h-9"
                                                    disabled={resendLoading || !email}
                                                >
                                                    {resendLoading ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                                                            Sending...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Mail className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                                                            Resend Verification Email
                                                        </>
                                                    )}
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Email/Password Form */}
                            <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="email" className="text-xs sm:text-sm text-slate-700">Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-2.5 sm:left-3 top-2.5 sm:top-3 h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="name@company.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="pl-8 sm:pl-10 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm h-8 sm:h-9"
                                            required
                                            disabled={loading}
                                            autoComplete="email"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password" className="text-xs sm:text-sm text-slate-700">Password</Label>
                                        <Link
                                            href="/forgot-password"
                                            className="text-[10px] sm:text-xs text-purple-600 hover:text-purple-700 hover:underline"
                                        >
                                            Forgot?
                                        </Link>
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-2.5 sm:left-3 top-2.5 sm:top-3 h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="pl-8 sm:pl-10 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm h-8 sm:h-9"
                                            required
                                            disabled={loading}
                                            autoComplete="current-password"
                                        />
                                    </div>
                                </div>

                                <Button type="submit" className="w-full text-xs sm:text-sm h-8 sm:h-9 bg-purple-600 hover:bg-purple-700" disabled={loading}>
                                    {loading ? 'Signing in...' : 'Sign in'}
                                </Button>
                            </form>

                            {/* Sign Up Link */}
                            <div className="text-center text-xs sm:text-sm">
                                <span className="text-slate-600">Don&apos;t have an account? </span>
                                <Link
                                    href="/signup"
                                    className="text-purple-600 hover:text-purple-700 font-medium hover:underline"
                                >
                                    Sign up
                                </Link>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Footer */}
                    <p className="text-center text-[10px] sm:text-xs text-slate-500 mt-3 sm:mt-4">
                        By signing in, you agree to our{' '}
                        <Link href="/terms" className="underline hover:text-slate-700">
                            Terms
                        </Link>
                        {' and '}
                        <Link href="/privacy" className="underline hover:text-slate-700">
                            Privacy Policy
                        </Link>
                    </p>
                </div>
            </div>

            {/* Right Side - Inspirational Content */}
            <div className="hidden lg:flex lg:w-1/2 min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 p-12 items-center justify-center relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl opacity-20"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500 rounded-full filter blur-3xl opacity-20"></div>

                <div className="relative z-10 max-w-md text-white space-y-8">
                    <div className="space-y-4">
                        <h1 className="text-4xl font-bold leading-tight">
                            Welcome to <br />
                            <span className="text-purple-200">wrkportal.com</span>
                        </h1>
                        <p className="text-lg text-purple-100">
                            Your Ultimate Project Management Platform
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                                <svg className="w-6 h-6 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg mb-1">AI-Powered Intelligence</h3>
                                <p className="text-purple-200 text-sm">Leverage AI to predict risks, optimize resources, and accelerate decisions</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                                <svg className="w-6 h-6 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg mb-1">Real-Time Collaboration</h3>
                                <p className="text-purple-200 text-sm">Unite your teams with seamless communication and live updates</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                                <svg className="w-6 h-6 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg mb-1">Advanced Analytics</h3>
                                <p className="text-purple-200 text-sm">Track performance with powerful dashboards and insights</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-white/20">
                        <p className="text-purple-200 italic">
                            "Transform the way you manage projects. Empower your teams. Drive success."
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function LoginPage() {
    const [error, setError] = useState('')

    return (
        <>
            <Suspense fallback={null}>
                <OAuthErrorHandler onError={setError} />
            </Suspense>
            <LoginPageContent initialError={error} onErrorChange={setError} />
        </>
    )
}
