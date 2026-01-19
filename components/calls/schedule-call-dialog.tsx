/**
 * Schedule/Setup Call Dialog Component
 * Microsoft Teams-like dialog for scheduling and setting up calls
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Users, X, Search } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

interface User {
  id: string
  firstName?: string
  lastName?: string
  name?: string
  email: string
  avatar?: string
  role?: string
}

interface ScheduleCallDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSchedule: (data: {
    title: string
    description?: string // Still called description in API, but labeled as agenda in UI
    participantIds: string[]
    scheduledAt?: Date
  }) => Promise<void>
  onStartNow?: (data: {
    title: string
    description?: string // Still called description in API, but labeled as agenda in UI
    participantIds: string[]
  }) => Promise<void>
}

export function ScheduleCallDialog({
  open,
  onOpenChange,
  onSchedule,
  onStartNow,
}: ScheduleCallDialogProps) {
  const currentUser = useAuthStore((state) => state.user)
  const [title, setTitle] = useState('')
  const [agenda, setAgenda] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [showUserSuggestions, setShowUserSuggestions] = useState(false)
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isScheduling, setIsScheduling] = useState(false)
  
  const searchInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Fetch users
  useEffect(() => {
    if (open) {
      fetchUsers()
    }
  }, [open])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  // Filter users based on search query - show all available users when typing
  useEffect(() => {
    const filtered = users
      .filter((user) => {
        if (user.id === currentUser?.id) return false
        if (selectedUsers.some((u) => u.id === user.id)) return false
        
        if (searchQuery.trim().length === 0) {
          // Show all users when search is empty
          return true
        }
        
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || ''
        const email = user.email || ''
        const search = searchQuery.toLowerCase()
        return fullName.toLowerCase().includes(search) || email.toLowerCase().includes(search)
      })
      .slice(0, 15) // Show more results (15 instead of 10)
    
    setFilteredUsers(filtered)
    // Show suggestions if there are filtered users and input is focused
    if (filtered.length > 0 && (searchQuery.length > 0 || document.activeElement === searchInputRef.current)) {
      setShowUserSuggestions(true)
    }
  }, [searchQuery, users, selectedUsers, currentUser])

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowUserSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectUser = (user: User) => {
    setSelectedUsers([...selectedUsers, user])
    setSearchQuery('')
    setShowUserSuggestions(false)
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }

  const removeUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter((u) => u.id !== userId))
  }

  const getDisplayName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`
    }
    return user.name || user.email
  }

  const handleSchedule = async () => {
    if (!title.trim()) return
    
    setIsScheduling(true)
    try {
      const participantIds = selectedUsers.map((u) => u.id)
      let scheduledAt: Date | undefined
      
      if (scheduledDate && scheduledTime) {
        const [hours, minutes] = scheduledTime.split(':')
        scheduledAt = new Date(scheduledDate)
        scheduledAt.setHours(parseInt(hours), parseInt(minutes), 0, 0)
      }

      await onSchedule({
        title: title.trim(),
        description: agenda.trim() || undefined,
        participantIds,
        scheduledAt,
      })

      // Reset form
      setTitle('')
      setAgenda('')
      setSelectedUsers([])
      setScheduledDate('')
      setScheduledTime('')
      setSearchQuery('')
      onOpenChange(false)
    } catch (error) {
      console.error('Error scheduling call:', error)
    } finally {
      setIsScheduling(false)
    }
  }

  const handleStartNow = async () => {
    if (!title.trim()) return
    
    setIsLoading(true)
    try {
      const participantIds = selectedUsers.map((u) => u.id)
      
      if (onStartNow) {
        await onStartNow({
          title: title.trim(),
          description: agenda.trim() || undefined,
          participantIds,
        })
      }

      // Reset form
      setTitle('')
      setAgenda('')
      setSelectedUsers([])
      setScheduledDate('')
      setScheduledTime('')
      setSearchQuery('')
      onOpenChange(false)
    } catch (error) {
      console.error('Error starting call:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setTitle('')
    setAgenda('')
    setSelectedUsers([])
    setScheduledDate('')
    setScheduledTime('')
    setSearchQuery('')
    setShowUserSuggestions(false)
    onOpenChange(false)
  }

  const isScheduleMode = scheduledDate && scheduledTime

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Meeting</DialogTitle>
          <DialogDescription>
            Schedule a meeting or start one immediately
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Meeting Title *</Label>
            <Input
              id="title"
              placeholder="Enter meeting title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Agenda */}
          <div className="space-y-2">
            <Label htmlFor="agenda" className="text-base font-semibold">
              Agenda
            </Label>
            <div className="rounded-lg border bg-card p-4">
              <Textarea
                id="agenda"
                placeholder="Add agenda items, discussion topics, or meeting notes...&#10;&#10;Example:&#10;• Project status update&#10;• Review Q1 results&#10;• Plan next sprint"
                value={agenda}
                onChange={(e) => setAgenda(e.target.value)}
                rows={6}
                className="resize-none border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Optional: Add meeting agenda items and discussion topics
            </p>
          </div>

          {/* Participants */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Participants</Label>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  ref={searchInputRef}
                  placeholder="Type to search team members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    // Show suggestions when focused
                    if (filteredUsers.length > 0) {
                      setShowUserSuggestions(true)
                    }
                  }}
                  className="pl-9"
                />
              </div>

              {showUserSuggestions && filteredUsers.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute z-50 w-full mt-2 bg-popover border rounded-lg shadow-lg max-h-64 overflow-auto"
                >
                  <div className="p-2">
                    {filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className="px-3 py-2.5 hover:bg-accent cursor-pointer flex items-center gap-3 rounded-md transition-colors"
                        onClick={() => selectUser(user)}
                      >
                        <Avatar className="h-9 w-9 flex-shrink-0">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {getDisplayName(user)
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {getDisplayName(user)}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </p>
                        </div>
                        {user.role && (
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            {user.role}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Selected Users */}
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedUsers.map((user) => (
                  <Badge
                    key={user.id}
                    variant="secondary"
                    className="flex items-center gap-2 py-1 px-2"
                  >
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback className="text-xs">
                        {getDisplayName(user)
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs">{getDisplayName(user)}</span>
                    <button
                      onClick={() => removeUser(user.id)}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Scheduling Options */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4" />
              Schedule for Later (Optional)
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading || isScheduling}
          >
            Cancel
          </Button>
          {isScheduleMode ? (
            <Button
              onClick={handleSchedule}
              disabled={!title.trim() || isScheduling || isLoading}
            >
              {isScheduling ? 'Scheduling...' : 'Schedule Meeting'}
            </Button>
          ) : (
            <>
              {onStartNow && (
                <Button
                  onClick={handleStartNow}
                  disabled={!title.trim() || isLoading || isScheduling}
                >
                  {isLoading ? 'Starting...' : 'Start Now'}
                </Button>
              )}
              {scheduledDate && scheduledTime && (
                <Button
                  onClick={handleSchedule}
                  variant="default"
                  disabled={!title.trim() || isScheduling || isLoading}
                >
                  {isScheduling ? 'Scheduling...' : 'Schedule'}
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
