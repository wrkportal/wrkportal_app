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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Mail, Lock, User, Building2, Chrome, AlertCircle, CheckCircle2, Users } from 'lucide-react'
import { WorkspaceType } from '@/types'

// Component to handle OAuth error from URL params - wrapped in Suspense
function OAuthErrorHandler({ onError }: { onError: (error: string) => void }) {
    const searchParams = useSearchParams()
    const router = useRouter()

    useEffect(() => {
        const errorParam = searchParams.get('error')
        const emailParam = searchParams.get('email')
        const providerParam = searchParams.get('provider')
        const reasonParam = searchParams.get('reason')

        // Check if we need to redirect to verify-email page
        if (errorParam === 'AccessDenied' && emailParam && providerParam === 'google') {
            // Redirect to verify-email page with email parameter
            const verifyUrl = `/verify-email?email=${encodeURIComponent(emailParam)}&provider=google&reason=${reasonParam || 'new'}`
            if (!router) {
              console.error('[Signup] Router not available')
              return
            }
            router.push(verifyUrl)
            return
        }

        if (errorParam === 'AccessDenied') {
            onError('Account creation failed. This may be due to a temporary database issue. Please try again in a moment.')
        }
    }, [searchParams, onError, router])

    return null
}

function SignupPageContent({ initialError = '', onErrorChange }: { initialError?: string; onErrorChange?: (error: string) => void }) {
    const router = useRouter()
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        organizationName: '',
        workspaceType: WorkspaceType.ORGANIZATION,
    })
    const [error, setError] = useState(initialError)
    const [loading, setLoading] = useState(false)
    const [showVerificationMessage, setShowVerificationMessage] = useState(false)
    const [userEmail, setUserEmail] = useState('')
    const [resendLoading, setResendLoading] = useState(false)
    const [resendSuccess, setResendSuccess] = useState(false)
    const [resendError, setResendError] = useState('')

    // Sync error state from parent
    useEffect(() => {
        if (initialError) {
            setError(initialError)
        }
    }, [initialError])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        onErrorChange?.('')

        // Validation
        if (formData.password !== formData.confirmPassword) {
            const errMsg = 'Passwords do not match'
            setError(errMsg)
            onErrorChange?.(errMsg)
            return
        }

        if (formData.password.length < 8) {
            const errMsg = 'Password must be at least 8 characters'
            setError(errMsg)
            onErrorChange?.(errMsg)
            return
        }

        setLoading(true)

        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            const data = await response.json()

            if (!response.ok) {
                // Show detailed error message
                const errorMessage = data.details || data.error || 'Failed to create account'
                console.error('Signup error:', {
                    status: response.status,
                    error: data.error,
                    details: data.details,
                    code: data.code,
                })
                throw new Error(errorMessage)
            }

            // Show verification message instead of auto-signing in
            setUserEmail(formData.email)
            setShowVerificationMessage(true)
            setLoading(false)

            // Store emailSent status for display
            if (data.emailSent === false) {
                const errMsg = 'Account created, but verification email could not be sent. Please use the "Resend Verification Email" option on the login page.'
                setError(errMsg)
                onErrorChange?.(errMsg)
            }
        } catch (error: any) {
            const errMsg = error.message || 'An error occurred. Please try again.'
            setError(errMsg)
            onErrorChange?.(errMsg)
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleSignUp = async () => {
        setLoading(true)
        setError('')
        onErrorChange?.('')
        try {
            // Store signup flag in sessionStorage to detect signup flow in OAuth callback
            if (typeof window !== 'undefined') {
                sessionStorage.setItem('oauth_signup_flow', 'true')
            }

            // Use current origin to ensure correct redirect
            const callbackUrl = typeof window !== 'undefined'
                ? `${window.location.origin}/wrkboard?signup=success`
                : '/wrkboard'

            console.log('🔍 Google Sign-Up - Callback URL:', callbackUrl)
            console.log('🔍 Google Sign-Up - Current Origin:', typeof window !== 'undefined' ? window.location.origin : 'N/A')

            await signIn('google', {
                callbackUrl: callbackUrl,
                redirect: true,
            })
        } catch (error: any) {
            console.error('❌ Google Sign-Up error:', error)
            // Don't set loading to false if redirect is happening
            if (error?.message?.includes('redirect')) {
                // Redirect is happening, don't show error
                return
            }
            const errMsg = 'Failed to sign up with Google. Please check your browser console for details.'
            setError(errMsg)
            onErrorChange?.(errMsg)
            setLoading(false)
        }
    }

    const handleResendVerification = async () => {
        if (!userEmail) {
            setResendError('Email address is required')
            return
        }

        setResendLoading(true)
        setResendError('')
        setResendSuccess(false)

        try {
            const response = await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail }),
            })

            const data = await response.json()

            if (response.ok) {
                setResendSuccess(true)
                setResendError('')
                // Clear success message after 5 seconds
                setTimeout(() => {
                    setResendSuccess(false)
                }, 5000)
            } else {
                setResendError(data.error || 'Failed to resend verification email')
            }
        } catch (error: any) {
            setResendError('An error occurred. Please try again.')
            console.error('Resend verification error:', error)
        } finally {
            setResendLoading(false)
        }
    }

    const passwordStrength = () => {
        const password = formData.password
        if (!password) return null

        const hasLength = password.length >= 8
        const hasNumber = /\d/.test(password)
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)
        const hasUpper = /[A-Z]/.test(password)

        return {
            hasLength,
            hasNumber,
            hasSpecial,
            hasUpper,
            strength:
                [hasLength, hasNumber, hasSpecial, hasUpper].filter(Boolean).length,
        }
    }

    const strength = passwordStrength()

    return (
        <div className="min-h-screen flex relative bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
            {/* Form Container - Left Side */}
            <div className="relative z-10 w-full lg:w-1/2 min-h-screen flex items-center justify-center p-3 sm:p-4 lg:p-8 py-6 sm:py-8">
                <div className="w-full max-w-[380px] sm:max-w-[420px] md:max-w-[450px] lg:max-w-[480px]">
                    {/* Logo/Brand */}
                    <div className="text-center mb-3 sm:mb-4">
                        <div className="flex items-center justify-center gap-2 mb-1.5">
                            <Image
                                src="/logo.png"
                                alt="wrkportal.com Logo"
                                width={160}
                                height={48}
                                className="h-12 w-auto object-contain"
                            />
                        </div>
                        <p className="text-slate-600 text-xs sm:text-sm">Create Your Account</p>
                    </div>

                    <Card className="border border-slate-200 bg-white shadow-xl">
                        <CardHeader className="space-y-1 pb-3 sm:pb-4 px-3 sm:px-4">
                            <CardTitle className="text-base sm:text-lg font-bold text-slate-900">Get Started</CardTitle>
                            <CardDescription className="text-xs sm:text-sm text-slate-600">
                                Join thousands of teams
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2.5 sm:space-y-3 px-3 sm:px-4 pb-3 sm:pb-4">
                            {/* Google Sign In */}
                            <Button
                                variant="outline"
                                className="w-full border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm h-8 sm:h-9"
                                onClick={handleGoogleSignUp}
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
                                    <span className="bg-white px-2 text-slate-500">
                                        Or sign up with email
                                    </span>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="flex items-center gap-2 text-xs sm:text-sm text-red-700 bg-red-50 border border-red-200 p-2.5 sm:p-3 rounded-lg">
                                    <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            {/* Verification Message */}
                            {showVerificationMessage && (
                                <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <Mail className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1 space-y-2">
                                            <h3 className="text-sm font-semibold text-blue-900">
                                                {error ? 'Account Created - Email Issue' : 'Check Your Email'}
                                            </h3>
                                            {error ? (
                                                <>
                                                    <p className="text-xs sm:text-sm text-blue-800">
                                                        Your account <strong>{userEmail}</strong> has been created successfully!
                                                    </p>
                                                    <p className="text-xs sm:text-sm text-orange-800 bg-orange-50 border border-orange-200 p-2 rounded">
                                                        ⚠️ However, the verification email could not be sent. This may be due to email configuration issues.
                                                    </p>
                                                    <p className="text-xs text-blue-700">
                                                        Please go to the login page and use the "Resend Verification Email" button after attempting to sign in.
                                                    </p>
                                                </>
                                            ) : (
                                                <>
                                                    <p className="text-xs sm:text-sm text-blue-800">
                                                        We've sent a verification link to <strong>{userEmail}</strong>.
                                                        Please click the link in the email to verify your account.
                                                    </p>
                                                    <p className="text-xs text-blue-700">
                                                        Didn't receive the email? Check your spam folder or click "Resend Link" below.
                                                    </p>

                                                    {/* Resend success message */}
                                                    {resendSuccess && (
                                                        <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 p-2 rounded">
                                                            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                                                            <span>Verification email sent successfully! Please check your inbox.</span>
                                                        </div>
                                                    )}

                                                    {/* Resend error message */}
                                                    {resendError && (
                                                        <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 p-2 rounded">
                                                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                                            <span>{resendError}</span>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {!error && (
                                            <Button
                                                type="button"
                                                onClick={handleResendVerification}
                                                disabled={resendLoading}
                                                className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm h-8 sm:h-9 disabled:opacity-50"
                                            >
                                                {resendLoading ? (
                                                    <>
                                                        <Mail className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-pulse" />
                                                        Sending...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Mail className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                                                        Resend Link
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                        <Button
                                            type="button"
                                            onClick={() => {
                                              if (!router) {
                                                console.error('[Signup] Router not available')
                                                return
                                              }
                                              router.push('/login')
                                            }}
                                            variant="outline"
                                            className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 text-xs sm:text-sm h-8 sm:h-9"
                                        >
                                            Go to Login
                                        </Button>
                                        {error && (
                                            <p className="text-xs text-center text-blue-700">
                                                On the login page, enter your email and password, then click "Resend Verification Email" if needed.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Signup Form */}
                            {!showVerificationMessage && (
                                <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="firstName" className="text-xs sm:text-sm text-slate-700">First Name</Label>
                                            <Input
                                                id="firstName"
                                                name="firstName"
                                                type="text"
                                                placeholder="John"
                                                value={formData.firstName}
                                                onChange={handleChange}
                                                required
                                                disabled={loading}
                                                autoComplete="given-name"
                                                className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm h-8 sm:h-9"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="lastName" className="text-xs sm:text-sm text-slate-700">Last Name</Label>
                                            <Input
                                                id="lastName"
                                                name="lastName"
                                                type="text"
                                                placeholder="Doe"
                                                value={formData.lastName}
                                                onChange={handleChange}
                                                required
                                                disabled={loading}
                                                autoComplete="family-name"
                                                className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm h-8 sm:h-9"
                                            />
                                        </div>
                                    </div>

                                    {/* Workspace Type Selection */}
                                    <div className="space-y-2">
                                        <Label className="text-xs sm:text-sm text-slate-700">What are you setting up?</Label>
                                        <RadioGroup
                                            value={formData.workspaceType}
                                            onValueChange={(value) => setFormData({ ...formData, workspaceType: value as WorkspaceType })}
                                            className="grid grid-cols-2 gap-2"
                                            disabled={loading}
                                        >
                                            <div>
                                                <RadioGroupItem value={WorkspaceType.ORGANIZATION} id="organization" className="peer sr-only" />
                                                <Label
                                                    htmlFor="organization"
                                                    className="flex flex-col items-center justify-between rounded-md border-2 border-slate-200 bg-white p-3 hover:bg-slate-50 hover:border-purple-300 peer-data-[state=checked]:border-purple-600 peer-data-[state=checked]:bg-purple-50 cursor-pointer transition-all"
                                                >
                                                    <Building2 className="mb-2 h-5 w-5 text-slate-600 peer-data-[state=checked]:text-purple-600" />
                                                    <div className="text-center">
                                                        <div className="text-xs sm:text-sm font-semibold text-slate-700">Organization</div>
                                                        <div className="text-[10px] sm:text-xs text-slate-500 mt-1">For companies & enterprises</div>
                                                    </div>
                                                </Label>
                                            </div>
                                            <div>
                                                <RadioGroupItem value={WorkspaceType.GROUP} id="group" className="peer sr-only" />
                                                <Label
                                                    htmlFor="group"
                                                    className="flex flex-col items-center justify-between rounded-md border-2 border-slate-200 bg-white p-3 hover:bg-slate-50 hover:border-purple-300 peer-data-[state=checked]:border-purple-600 peer-data-[state=checked]:bg-purple-50 cursor-pointer transition-all"
                                                >
                                                    <Users className="mb-2 h-5 w-5 text-slate-600 peer-data-[state=checked]:text-purple-600" />
                                                    <div className="text-center">
                                                        <div className="text-xs sm:text-sm font-semibold text-slate-700">Group</div>
                                                        <div className="text-[10px] sm:text-xs text-slate-500 mt-1">For teams & freelancers</div>
                                                    </div>
                                                </Label>
                                            </div>
                                        </RadioGroup>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="organizationName" className="text-xs sm:text-sm text-slate-700">
                                            {formData.workspaceType === WorkspaceType.ORGANIZATION ? 'Organization Name' : 'Group Name'}
                                        </Label>
                                        <div className="relative">
                                            {formData.workspaceType === WorkspaceType.ORGANIZATION ? (
                                                <Building2 className="absolute left-2.5 sm:left-3 top-2.5 sm:top-3 h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                                            ) : (
                                                <Users className="absolute left-2.5 sm:left-3 top-2.5 sm:top-3 h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                                            )}
                                            <Input
                                                id="organizationName"
                                                name="organizationName"
                                                type="text"
                                                placeholder="Acme Inc"
                                                value={formData.organizationName}
                                                onChange={handleChange}
                                                className="pl-8 sm:pl-10 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm h-8 sm:h-9"
                                                required
                                                disabled={loading}
                                                autoComplete="organization"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="email" className="text-xs sm:text-sm text-slate-700">Email</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-2.5 sm:left-3 top-2.5 sm:top-3 h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                placeholder="name@company.com"
                                                value={formData.email}
                                                onChange={handleChange}
                                                className="pl-8 sm:pl-10 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm h-8 sm:h-9"
                                                required
                                                disabled={loading}
                                                autoComplete="email"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="password" className="text-xs sm:text-sm text-slate-700">Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-2.5 sm:left-3 top-2.5 sm:top-3 h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                                            <Input
                                                id="password"
                                                name="password"
                                                type="password"
                                                placeholder="••••••••"
                                                value={formData.password}
                                                onChange={handleChange}
                                                className="pl-8 sm:pl-10 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm h-8 sm:h-9"
                                                required
                                                disabled={loading}
                                                autoComplete="new-password"
                                            />
                                        </div>
                                        {strength && formData.password && (
                                            <div className="space-y-1.5 text-xs">
                                                <div className="flex gap-1">
                                                    {[1, 2, 3, 4].map((level) => (
                                                        <div
                                                            key={level}
                                                            className={`h-1 flex-1 rounded ${level <= strength.strength
                                                                ? strength.strength <= 2
                                                                    ? 'bg-red-500'
                                                                    : strength.strength === 3
                                                                        ? 'bg-amber-500'
                                                                        : 'bg-green-500'
                                                                : 'bg-slate-200'
                                                                }`}
                                                        />
                                                    ))}
                                                </div>
                                                <div className="space-y-0.5 text-slate-600">
                                                    <div
                                                        className={`flex items-center gap-1 text-[10px] sm:text-xs ${strength.hasLength ? 'text-green-600' : ''}`}
                                                    >
                                                        <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                                        At least 8 characters
                                                    </div>
                                                    <div
                                                        className={`flex items-center gap-1 text-[10px] sm:text-xs ${strength.hasNumber ? 'text-green-600' : ''}`}
                                                    >
                                                        <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                                        Contains a number
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="confirmPassword" className="text-xs sm:text-sm text-slate-700">Confirm Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-2.5 sm:left-3 top-2.5 sm:top-3 h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                                            <Input
                                                id="confirmPassword"
                                                name="confirmPassword"
                                                type="password"
                                                placeholder="••••••••"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                className="pl-8 sm:pl-10 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm h-8 sm:h-9"
                                                required
                                                disabled={loading}
                                                autoComplete="new-password"
                                            />
                                        </div>
                                    </div>

                                    <Button type="submit" className="w-full text-xs sm:text-sm h-8 sm:h-9 bg-purple-600 hover:bg-purple-700" disabled={loading}>
                                        {loading ? 'Creating account...' : 'Create account'}
                                    </Button>
                                </form>
                            )}

                            {/* Sign In Link */}
                            {!showVerificationMessage && (
                                <div className="text-center text-xs sm:text-sm">
                                    <span className="text-slate-600">
                                        Already have an account?{' '}
                                    </span>
                                    <Link
                                        href="/login"
                                        className="text-purple-600 hover:text-purple-700 font-medium hover:underline"
                                    >
                                        Sign in
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Footer */}
                    <p className="text-center text-[10px] sm:text-xs text-slate-500 mt-3 sm:mt-4">
                        By creating an account, you agree to our{' '}
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
            <div className="hidden lg:flex lg:w-1/2 min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-12 items-center justify-center relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500 rounded-full filter blur-3xl opacity-20"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500 rounded-full filter blur-3xl opacity-20"></div>

                <div className="relative z-10 max-w-md text-white space-y-8">
                    <div className="space-y-4">
                        <h1 className="text-4xl font-bold leading-tight">
                            Start Your Journey <br />
                            with <span className="text-purple-200">wrkportal.com</span>
                        </h1>
                        <p className="text-lg text-purple-100">
                            Transform how your team works together
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                                <svg className="w-6 h-6 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg mb-1">Team Collaboration</h3>
                                <p className="text-purple-200 text-sm">Connect your entire organization in one unified workspace</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                                <svg className="w-6 h-6 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg mb-1">Smart Task Management</h3>
                                <p className="text-purple-200 text-sm">Organize, prioritize, and track work with intelligent automation</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                                <svg className="w-6 h-6 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg mb-1">Real-Time Insights</h3>
                                <p className="text-purple-200 text-sm">Make data-driven decisions with live analytics and reporting</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-white/20">
                        <p className="text-purple-200 italic">
                            "Join teams already managing their projects smarter, faster, and better."
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function SignupPage() {
    const [error, setError] = useState('')

    return (
        <>
            <Suspense fallback={null}>
                <OAuthErrorHandler onError={setError} />
            </Suspense>
            <SignupPageContent initialError={error} onErrorChange={setError} />
        </>
    )
}
