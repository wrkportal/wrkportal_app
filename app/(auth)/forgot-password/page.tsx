'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Loader2, Info } from 'lucide-react'

export default function ForgotPasswordPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            })

            const data = await response.json()

            if (response.ok) {
                setSuccess(true)
            } else {
                setError(data.error || 'Failed to send reset email. Please try again.')
            }
        } catch (error) {
            setError('An error occurred. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4">
            <div className="w-full max-w-md">
                {/* Logo/Brand */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center mb-3">
                        <Image 
                            src="/logo.png" 
                            alt="wrkportal.com Logo" 
                            width={160} 
                            height={48}
                            className="h-10 w-auto object-contain"
                        />
                    </div>
                    <p className="text-slate-600 mt-2">Enterprise Project Management</p>
                </div>

                <Card className="shadow-2xl border-0">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold">Forgot Password</CardTitle>
                        <CardDescription>
                            {success
                                ? "Check your email for reset instructions"
                                : "Enter your email and we'll send you a reset link"
                            }
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {success ? (
                            // Success State
                            <div className="space-y-4">
                                <div className="flex flex-col items-center justify-center py-6 space-y-3">
                                    <div className="rounded-full bg-green-100 p-3">
                                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                                    </div>
                                    <div className="text-center space-y-2">
                                        <h3 className="font-semibold text-lg">Email Sent!</h3>
                                        <p className="text-sm text-muted-foreground max-w-sm">
                                            We&apos;ve sent password reset instructions to <strong>{email}</strong>
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Didn&apos;t receive it? Check your spam folder or try again.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Button
                                        onClick={() => router.push('/login')}
                                        className="w-full"
                                    >
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Back to Login
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setSuccess(false)
                                            setEmail('')
                                        }}
                                        className="w-full"
                                    >
                                        Resend Email
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            // Form State
                            <>
                                {/* Info Message for OAuth Users */}
                                <div className="flex items-start gap-2 text-sm text-blue-700 bg-blue-50 p-3 rounded-lg border border-blue-200">
                                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="font-medium">Note for Google Sign-In Users</p>
                                        <p className="text-xs text-blue-600">
                                            If you signed up using "Continue with Google", you don't need to reset your password. 
                                            Just click "Continue with Google" on the login page.
                                        </p>
                                    </div>
                                </div>

                                {/* Error Message */}
                                {error && (
                                    <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                                        <AlertCircle className="h-4 w-4 shrink-0" />
                                        {error}
                                    </div>
                                )}

                                {/* Email Form */}
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="name@company.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="pl-10"
                                                required
                                                disabled={loading}
                                                autoFocus
                                                autoComplete="email"
                                            />
                                        </div>
                                    </div>

                                    <Button type="submit" className="w-full" disabled={loading}>
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Mail className="mr-2 h-4 w-4" />
                                                Send Reset Link
                                            </>
                                        )}
                                    </Button>
                                </form>

                                {/* Back to Login */}
                                <div className="text-center">
                                    <Link
                                        href="/login"
                                        className="text-sm text-purple-600 hover:text-purple-700 hover:underline inline-flex items-center gap-1"
                                    >
                                        <ArrowLeft className="h-3 w-3" />
                                        Back to Login
                                    </Link>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Footer */}
                <p className="text-center text-xs text-muted-foreground mt-8">
                    Need help? Contact{' '}
                    <Link href="mailto:support@company.com" className="underline hover:text-slate-900">
                        support@company.com
                    </Link>
                </p>
            </div>
        </div>
    )
}

