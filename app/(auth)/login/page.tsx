'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Mail, Lock, Chrome, AlertCircle, Building2 } from 'lucide-react'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showSSO, setShowSSO] = useState(false)
    const [ssoIdentifier, setSsoIdentifier] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            })

            if (result?.error) {
                setError('Invalid email or password')
            } else {
                router.push('/my-work')
                router.refresh()
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
        
        try {
            console.log('Calling signIn with google provider...')
            // Use signIn from next-auth/react for proper OAuth flow
            await signIn('google', { 
                callbackUrl: '/my-work',
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
                    callbackUrl: '/my-work',
                    redirect: true,
                    tenant: data.tenantId,
                })
            } else if (data.ssoProvider === 'AZURE_AD') {
                // Use NextAuth with Azure AD
                const result = await signIn('azure-ad', {
                    callbackUrl: '/my-work',
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
        <div className="min-h-screen flex items-center relative bg-slate-950">
            {/* Background Image - Right side only on desktop */}
            <div 
                className="hidden lg:block absolute inset-0 lg:left-1/2 bg-cover bg-center opacity-40"
                style={{
                    backgroundImage: "url('/auth-background.png')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            />
            
            {/* Form Container - Left Side */}
            <div className="relative z-10 w-full lg:w-1/2 flex items-center justify-center p-3 sm:p-4 lg:p-8">
                <div className="w-full max-w-[320px] sm:max-w-sm md:max-w-md">
                    {/* Logo/Brand */}
                    <div className="text-center mb-3 sm:mb-4 md:mb-6">
                        <div className="flex items-center justify-center gap-2 mb-1.5 sm:mb-2">
                            <Image 
                                src="/logo.png" 
                                alt="ManagerBook Logo" 
                                width={120} 
                                height={36}
                                className="h-7 sm:h-8 md:h-9 w-auto object-contain"
                            />
                        </div>
                        <p className="text-slate-400 text-xs sm:text-sm">Enterprise Project Management</p>
                    </div>

                    <Card className="border border-slate-800 bg-slate-900/50 backdrop-blur-sm shadow-2xl">
                        <CardHeader className="space-y-1 pb-3 sm:pb-4 md:pb-5 px-3 sm:px-4 md:px-6">
                            <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold text-slate-100">Welcome back</CardTitle>
                            <CardDescription className="text-xs sm:text-sm text-slate-400">Sign in to your account to continue</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2.5 sm:space-y-3 md:space-y-4 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
                        {/* SSO Login Button */}
                        <Button
                            variant="outline"
                            className="w-full border border-slate-700 bg-slate-800/50 hover:bg-slate-700 hover:border-slate-600 text-slate-200 text-xs sm:text-sm h-8 sm:h-9 md:h-10"
                            onClick={() => setShowSSO(!showSSO)}
                            disabled={loading}
                        >
                            <Building2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                            Log in with your organization SSO
                        </Button>

                        {/* SSO Form (expandable) */}
                        {showSSO && (
                            <form onSubmit={handleSSOLogin} className="space-y-2 sm:space-y-2.5 p-2.5 sm:p-3 md:p-4 bg-slate-800/30 rounded-lg border border-slate-700">
                                <div className="space-y-1.5 sm:space-y-2">
                                    <Label htmlFor="ssoIdentifier" className="text-xs sm:text-sm font-medium text-slate-300">
                                        Organization Domain or ID
                                    </Label>
                                    <Input
                                        id="ssoIdentifier"
                                        type="text"
                                        placeholder="company.com or organization-id"
                                        value={ssoIdentifier}
                                        onChange={(e) => setSsoIdentifier(e.target.value)}
                                        required
                                        disabled={loading}
                                        className="bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-500 text-sm h-8 sm:h-9 md:h-10"
                                    />
                                    <p className="text-[10px] sm:text-xs text-slate-500">
                                        Enter your organization&apos;s domain (e.g., acme.com) or organization ID
                                    </p>
                                </div>
                                <Button type="submit" className="w-full text-xs sm:text-sm h-8 sm:h-9 md:h-10" disabled={loading || !ssoIdentifier}>
                                    {loading ? 'Verifying...' : 'Continue with SSO'}
                                </Button>
                            </form>
                        )}

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <Separator className="bg-slate-800" />
                            </div>
                            <div className="relative flex justify-center text-[10px] sm:text-xs uppercase">
                                <span className="bg-slate-900/50 px-2 text-slate-500">Or continue with</span>
                            </div>
                        </div>

                        {/* Google Sign In */}
                        <Button
                            variant="outline"
                            className="w-full border border-slate-700 bg-slate-800/50 hover:bg-slate-700 hover:border-slate-600 text-slate-200 text-xs sm:text-sm h-8 sm:h-9 md:h-10"
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                        >
                            <Chrome className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                            Continue with Google
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <Separator className="bg-slate-800" />
                            </div>
                            <div className="relative flex justify-center text-[10px] sm:text-xs uppercase">
                                <span className="bg-slate-900/50 px-2 text-slate-500">Or use email</span>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-red-400 bg-red-950/30 border border-red-900/50 p-2.5 sm:p-3 rounded-lg">
                                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        {/* Email/Password Form */}
                        <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-3 md:space-y-4">
                            <div className="space-y-1.5 sm:space-y-2">
                                <Label htmlFor="email" className="text-xs sm:text-sm text-slate-300">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-2.5 sm:left-3 top-2.5 sm:top-3 h-3 w-3 sm:h-4 sm:w-4 text-slate-500" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="name@company.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-8 sm:pl-10 bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-500 text-sm h-8 sm:h-9 md:h-10"
                                        required
                                        disabled={loading}
                                        autoComplete="email"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5 sm:space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-xs sm:text-sm text-slate-300">Password</Label>
                                    <Link
                                        href="/forgot-password"
                                        className="text-[10px] sm:text-xs text-purple-400 hover:text-purple-300 hover:underline"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-2.5 sm:left-3 top-2.5 sm:top-3 h-3 w-3 sm:h-4 sm:w-4 text-slate-500" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-8 sm:pl-10 bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-500 text-sm h-8 sm:h-9 md:h-10"
                                        required
                                        disabled={loading}
                                        autoComplete="current-password"
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full text-xs sm:text-sm h-8 sm:h-9 md:h-10" disabled={loading}>
                                {loading ? 'Signing in...' : 'Sign in'}
                            </Button>
                        </form>

                        {/* Sign Up Link */}
                        <div className="text-center text-xs sm:text-sm">
                            <span className="text-slate-400">Don&apos;t have an account? </span>
                            <Link
                                href="/signup"
                                className="text-purple-400 hover:text-purple-300 font-medium hover:underline"
                            >
                                Sign up
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer */}
                <p className="text-center text-[10px] sm:text-xs text-slate-500 mt-3 sm:mt-4 md:mt-6">
                    By signing in, you agree to our{' '}
                    <Link href="/terms" className="underline hover:text-slate-400">
                        Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="underline hover:text-slate-400">
                        Privacy Policy
                    </Link>
                </p>
                </div>
            </div>
        </div>
    )
}

