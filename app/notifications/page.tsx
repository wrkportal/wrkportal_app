'use client'

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDate } from "@/lib/utils"
import { Bell, Check, Trash2, Loader2 } from "lucide-react"

interface Notification {
    id: string
    type: string
    title: string
    message: string
    entityType: string | null
    entityId: string | null
    read: boolean
    priority: string
    createdAt: string
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('all')

    useEffect(() => {
        fetchNotifications()
    }, [])

    const fetchNotifications = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/notifications')
            if (response.ok) {
                const data = await response.json()
                setNotifications(data.notifications)
            }
        } catch (error) {
            console.error('Error fetching notifications:', error)
        } finally {
            setLoading(false)
        }
    }

    const markAsRead = async (id: string) => {
        try {
            const response = await fetch(`/api/notifications/${id}`, {
                method: 'PATCH',
            })
            if (response.ok) {
                setNotifications(prev =>
                    prev.map(n => n.id === id ? { ...n, read: true } : n)
                )
            }
        } catch (error) {
            console.error('Error marking notification as read:', error)
        }
    }

    const deleteNotification = async (id: string) => {
        try {
            const response = await fetch(`/api/notifications/${id}`, {
                method: 'DELETE',
            })
            if (response.ok) {
                setNotifications(prev => prev.filter(n => n.id !== id))
            }
        } catch (error) {
            console.error('Error deleting notification:', error)
        }
    }

    const markAllAsRead = async () => {
        try {
            const response = await fetch('/api/notifications/mark-all-read', {
                method: 'POST',
            })
            if (response.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, read: true })))
            }
        } catch (error) {
            console.error('Error marking all as read:', error)
        }
    }

    const clearAll = async () => {
        if (!confirm('Are you sure you want to clear all read notifications?')) {
            return
        }
        try {
            const response = await fetch('/api/notifications/clear-all', {
                method: 'DELETE',
            })
            if (response.ok) {
                setNotifications(prev => prev.filter(n => !n.read))
            }
        } catch (error) {
            console.error('Error clearing notifications:', error)
        }
    }

    const unreadCount = notifications.filter(n => !n.read).length
    const mentionsCount = notifications.filter(n => n.type === 'MENTION').length
    const approvalsCount = notifications.filter(n => n.type === 'APPROVAL').length

    const filteredNotifications = notifications.filter(n => {
        if (activeTab === 'unread') return !n.read
        if (activeTab === 'mentions') return n.type === 'MENTION'
        if (activeTab === 'approvals') return n.type === 'APPROVAL'
        return true
    })

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header - Sticky */}
            <div className="sticky top-0 md:top-12 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b pb-2 md:pt-4 mb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Notifications
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <div className="flex gap-2">
                    <Button variant="outline" onClick={markAllAsRead} disabled={unreadCount === 0}>
                        <Check className="mr-2 h-4 w-4" />
                        Mark All Read
                    </Button>
                    <Button variant="outline" onClick={clearAll}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear All Read
                    </Button>
                    </div>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
                    <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
                    <TabsTrigger value="mentions">Mentions ({mentionsCount})</TabsTrigger>
                    <TabsTrigger value="approvals">Approvals ({approvalsCount})</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="space-y-4">
                    {filteredNotifications.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">
                                    {activeTab === 'unread' ? 'No unread notifications' : 'No notifications'}
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardContent className="p-0">
                                <div className="divide-y">
                                    {filteredNotifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={`p-4 hover:bg-accent cursor-pointer transition-colors ${
                                                !notification.read ? 'bg-blue-50/50 dark:bg-blue-950/30' : ''
                                            }`}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="mt-1">
                                                    <Bell
                                                        className={`h-5 w-5 ${
                                                            !notification.read
                                                                ? 'text-blue-600 dark:text-blue-400'
                                                                : 'text-muted-foreground'
                                                        }`}
                                                    />
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium">{notification.title}</p>
                                                        {!notification.read && (
                                                            <Badge variant="default" className="text-xs">
                                                                New
                                                            </Badge>
                                                        )}
                                                        <Badge variant="outline" className="text-xs">
                                                            {notification.type.replace('_', ' ')}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatDate(new Date(notification.createdAt))}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    {!notification.read && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => markAsRead(notification.id)}
                                                        >
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => deleteNotification(notification.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
