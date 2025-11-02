'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuthStore, fetchAuthenticatedUser } from "@/stores/authStore"
import { getInitials } from "@/lib/utils"
import {
    User,
    Settings,
    Bell,
    Lock,
    Home,
    Save,
    Mail,
    Phone,
    MapPin,
    Briefcase,
    CheckCircle2,
    Loader2,
    Edit,
    Trash2
} from "lucide-react"

export default function SettingsPage() {
    const user = useAuthStore((state) => state.user)
    const setUser = useAuthStore((state) => state.setUser)

    // Loading states
    const [isLoading, setIsLoading] = useState(true)
    const [isSavingProfile, setIsSavingProfile] = useState(false)
    const [isSavingPreferences, setIsSavingPreferences] = useState(false)
    const [profileSuccess, setProfileSuccess] = useState(false)
    const [preferencesSuccess, setPreferencesSuccess] = useState(false)

    // Profile form state
    const [firstName, setFirstName] = useState(user?.firstName || '')
    const [lastName, setLastName] = useState(user?.lastName || '')
    const [email, setEmail] = useState(user?.email || '')
    const [phone, setPhone] = useState('')
    const [location, setLocation] = useState('')
    const [department, setDepartment] = useState('')

    // Preferences state
    const [timezone, setTimezone] = useState(user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC')
    const [locale, setLocale] = useState(user?.locale || 'en-US')

    // Notification state
    const [emailNotifications, setEmailNotifications] = useState(true)
    const [pushNotifications, setPushNotifications] = useState(true)

    // Password change state
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isChangingPassword, setIsChangingPassword] = useState(false)
    const [passwordSuccess, setPasswordSuccess] = useState(false)
    const [passwordError, setPasswordError] = useState('')

    // Fetch real user data on mount
    useEffect(() => {
        const loadUser = async () => {
            setIsLoading(true)
            const authenticatedUser = await fetchAuthenticatedUser()
            if (authenticatedUser) {
                setUser(authenticatedUser)
                setFirstName(authenticatedUser.firstName)
                setLastName(authenticatedUser.lastName)
                setEmail(authenticatedUser.email)
                setPhone(authenticatedUser.phone || '')
                setLocation(authenticatedUser.location || '')
                setDepartment(authenticatedUser.department || '')
                setTimezone(authenticatedUser.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC')
                setLocale(authenticatedUser.locale || 'en-US')
            }
            setIsLoading(false)
        }
        loadUser()
    }, [setUser])

    useEffect(() => {
        if (user) {
            setFirstName(user.firstName)
            setLastName(user.lastName)
            setEmail(user.email)
            setPhone(user.phone || '')
            setLocation(user.location || '')
            setDepartment(user.department || '')
        }
    }, [user])

    const handleSaveProfile = async () => {
        if (!user) return

        setIsSavingProfile(true)
        setProfileSuccess(false)

        try {
            const response = await fetch('/api/user/profile', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    email,
                    phone,
                    location,
                    department,
                }),
            })

            if (response.ok) {
                const data = await response.json()
                setUser(data.user)
                setProfileSuccess(true)

                // Hide success message after 3 seconds
                setTimeout(() => setProfileSuccess(false), 3000)
            } else {
                const error = await response.json()
                alert(`Error: ${error.error || 'Failed to update profile'}`)
            }
        } catch (error) {
            console.error('Error updating profile:', error)
            alert('Failed to update profile. Please try again.')
        } finally {
            setIsSavingProfile(false)
        }
    }

    const handleSavePreferences = async () => {
        if (!user) return

        setIsSavingPreferences(true)
        setPreferencesSuccess(false)

        try {
            const response = await fetch('/api/user/profile', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    timezone,
                    locale,
                }),
            })

            if (response.ok) {
                const data = await response.json()
                setUser(data.user)

                setPreferencesSuccess(true)

                // Hide success message after 3 seconds
                setTimeout(() => setPreferencesSuccess(false), 3000)
            } else {
                const error = await response.json()
                alert(`Error: ${error.error || 'Failed to update preferences'}`)
            }
        } catch (error) {
            console.error('Error updating preferences:', error)
            alert('Failed to update preferences. Please try again.')
        } finally {
            setIsSavingPreferences(false)
        }
    }

    const handleChangePassword = async () => {
        if (!user) return

        // Reset states
        setPasswordError('')
        setPasswordSuccess(false)

        // Client-side validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            setPasswordError('All password fields are required')
            return
        }

        if (newPassword.length < 8) {
            setPasswordError('Password must be at least 8 characters')
            return
        }

        if (newPassword !== confirmPassword) {
            setPasswordError('New passwords do not match')
            return
        }

        if (currentPassword === newPassword) {
            setPasswordError('New password must be different from current password')
            return
        }

        setIsChangingPassword(true)

        try {
            const response = await fetch('/api/user/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                    confirmPassword,
                }),
            })

            const data = await response.json()

            if (response.ok) {
                setPasswordSuccess(true)
                // Clear password fields
                setCurrentPassword('')
                setNewPassword('')
                setConfirmPassword('')

                // Hide success message after 5 seconds
                setTimeout(() => setPasswordSuccess(false), 5000)
            } else {
                // Handle error
                if (data.details && Array.isArray(data.details)) {
                    // Validation errors from zod
                    setPasswordError(data.details.map((d: any) => d.message).join(', '))
                } else {
                    setPasswordError(data.error || 'Failed to change password')
                }
            }
        } catch (error) {
            console.error('Error changing password:', error)
            setPasswordError('Failed to change password. Please try again.')
        } finally {
            setIsChangingPassword(false)
        }
    }

    if (isLoading || !user) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading settings...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Settings
                </h1>
                <p className="text-muted-foreground mt-0.5">
                    Manage your account settings and preferences
                </p>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="bg-white dark:bg-slate-900 border">
                    <TabsTrigger value="profile" className="gap-2">
                        <User className="h-4 w-4" />
                        Profile
                    </TabsTrigger>
                    <TabsTrigger value="preferences" className="gap-2">
                        <Settings className="h-4 w-4" />
                        Preferences
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="gap-2">
                        <Bell className="h-4 w-4" />
                        Notifications
                    </TabsTrigger>
                    <TabsTrigger value="security" className="gap-2">
                        <Lock className="h-4 w-4" />
                        Security
                    </TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Information</CardTitle>
                            <CardDescription>
                                Update your personal information and profile details
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Avatar Section */}
                            <div className="flex items-center gap-6">
                                <div className="relative group">
                                    <Avatar className="h-24 w-24 border-4 border-purple-200 dark:border-purple-800">
                                        <AvatarImage src={user.avatar} alt={user.firstName} />
                                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-2xl font-bold">
                                            {getInitials(user.firstName, user.lastName)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <label htmlFor="avatar-upload" className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                        <Edit className="h-6 w-6 text-white" />
                                    </label>
                                    <input
                                        id="avatar-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0]
                                            if (file) {
                                                // Check file size (max 2MB)
                                                const maxSize = 2 * 1024 * 1024 // 2MB in bytes
                                                if (file.size > maxSize) {
                                                    alert('Image size must be less than 2MB. Please choose a smaller image.')
                                                    e.target.value = '' // Reset the input
                                                    return
                                                }
                                                
                                                // Convert to base64 data URL
                                                const reader = new FileReader()
                                                reader.onloadend = async () => {
                                                    const base64String = reader.result as string
                                                    try {
                                                        const response = await fetch('/api/user/profile', {
                                                            method: 'PATCH',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ avatar: base64String }),
                                                        })
                                                        if (response.ok) {
                                                            const data = await response.json()
                                                            setUser(data.user)
                                                            alert('Avatar updated successfully!')
                                                        } else {
                                                            alert('Failed to update avatar. Please try again.')
                                                        }
                                                    } catch (error) {
                                                        console.error('Error uploading avatar:', error)
                                                        alert('Error uploading avatar. Please try again.')
                                                    }
                                                }
                                                reader.readAsDataURL(file)
                                            }
                                        }}
                                    />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-semibold">{user.firstName} {user.lastName}</h3>
                                    <p className="text-sm text-muted-foreground">{user.role}</p>
                                    <Badge className="mt-2">{user.email}</Badge>
                                    <p className="text-xs text-muted-foreground mt-2">Click avatar to upload image (max 2MB)</p>
                                    {user.avatar && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="mt-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                                            onClick={async () => {
                                                if (confirm('Are you sure you want to remove your profile picture?')) {
                                                    try {
                                                        const response = await fetch('/api/user/profile', {
                                                            method: 'PATCH',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ avatar: null }),
                                                        })
                                                        if (response.ok) {
                                                            const data = await response.json()
                                                            setUser(data.user)
                                                            alert('Avatar removed successfully!')
                                                        } else {
                                                            alert('Failed to remove avatar. Please try again.')
                                                        }
                                                    } catch (error) {
                                                        console.error('Error removing avatar:', error)
                                                        alert('Error removing avatar. Please try again.')
                                                    }
                                                }
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4 mr-1" />
                                            Remove Picture
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <Separator />

                            {/* Profile Form */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">First Name</Label>
                                    <Input
                                        id="firstName"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        placeholder="John"
                                        autoComplete="given-name"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Last Name</Label>
                                    <Input
                                        id="lastName"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        placeholder="Doe"
                                        autoComplete="family-name"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">
                                        <Mail className="h-4 w-4 inline mr-2" />
                                        Email
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="john.doe@example.com"
                                        autoComplete="email"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">
                                        <Phone className="h-4 w-4 inline mr-2" />
                                        Phone
                                    </Label>
                                    <Input
                                        id="phone"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="+1 (555) 123-4567"
                                        autoComplete="tel"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="location">
                                        <MapPin className="h-4 w-4 inline mr-2" />
                                        Location
                                    </Label>
                                    <Input
                                        id="location"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder="San Francisco, CA"
                                        autoComplete="address-level2"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="department">
                                        <Briefcase className="h-4 w-4 inline mr-2" />
                                        Department
                                    </Label>
                                    <Input
                                        id="department"
                                        value={department}
                                        onChange={(e) => setDepartment(e.target.value)}
                                        placeholder="Engineering"
                                        autoComplete="organization-title"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                {profileSuccess && (
                                    <div className="flex items-center gap-2 text-green-600">
                                        <CheckCircle2 className="h-4 w-4" />
                                        <span className="text-sm font-medium">Profile updated successfully!</span>
                                    </div>
                                )}
                                <div className={!profileSuccess ? 'ml-auto' : ''}>
                                    <Button
                                        onClick={handleSaveProfile}
                                        className="gap-2"
                                        disabled={isSavingProfile}
                                    >
                                        {isSavingProfile ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4" />
                                                Save Changes
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Preferences Tab */}
                <TabsContent value="preferences" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Regional Settings</CardTitle>
                            <CardDescription>
                                Configure your timezone and language preferences
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="timezone">Timezone</Label>
                                    <Select value={timezone} onValueChange={setTimezone}>
                                        <SelectTrigger id="timezone">
                                            <SelectValue placeholder="Select timezone" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
                                            <SelectItem value="America/New_York">Eastern Time (GMT-5)</SelectItem>
                                            <SelectItem value="America/Chicago">Central Time (GMT-6)</SelectItem>
                                            <SelectItem value="America/Denver">Mountain Time (GMT-7)</SelectItem>
                                            <SelectItem value="America/Los_Angeles">Pacific Time (GMT-8)</SelectItem>
                                            <SelectItem value="Europe/London">London (GMT+0)</SelectItem>
                                            <SelectItem value="Europe/Paris">Paris (GMT+1)</SelectItem>
                                            <SelectItem value="Asia/Kolkata">India Standard Time - IST (GMT+5:30)</SelectItem>
                                            <SelectItem value="Asia/Tokyo">Tokyo (GMT+9)</SelectItem>
                                            <SelectItem value="Australia/Sydney">Sydney (GMT+11)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="locale">Language</Label>
                                    <Select value={locale} onValueChange={setLocale}>
                                        <SelectTrigger id="locale">
                                            <SelectValue placeholder="Select language" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="en-US">English (US)</SelectItem>
                                            <SelectItem value="en-GB">English (UK)</SelectItem>
                                            <SelectItem value="es-ES">Español</SelectItem>
                                            <SelectItem value="fr-FR">Français</SelectItem>
                                            <SelectItem value="de-DE">Deutsch</SelectItem>
                                            <SelectItem value="ja-JP">日本語</SelectItem>
                                            <SelectItem value="zh-CN">中文</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex items-center justify-between">
                        {preferencesSuccess && (
                            <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="text-sm font-medium">Preferences saved successfully!</span>
                            </div>
                        )}
                        <div className={!preferencesSuccess ? 'ml-auto' : ''}>
                            <Button
                                onClick={handleSavePreferences}
                                className="gap-2"
                                disabled={isSavingPreferences}
                            >
                                {isSavingPreferences ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        Save Preferences
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Notification Preferences</CardTitle>
                            <CardDescription>
                                Choose how you want to receive notifications
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Email Notifications</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Receive notifications via email
                                    </p>
                                </div>
                                <Button
                                    variant={emailNotifications ? "default" : "outline"}
                                    onClick={() => setEmailNotifications(!emailNotifications)}
                                >
                                    {emailNotifications ? 'Enabled' : 'Disabled'}
                                </Button>
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Push Notifications</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Receive push notifications in your browser
                                    </p>
                                </div>
                                <Button
                                    variant={pushNotifications ? "default" : "outline"}
                                    onClick={() => setPushNotifications(!pushNotifications)}
                                >
                                    {pushNotifications ? 'Enabled' : 'Disabled'}
                                </Button>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <Label className="text-base">Notification Types</Label>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 border rounded-lg">
                                        <span className="text-sm">Project Updates</span>
                                        <Badge>Enabled</Badge>
                                    </div>
                                    <div className="flex items-center justify-between p-3 border rounded-lg">
                                        <span className="text-sm">Task Assignments</span>
                                        <Badge>Enabled</Badge>
                                    </div>
                                    <div className="flex items-center justify-between p-3 border rounded-lg">
                                        <span className="text-sm">Mentions & Comments</span>
                                        <Badge>Enabled</Badge>
                                    </div>
                                    <div className="flex items-center justify-between p-3 border rounded-lg">
                                        <span className="text-sm">Deadline Reminders</span>
                                        <Badge>Enabled</Badge>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Security Settings</CardTitle>
                            <CardDescription>
                                Manage your account security and password
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <Label className="text-base">Change Password</Label>
                                <p className="text-sm text-muted-foreground">
                                    Password must be at least 8 characters with uppercase, lowercase, and numbers
                                </p>
                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="currentPassword">Current Password</Label>
                                        <Input
                                            id="currentPassword"
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            placeholder="Enter your current password"
                                            autoComplete="current-password"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="newPassword">New Password</Label>
                                        <Input
                                            id="newPassword"
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Enter new password (min. 8 characters)"
                                            autoComplete="new-password"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                        <Input
                                            id="confirmPassword"
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Confirm new password"
                                            autoComplete="new-password"
                                        />
                                    </div>
                                </div>

                                {/* Error Message */}
                                {passwordError && (
                                    <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                        {passwordError}
                                    </div>
                                )}

                                {/* Success Message */}
                                {passwordSuccess && (
                                    <div className="flex items-center gap-2 p-3 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                        <CheckCircle2 className="h-4 w-4" />
                                        <span className="font-medium">Password changed successfully!</span>
                                    </div>
                                )}

                                <Button
                                    onClick={handleChangePassword}
                                    disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                                    className="gap-2"
                                >
                                    {isChangingPassword ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Updating Password...
                                        </>
                                    ) : (
                                        <>
                                            <Lock className="h-4 w-4" />
                                            Update Password
                                        </>
                                    )}
                                </Button>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <Label className="text-base">Two-Factor Authentication</Label>
                                <p className="text-sm text-muted-foreground">
                                    Add an extra layer of security to your account
                                </p>
                                <Button 
                                    variant="outline"
                                    onClick={() => alert('2FA functionality is coming soon! This feature will allow you to enable two-factor authentication using authenticator apps like Google Authenticator or Microsoft Authenticator for enhanced account security.')}
                                >
                                    Enable 2FA
                                </Button>
                                <p className="text-xs text-muted-foreground italic">
                                    Note: 2FA setup will be available in a future update
                                </p>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <Label className="text-base">Active Sessions</Label>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between p-3 border rounded-lg">
                                        <div>
                                            <p className="text-sm font-medium">Current Session</p>
                                            <p className="text-xs text-muted-foreground">Windows • Chrome • San Francisco</p>
                                        </div>
                                        <Badge variant="outline">Active</Badge>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

