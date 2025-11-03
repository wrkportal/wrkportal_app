'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from 'lucide-react'

function ResetPasswordForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams?.get('token')

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [loading, setLoading] = useState(false)
    const [validatingToken, setValidatingToken] = useState(true)
    const [tokenValid, setTokenValid] = useState(false)

    useEffect(() => {
        const validateToken = async () => {
            if (!token) {
                setError('Invalid or missing reset token')
                setValidatingToken(false)
                return
            }

            try {
                const response = await fetch('/api/auth/validate-reset-token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token }),
                })

                if (response.ok) {
                    setTokenValid(true)
                } else {
                    setError('Invalid or expired reset link')
                }
            } catch (error) {
                setError('Failed to validate reset link')
            } finally {
                setValidatingToken(false)
            }
        }

        validateToken()
    }, [token])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        // Validation
        if (password.length < 8) {
            setError('Password must be at least 8 characters')
            return
        }

        if (!/[A-Z]/.test(password)) {
            setError('Password must contain at least one uppercase letter')
            return
        }

        if (!/[a-z]/.test(password)) {
            setError('Password must contain at least one lowercase letter')
            return
        }

        if (!/[0-9]/.test(password)) {
            setError('Password must contain at least one number')
            return
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        setLoading(true)

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            })

            const data = await response.json()

            if (response.ok) {
                setSuccess(true)
                setTimeout(() => {
                    router.push('/login')
                }, 3000)
            } else {
                setError(data.error || 'Failed to reset password')
            }
        } catch (error) {
            setError('An error occurred. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    if (validatingToken) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4">
                <Card className="w-full max-w-md shadow-2xl border-0">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center justify-center py-8 space-y-3">
                            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                            <p className="text-sm text-muted-foreground">Validating reset link...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4">
            <div className="w-full max-w-md">
                {/* Logo/Brand */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        ManagerBook
                    </h1>
                    <p className="text-slate-600 mt-2">Enterprise Project Management</p>
                </div>

                <Card className="shadow-2xl border-0">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
                        <CardDescription>
                            {success
                                ? "Your password has been reset successfully"
                                : "Create a new password for your account"
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
                                        <h3 className="font-semibold text-lg">Password Reset!</h3>
                                        <p className="text-sm text-muted-foreground max-w-sm">
                                            Your password has been successfully reset. Redirecting to login...
                                        </p>
                                    </div>
                                </div>

                                <Button
                                    onClick={() => router.push('/login')}
                                    className="w-full"
                                >
                                    Continue to Login
                                </Button>
                            </div>
                        ) : !tokenValid ? (
                            // Invalid Token State
                            <div className="space-y-4">
                                <div className="flex flex-col items-center justify-center py-6 space-y-3">
                                    <div className="rounded-full bg-red-100 p-3">
                                        <AlertCircle className="h-8 w-8 text-red-600" />
                                    </div>
                                    <div className="text-center space-y-2">
                                        <h3 className="font-semibold text-lg">Invalid Reset Link</h3>
                                        <p className="text-sm text-muted-foreground max-w-sm">
                                            {error || 'This reset link is invalid or has expired.'}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Button
                                        onClick={() => router.push('/forgot-password')}
                                        className="w-full"
                                    >
                                        Request New Link
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => router.push('/login')}
                                        className="w-full"
                                    >
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Back to Login
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            // Form State
                            <>
                                {/* Error Message */}
                                {error && (
                                    <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                                        <AlertCircle className="h-4 w-4 shrink-0" />
                                        {error}
                                    </div>
                                )}

                                {/* Password Form */}
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="password">New Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="password"
                                                type="password"
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="pl-10"
                                                required
                                                disabled={loading}
                                                autoFocus
                                                autoComplete="new-password"
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Min. 8 characters with uppercase, lowercase, and numbers
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="confirmPassword"
                                                type="password"
                                                placeholder="••••••••"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="pl-10"
                                                required
                                                disabled={loading}
                                                autoComplete="new-password"
                                            />
                                        </div>
                                    </div>

                                    <Button type="submit" className="w-full" disabled={loading}>
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Resetting Password...
                                            </>
                                        ) : (
                                            <>
                                                <Lock className="mr-2 h-4 w-4" />
                                                Reset Password
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
            </div>
        </div>
    )
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    )
}

