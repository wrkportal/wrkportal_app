'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Shield, Lock, Key, AlertTriangle } from "lucide-react"

interface SecurityStats {
    securityScore: number
    mfaPercentage: number
    alertsCount: number
    totalUsers?: number
    verifiedUsers?: number
    ssoEnabled?: boolean
    recentlyActiveUsers?: number
}

export default function AdminSecurityPage() {
    const [stats, setStats] = useState<SecurityStats>({
        securityScore: 0,
        mfaPercentage: 0,
        alertsCount: 0,
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchSecurityStats()
    }, [])

    const fetchSecurityStats = async () => {
        try {
            const response = await fetch('/api/admin/security/stats')
            if (response.ok) {
                const data = await response.json()
                setStats(data)
            }
        } catch (error) {
            console.error('Error fetching security stats:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header - Sticky */}
            <div className="sticky top-0 md:top-12 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b pb-2 md:pt-4 mb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Security & Compliance</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            View security status, encryption settings, and compliance information
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Security Score</CardTitle>
                        <Shield className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {loading ? '...' : `${stats.securityScore}%`}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stats.securityScore >= 90 ? 'Excellent' : stats.securityScore >= 70 ? 'Good' : 'Needs Improvement'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                            Based on MFA adoption
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Email Verified</CardTitle>
                        <Key className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {loading ? '...' : `${stats.mfaPercentage}%`}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {loading ? 'Loading...' : `${stats.verifiedUsers || 0} of ${stats.totalUsers || 0} users`}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Data Encryption</CardTitle>
                        <Lock className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">AES-256</div>
                        <p className="text-xs text-muted-foreground">At rest</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Security Alerts</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${stats.alertsCount > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                            {loading ? '...' : stats.alertsCount}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stats.alertsCount === 0 ? 'No issues (last 7 days)' : 'In last 7 days'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Security Score Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle>Security Score Breakdown</CardTitle>
                    <CardDescription>How your security score is calculated from real data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <p className="font-medium">Email Verification</p>
                                <Badge variant="secondary">25 points</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {loading ? '...' : `${stats.verifiedUsers || 0} of ${stats.totalUsers || 0} users verified`}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                All users should have verified email addresses
                            </p>
                        </div>

                        <div className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <p className="font-medium">SSO Configuration</p>
                                <Badge variant="secondary">25 points</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {loading ? '...' : stats.ssoEnabled ? 'SSO Enabled ✓' : 'SSO Not Configured'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Enterprise authentication via SSO
                            </p>
                        </div>

                        <div className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <p className="font-medium">Active Users</p>
                                <Badge variant="secondary">25 points</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {loading ? '...' : `${stats.recentlyActiveUsers || 0} of ${stats.totalUsers || 0} active in last 30 days`}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                No stale or inactive accounts
                            </p>
                        </div>

                        <div className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <p className="font-medium">Secure Authentication</p>
                                <Badge variant="secondary">25 points</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {loading ? '...' : 'Password/OAuth authentication ✓'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Users have secure login methods
                            </p>
                        </div>
                    </div>

                    <div className="pt-4 border-t">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold">Total Security Score</p>
                                <p className="text-sm text-muted-foreground">Based on 4 real-time factors</p>
                            </div>
                            <div className="text-3xl font-bold text-green-600">
                                {loading ? '...' : `${stats.securityScore}%`}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Authentication & Access</CardTitle>
                    <CardDescription>Manage authentication methods and access control</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <p className="font-medium">Single Sign-On (SSO)</p>
                            <p className="text-sm text-muted-foreground">Enterprise authentication via SAML, OIDC, Azure AD, or Google Workspace</p>
                        </div>
                        <Button variant="outline" onClick={() => window.location.href = '/admin/sso-settings'}>
                            Configure SSO
                        </Button>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <p className="font-medium">Multi-Factor Authentication (MFA)</p>
                            <p className="text-sm text-muted-foreground">Users can enable 2FA in their profile settings</p>
                        </div>
                        <Badge variant="outline">User-Managed</Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <p className="font-medium">Session Management</p>
                            <p className="text-sm text-muted-foreground">Secure JWT-based sessions with automatic timeout</p>
                        </div>
                        <Badge variant="default">Active</Badge>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Data Protection</CardTitle>
                    <CardDescription>Platform-level encryption and security settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <p className="font-medium">Data Encryption at Rest</p>
                            <p className="text-sm text-muted-foreground">Database encryption (PostgreSQL)</p>
                        </div>
                        <Badge variant="default">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <p className="font-medium">Data Encryption in Transit</p>
                            <p className="text-sm text-muted-foreground">HTTPS/TLS for all connections</p>
                        </div>
                        <Badge variant="default">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <p className="font-medium">Session Security</p>
                            <p className="text-sm text-muted-foreground">JWT-based authentication with secure cookies</p>
                        </div>
                        <Badge variant="default">Active</Badge>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Compliance & Audit</CardTitle>
                    <CardDescription>Audit logging and data retention policies</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <p className="font-medium">Audit Logging</p>
                            <p className="text-sm text-muted-foreground">All system activities are logged</p>
                        </div>
                        <Badge variant="default">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <p className="font-medium">Data Retention</p>
                            <p className="text-sm text-muted-foreground">Configurable per organization requirements</p>
                        </div>
                        <Badge variant="outline">Configurable</Badge>
                    </div>
                    <div className="text-center py-4 text-muted-foreground text-sm">
                        <p>View detailed audit logs in the Audit Log tab</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

