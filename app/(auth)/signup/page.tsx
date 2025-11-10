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
import { Mail, Lock, User, Building2, Chrome, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function SignupPage() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        organizationName: '',
    })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match')
            return
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters')
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
                throw new Error(data.error || 'Failed to create account')
            }

            // Auto sign in after successful signup
            const result = await signIn('credentials', {
                email: formData.email,
                password: formData.password,
                redirect: false,
            })

            if (result?.error) {
                setError('Account created but failed to sign in. Please try logging in.')
            } else {
                router.push('/my-work')
                router.refresh()
            }
        } catch (error: any) {
            setError(error.message || 'An error occurred. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleSignIn = async () => {
        setLoading(true)
        try {
            // Use signIn from next-auth/react for proper OAuth flow
            await signIn('google', { 
                callbackUrl: '/my-work',
            })
        } catch (error) {
            console.error('Google Sign-In error:', error)
            setError('Failed to sign in with Google. Please try again.')
            setLoading(false)
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
            <div className="relative z-10 w-full lg:w-1/2 flex items-center justify-center p-3 sm:p-4 lg:p-8 py-6 sm:py-8">
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
                        <p className="text-slate-400 text-xs sm:text-sm">Create your account</p>
                    </div>

                    <Card className="border border-slate-800 bg-slate-900/50 backdrop-blur-sm shadow-2xl">
                        <CardHeader className="space-y-1 pb-3 sm:pb-4 md:pb-5 px-3 sm:px-4 md:px-6">
                            <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold text-slate-100">Get started</CardTitle>
                            <CardDescription className="text-xs sm:text-sm text-slate-400">
                                Create your account and start managing projects
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2.5 sm:space-y-3 md:space-y-4 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
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
                                <span className="bg-slate-900/50 px-2 text-slate-500">
                                    Or sign up with email
                                </span>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-red-400 bg-red-950/30 border border-red-900/50 p-2.5 sm:p-3 rounded-lg">
                                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        {/* Signup Form */}
                        <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-3 md:space-y-4">
                            <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                                <div className="space-y-1.5 sm:space-y-2">
                                    <Label htmlFor="firstName" className="text-xs sm:text-sm text-slate-300">First Name</Label>
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
                                        className="bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-500 text-sm h-8 sm:h-9 md:h-10"
                                    />
                                </div>
                                <div className="space-y-1.5 sm:space-y-2">
                                    <Label htmlFor="lastName" className="text-xs sm:text-sm text-slate-300">Last Name</Label>
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
                                        className="bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-500 text-sm h-8 sm:h-9 md:h-10"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5 sm:space-y-2">
                                <Label htmlFor="organizationName" className="text-xs sm:text-sm text-slate-300">Organization Name</Label>
                                <div className="relative">
                                    <Building2 className="absolute left-2.5 sm:left-3 top-2.5 sm:top-3 h-3 w-3 sm:h-4 sm:w-4 text-slate-500" />
                                    <Input
                                        id="organizationName"
                                        name="organizationName"
                                        type="text"
                                        placeholder="Acme Inc"
                                        value={formData.organizationName}
                                        onChange={handleChange}
                                        className="pl-8 sm:pl-10 bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-500 text-sm h-8 sm:h-9 md:h-10"
                                        required
                                        disabled={loading}
                                        autoComplete="organization"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5 sm:space-y-2">
                                <Label htmlFor="email" className="text-xs sm:text-sm text-slate-300">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-2.5 sm:left-3 top-2.5 sm:top-3 h-3 w-3 sm:h-4 sm:w-4 text-slate-500" />
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="name@company.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="pl-8 sm:pl-10 bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-500 text-sm h-8 sm:h-9 md:h-10"
                                        required
                                        disabled={loading}
                                        autoComplete="email"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5 sm:space-y-2">
                                <Label htmlFor="password" className="text-xs sm:text-sm text-slate-300">Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-2.5 sm:left-3 top-2.5 sm:top-3 h-3 w-3 sm:h-4 sm:w-4 text-slate-500" />
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="pl-8 sm:pl-10 bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-500 text-sm h-8 sm:h-9 md:h-10"
                                        required
                                        disabled={loading}
                                        autoComplete="new-password"
                                    />
                                </div>
                                {strength && formData.password && (
                                    <div className="space-y-1.5 sm:space-y-2 text-xs">
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
                                                        : 'bg-slate-700'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <div className="space-y-0.5 sm:space-y-1 text-slate-400">
                                            <div
                                                className={`flex items-center gap-1 text-[10px] sm:text-xs ${strength.hasLength ? 'text-green-400' : ''
                                                    }`}
                                            >
                                                <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                                At least 8 characters
                                            </div>
                                            <div
                                                className={`flex items-center gap-1 text-[10px] sm:text-xs ${strength.hasNumber ? 'text-green-400' : ''
                                                    }`}
                                            >
                                                <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                                Contains a number
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1.5 sm:space-y-2">
                                <Label htmlFor="confirmPassword" className="text-xs sm:text-sm text-slate-300">Confirm Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-2.5 sm:left-3 top-2.5 sm:top-3 h-3 w-3 sm:h-4 sm:w-4 text-slate-500" />
                                    <Input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type="password"
                                        placeholder="••••••••"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="pl-8 sm:pl-10 bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-500 text-sm h-8 sm:h-9 md:h-10"
                                        required
                                        disabled={loading}
                                        autoComplete="new-password"
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full text-xs sm:text-sm h-8 sm:h-9 md:h-10" disabled={loading}>
                                {loading ? 'Creating account...' : 'Create account'}
                            </Button>
                        </form>

                        {/* Sign In Link */}
                        <div className="text-center text-xs sm:text-sm">
                            <span className="text-slate-400">
                                Already have an account?{' '}
                            </span>
                            <Link
                                href="/login"
                                className="text-purple-400 hover:text-purple-300 font-medium hover:underline"
                            >
                                Sign in
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer */}
                <p className="text-center text-[10px] sm:text-xs text-slate-500 mt-3 sm:mt-4 md:mt-6">
                    By creating an account, you agree to our{' '}
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

