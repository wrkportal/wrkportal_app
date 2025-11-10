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
        <div className="min-h-screen flex items-center relative bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
            {/* Form Container - Left Side */}
            <div className="relative z-10 w-full lg:w-1/2 flex items-center justify-center p-3 sm:p-4 lg:p-8 py-6 sm:py-8">
                <div className="w-full max-w-[280px] sm:max-w-[320px] md:max-w-sm">
                    {/* Logo/Brand */}
                    <div className="text-center mb-3 sm:mb-4">
                        <div className="flex items-center justify-center gap-2 mb-1.5">
                            <Image 
                                src="/logo.png" 
                                alt="ManagerBook Logo" 
                                width={110} 
                                height={33}
                                className="h-7 w-auto object-contain"
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

                        {/* Signup Form */}
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

                            <div className="space-y-1.5">
                                <Label htmlFor="organizationName" className="text-xs sm:text-sm text-slate-700">Organization</Label>
                                <div className="relative">
                                    <Building2 className="absolute left-2.5 sm:left-3 top-2.5 sm:top-3 h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
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

                        {/* Sign In Link */}
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
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-12 items-center justify-center relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500 rounded-full filter blur-3xl opacity-20"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500 rounded-full filter blur-3xl opacity-20"></div>
                
                <div className="relative z-10 max-w-md text-white space-y-8">
                    <div className="space-y-4">
                        <h1 className="text-4xl font-bold leading-tight">
                            Start Your Journey <br />
                            with <span className="text-purple-200">ManagerBook</span>
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
                            "Join 10,000+ teams already managing their projects smarter, faster, and better."
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
