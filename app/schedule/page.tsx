'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Calendar,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Plus,
    MoreVertical,
    Clock,
    Users,
    BookOpen,
    Briefcase,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type ViewType = 'day' | 'week' | 'month'
type EventType = 'all' | 'project' | 'meeting' | 'education'

interface ScheduleEvent {
    id: string
    title: string
    startTime: string
    endTime: string
    date: string
    type: 'project' | 'meeting' | 'education'
    team?: string
}

const timeSlots = [
    '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
    '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM',
    '11:00 PM', '12:00 AM'
]

const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

export default function SchedulePage() {
    const [viewType, setViewType] = useState<ViewType>('week')
    const [eventFilter, setEventFilter] = useState<EventType>('all')
    const [currentDate, setCurrentDate] = useState(new Date('2026-06-25'))
    const [selectedDate, setSelectedDate] = useState(new Date('2026-06-25'))
    const [miniCalendarMonth, setMiniCalendarMonth] = useState(() => {
        const date = new Date('2026-06-25')
        return new Date(date.getFullYear(), date.getMonth(), 1)
    })
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [newEvent, setNewEvent] = useState({
        title: '',
        date: new Date('2026-06-25').toISOString().split('T')[0],
        startTime: '09:00 AM',
        endTime: '10:00 AM',
        type: 'meeting' as 'project' | 'meeting' | 'education',
    })

    const [events, setEvents] = useState<ScheduleEvent[]>([
        {
            id: '1',
            title: 'Client Presentation',
            startTime: '10:00 AM',
            endTime: '11:30 AM',
            date: '2026-06-23',
            type: 'meeting',
        },
        {
            id: '2',
            title: 'Project Work',
            startTime: '09:00 AM',
            endTime: '10:30 AM',
            date: '2026-06-24',
            type: 'project',
        },
        {
            id: '3',
            title: 'Online Workshop',
            startTime: '11:00 AM',
            endTime: '12:00 PM',
            date: '2026-06-24',
            type: 'education',
        },
        {
            id: '4',
            title: 'Design Sprint Review',
            startTime: '08:00 AM',
            endTime: '09:30 AM',
            date: '2026-06-25',
            type: 'project',
        },
        {
            id: '5',
            title: 'Group Discussion',
            startTime: '10:00 AM',
            endTime: '10:30 AM',
            date: '2026-06-25',
            type: 'education',
        },
        {
            id: '6',
            title: 'Weekly Meeting',
            startTime: '10:30 AM',
            endTime: '12:00 PM',
            date: '2026-06-25',
            type: 'meeting',
        },
        {
            id: '7',
            title: 'Wireframe Review',
            startTime: '09:00 AM',
            endTime: '10:00 AM',
            date: '2026-06-26',
            type: 'project',
        },
        {
            id: '8',
            title: 'Project Work',
            startTime: '10:00 AM',
            endTime: '11:00 AM',
            date: '2026-06-27',
            type: 'project',
        },
    ])

    const getEventColor = (type: string) => {
        switch (type) {
            case 'project':
                return 'bg-red-500'
            case 'meeting':
                return 'bg-yellow-500'
            case 'education':
                return 'bg-green-500'
            default:
                return 'bg-gray-500'
        }
    }

    const getEventTypeLabel = (type: string) => {
        switch (type) {
            case 'project':
                return 'Project'
            case 'meeting':
                return 'Meeting'
            case 'education':
                return 'Education'
            default:
                return 'Event'
        }
    }

    const getWeekDates = () => {
        const dates = []
        const startOfWeek = new Date(currentDate)
        const day = startOfWeek.getDay()
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1) // Adjust to Monday
        startOfWeek.setDate(diff)

        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek)
            date.setDate(startOfWeek.getDate() + i)
            dates.push(date)
        }
        return dates
    }

    const weekDates = getWeekDates()
    const currentTime = new Date()
    const currentHour = currentTime.getHours()
    const currentMinute = currentTime.getMinutes()
    const currentTimeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')} ${currentHour >= 12 ? 'PM' : 'AM'}`

    const getEventsForDate = (date: Date) => {
        const dateString = date.toISOString().split('T')[0]
        return events.filter(event => {
            if (eventFilter !== 'all' && event.type !== eventFilter) return false
            return event.date === dateString
        })
    }

    const getTimePosition = (time: string) => {
        const [timePart, period] = time.split(' ')
        const [hours, minutes] = timePart.split(':').map(Number)
        let hour24 = hours
        if (period === 'PM' && hours !== 12) hour24 += 12
        if (period === 'AM' && hours === 12) hour24 = 0
        
        const totalMinutes = hour24 * 60 + minutes
        const startMinutes = 8 * 60 // 8:00 AM
        const endMinutes = 24 * 60 // 12:00 AM (midnight)
        const totalRange = endMinutes - startMinutes
        
        return ((totalMinutes - startMinutes) / totalRange) * 100
    }

    const getEventHeight = (startTime: string, endTime: string) => {
        const startPos = getTimePosition(startTime)
        const endPos = getTimePosition(endTime)
        return Math.max(endPos - startPos, 5) // Minimum 5% height for better visibility
    }

    const getEventTop = (startTime: string) => {
        return getTimePosition(startTime)
    }

    const formatDate = (date: Date) => {
        if (viewType === 'day') {
            return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
        } else if (viewType === 'week') {
            const weekStart = new Date(date)
            const day = weekStart.getDay()
            const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1)
            weekStart.setDate(diff)
            const weekEnd = new Date(weekStart)
            weekEnd.setDate(weekStart.getDate() + 6)
            return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
        } else {
            return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        }
    }

    const navigateDate = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate)
        if (viewType === 'day') {
            newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
        } else if (viewType === 'week') {
            newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
        } else if (viewType === 'month') {
            newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
        }
        setCurrentDate(newDate)
        setSelectedDate(newDate)
    }

    const getMonthDates = (date: Date = currentDate) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const daysInMonth = lastDay.getDate()
        const startingDayOfWeek = firstDay.getDay()

        const dates: (Date | null)[] = []
        
        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            dates.push(null)
        }
        
        // Add all days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            dates.push(new Date(year, month, day))
        }
        
        return dates
    }

    const getDayEvents = (date: Date) => {
        const dateString = date.toISOString().split('T')[0]
        return events.filter(event => {
            if (eventFilter !== 'all' && event.type !== eventFilter) return false
            return event.date === dateString
        }).sort((a, b) => {
            const timeA = a.startTime
            const timeB = b.startTime
            return timeA.localeCompare(timeB)
        })
    }

    const timeBreakdown = {
        project: 45,
        meeting: 30,
        education: 25,
    }

    const upcomingEvents = [
        { title: 'Group Discussion', time: '10:00 - 10:30', type: 'education' },
        { title: 'Wireframe Review', time: '09:00 - 10:00', type: 'project' },
        { title: 'Weekly Meeting', time: '10:30 - 12:00', type: 'meeting' },
        { title: 'Project Work', time: '10:00 - 11:00', type: 'project' },
    ]

    const handleAddEvent = () => {
        if (!newEvent.title.trim()) {
            alert('Please enter a title for the event')
            return
        }

        const newScheduleEvent: ScheduleEvent = {
            id: Date.now().toString(),
            title: newEvent.title,
            date: newEvent.date,
            startTime: newEvent.startTime,
            endTime: newEvent.endTime,
            type: newEvent.type,
        }

        setEvents([...events, newScheduleEvent])
        setIsAddDialogOpen(false)
        setNewEvent({
            title: '',
            date: selectedDate.toISOString().split('T')[0],
            startTime: '09:00 AM',
            endTime: '10:00 AM',
            type: 'meeting',
        })
    }

    const formatTimeForInput = (time: string) => {
        // Convert "09:00 AM" to "09:00" format
        const [timePart, period] = time.split(' ')
        const [hours, minutes] = timePart.split(':')
        let hour24 = parseInt(hours)
        if (period === 'PM' && hour24 !== 12) hour24 += 12
        if (period === 'AM' && hour24 === 12) hour24 = 0
        return `${hour24.toString().padStart(2, '0')}:${minutes}`
    }

    const formatTimeFromInput = (time: string) => {
        // Convert "09:00" to "09:00 AM" format
        const [hours, minutes] = time.split(':')
        const hour24 = parseInt(hours)
        const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24
        const period = hour24 >= 12 ? 'PM' : 'AM'
        return `${hour12.toString().padStart(2, '0')}:${minutes} ${period}`
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex">
            <main className="flex-1 flex flex-col">

                {/* Main Content */}
                <div className="flex-1 flex" style={{ height: 'calc(100vh - 8rem)' }}>
                    {/* Left Sidebar */}
                    <aside className="w-64 border-x border-border bg-muted/30 p-4 overflow-y-auto" style={{ height: '100%' }}>
                        {/* Mini Calendar */}
                        <Card className="mb-4">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => {
                                            const newDate = new Date(miniCalendarMonth)
                                            newDate.setMonth(newDate.getMonth() - 1)
                                            setMiniCalendarMonth(newDate)
                                        }}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <CardTitle className="text-sm font-semibold">
                                        {miniCalendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                    </CardTitle>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => {
                                            const newDate = new Date(miniCalendarMonth)
                                            newDate.setMonth(newDate.getMonth() + 1)
                                            setMiniCalendarMonth(newDate)
                                        }}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-7 gap-1 text-xs mb-2">
                                    {['M', 'T', 'W', 'TH', 'F', 'S', 'SU'].map((day, idx) => (
                                        <div key={idx} className="text-center text-muted-foreground font-medium">
                                            {day}
                                        </div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-7 gap-1">
                                    {getMonthDates(miniCalendarMonth).map((date, idx) => (
                                        date ? (
                                            <button
                                                key={idx}
                                                onClick={() => {
                                                    setSelectedDate(date);
                                                    setCurrentDate(date);
                                                    setViewType('day');
                                                }}
                                                className={cn(
                                                    "h-8 w-8 rounded-full text-xs flex items-center justify-center hover:bg-accent transition-colors",
                                                    date.toDateString() === new Date().toDateString() && "border border-blue-500",
                                                    date.toDateString() === selectedDate.toDateString() && "bg-blue-500 text-white hover:bg-blue-600",
                                                    date.getMonth() !== miniCalendarMonth.getMonth() && "text-muted-foreground"
                                                )}
                                            >
                                                {date.getDate()}
                                            </button>
                                        ) : (
                                            <div key={idx} className="h-8 w-8" />
                                        )
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Team Section */}
                        <Card className="mb-4">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-semibold">Team</CardTitle>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-purple-500" />
                                    <span className="text-sm">All Team</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                                    <span className="text-sm">Team Project</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Time Breakdown */}
                        <Card className="mb-4">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold">Time Breakdown</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-red-500" />
                                            <span className="text-xs">Project</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">{timeBreakdown.project}%</span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-red-500" style={{ width: `${timeBreakdown.project}%` }} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-yellow-500" />
                                            <span className="text-xs">Meeting</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">{timeBreakdown.meeting}%</span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-yellow-500" style={{ width: `${timeBreakdown.meeting}%` }} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-green-500" />
                                            <span className="text-xs">Education</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">{timeBreakdown.education}%</span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500" style={{ width: `${timeBreakdown.education}%` }} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Upcoming Schedule */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold">Upcoming Schedule</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {upcomingEvents.map((event, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <div className={cn(
                                            "w-1 h-12 rounded-full mt-1",
                                            event.type === 'project' && "bg-red-500",
                                            event.type === 'meeting' && "bg-yellow-500",
                                            event.type === 'education' && "bg-green-500"
                                        )} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium truncate">{event.title}</p>
                                            <p className="text-xs text-muted-foreground">{event.time}</p>
                                        </div>
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                            <MoreVertical className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </aside>

                    {/* Main Schedule Area */}
                    <div className="flex-1 flex flex-col overflow-hidden" style={{ height: '100%' }}>
                        {/* Schedule Header */}
                        <div className="border-b border-border p-6 bg-background flex-shrink-0">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h1 className="text-2xl font-bold">My Daily Life</h1>
                                    <p className="text-sm text-muted-foreground">Plan, track, and organize your schedule.</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                {/* Event Type Filters */}
                                <Tabs value={eventFilter} onValueChange={(v) => setEventFilter(v as EventType)}>
                                    <TabsList>
                                        <TabsTrigger value="all">All Event</TabsTrigger>
                                        <TabsTrigger value="project">Project</TabsTrigger>
                                        <TabsTrigger value="meeting">Meeting</TabsTrigger>
                                        <TabsTrigger value="education">Education</TabsTrigger>
                                    </TabsList>
                                </Tabs>

                                {/* Date Navigator */}
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => navigateDate('prev')}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <span className="text-sm font-medium min-w-[200px] text-center">
                                            {formatDate(currentDate)}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => navigateDate('next')}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {/* View Selector (Day/Week/Month) */}
                                        <Tabs value={viewType} onValueChange={(v) => setViewType(v as ViewType)}>
                                            <TabsList>
                                                <TabsTrigger value="day">Day</TabsTrigger>
                                                <TabsTrigger value="week">Week</TabsTrigger>
                                                <TabsTrigger value="month">Month</TabsTrigger>
                                            </TabsList>
                                        </Tabs>
                                        
                                        <Button 
                                            size="sm" 
                                            className="bg-blue-600 hover:bg-blue-700"
                                            onClick={() => {
                                                setNewEvent({
                                                    title: '',
                                                    date: selectedDate.toISOString().split('T')[0],
                                                    startTime: '09:00 AM',
                                                    endTime: '10:00 AM',
                                                    type: 'meeting',
                                                })
                                                setIsAddDialogOpen(true)
                                            }}
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Schedule
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Schedule Grid */}
                        <div className="flex-1 overflow-auto p-6">
                            <div className="relative w-full">
                                {/* Common container structure for all views - ensures consistent width */}
                                <div className="flex">
                                    {/* Time Column - Always present (invisible for month) */}
                                    <div className={cn(
                                        "w-24 flex-shrink-0",
                                        viewType === 'month' && "invisible"
                                    )}>
                                        {viewType !== 'month' && (
                                            <>
                                                <div className="h-16"></div>
                                                {timeSlots.map((time, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="h-16 border-b border-border flex items-start justify-end pr-2 text-xs text-muted-foreground"
                                                    >
                                                        {time}
                                                    </div>
                                                ))}
                                            </>
                                        )}
                                    </div>

                                    {/* Main Content Area - Same width for all views */}
                                    <div className="flex-1 relative min-w-0">
                                        {viewType === 'day' && (
                                            <>
                                                {/* Day Header */}
                                                <div className="h-16 border-b border-border p-4 bg-blue-50 dark:bg-blue-950/20">
                                                    <div className="text-xs text-muted-foreground mb-1">
                                                        {daysOfWeek[selectedDate.getDay()]}
                                                    </div>
                                                    <div className="text-lg font-medium text-blue-600 dark:text-blue-400">
                                                        {selectedDate.getDate()} {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                                    </div>
                                                </div>

                                                {/* Time Grid with Events */}
                                                {timeSlots.map((time, timeIdx) => {
                                                    const dayEvents = getDayEvents(selectedDate)
                                                    const eventsInSlot = dayEvents.filter(event => {
                                                        const eventStart = getTimePosition(event.startTime)
                                                        const slotStart = (timeIdx / timeSlots.length) * 100
                                                        const slotEnd = ((timeIdx + 1) / timeSlots.length) * 100
                                                        return eventStart >= slotStart && eventStart < slotEnd
                                                    })

                                                    return (
                                                        <div
                                                            key={timeIdx}
                                                            className="h-16 border-b border-border relative bg-blue-50/30 dark:bg-blue-950/5"
                                                        >
                                                            {eventsInSlot.map((event) => (
                                                                <div
                                                                    key={event.id}
                                                                    className={cn(
                                                                        "absolute left-2 right-2 rounded p-2.5 text-xs text-white cursor-pointer hover:opacity-90 transition-opacity shadow-sm min-h-[60px] flex flex-col justify-between",
                                                                        getEventColor(event.type)
                                                                    )}
                                                                    style={{
                                                                        top: `${getEventTop(event.startTime)}%`,
                                                                        height: `max(${getEventHeight(event.startTime, event.endTime)}%, 60px)`,
                                                                    }}
                                                                >
                                                                    <div className="flex items-center gap-1.5 mb-1">
                                                                        <div className={cn("w-1.5 h-4 rounded-full flex-shrink-0", getEventColor(event.type))} />
                                                                        <span className="font-medium line-clamp-2 leading-tight">{event.title}</span>
                                                                    </div>
                                                                    <div className="text-xs opacity-90 mt-auto">
                                                                        {event.startTime} - {event.endTime}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )
                                                })}

                                                {/* Current Time Indicator */}
                                                <div
                                                    className="absolute left-0 right-0 pointer-events-none"
                                                    style={{ top: `${getTimePosition(currentTimeString)}%` }}
                                                >
                                                    <div className="relative">
                                                        <div className="h-0.5 bg-green-500" />
                                                        <div className="absolute -top-2 left-0 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded">
                                                            {currentTimeString} +
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {viewType === 'week' && (
                                            <>
                                                {/* Day Headers */}
                                                <div className="grid grid-cols-7 gap-px">
                                                    {weekDates.map((date, idx) => (
                                                        <div
                                                            key={idx}
                                                            className={cn(
                                                                "h-16 border-b border-border p-2",
                                                                date.getDate() === selectedDate.getDate() && "bg-blue-50 dark:bg-blue-950/20"
                                                            )}
                                                        >
                                                            <div className="text-xs text-muted-foreground mb-1">
                                                                {daysOfWeek[date.getDay()]}
                                                            </div>
                                                            <div className={cn(
                                                                "text-sm font-medium",
                                                                date.getDate() === selectedDate.getDate() && "text-blue-600 dark:text-blue-400"
                                                            )}>
                                                                {date.getDate()}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Time Grid with Events */}
                                                {timeSlots.map((time, timeIdx) => (
                                                    <div key={timeIdx} className="grid grid-cols-7 gap-px">
                                                        {weekDates.map((date, dateIdx) => {
                                                            const dateEvents = getEventsForDate(date)
                                                            const eventsInSlot = dateEvents.filter(event => {
                                                                const eventStart = getTimePosition(event.startTime)
                                                                const slotStart = (timeIdx / timeSlots.length) * 100
                                                                const slotEnd = ((timeIdx + 1) / timeSlots.length) * 100
                                                                return eventStart >= slotStart && eventStart < slotEnd
                                                            })

                                                            return (
                                                                <div
                                                                    key={dateIdx}
                                                                    className={cn(
                                                                        "h-16 border-b border-r border-border relative",
                                                                        date.getDate() === selectedDate.getDate() && "bg-blue-50/50 dark:bg-blue-950/10"
                                                                    )}
                                                                >
                                                                    {eventsInSlot.map((event) => (
                                                                        <div
                                                                            key={event.id}
                                                                            className={cn(
                                                                                "absolute left-0 right-1 rounded p-2.5 text-xs text-white cursor-pointer hover:opacity-90 transition-opacity min-h-[60px] flex flex-col justify-between",
                                                                                getEventColor(event.type)
                                                                            )}
                                                                            style={{
                                                                                top: `${getEventTop(event.startTime)}%`,
                                                                                height: `max(${getEventHeight(event.startTime, event.endTime)}%, 60px)`,
                                                                            }}
                                                                        >
                                                                            <div className="flex items-center gap-1.5 mb-1">
                                                                                <div className={cn("w-1.5 h-4 rounded-full flex-shrink-0", getEventColor(event.type))} />
                                                                                <span className="font-medium line-clamp-2 leading-tight">{event.title}</span>
                                                                            </div>
                                                                            <div className="text-xs opacity-90 mt-auto">
                                                                                {event.startTime} - {event.endTime}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                ))}

                                                {/* Current Time Indicator */}
                                                <div
                                                    className="absolute left-0 right-0 pointer-events-none"
                                                    style={{ top: `${getTimePosition(currentTimeString)}%` }}
                                                >
                                                    <div className="relative">
                                                        <div className="h-0.5 bg-green-500" />
                                                        <div className="absolute -top-2 left-0 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded">
                                                            {currentTimeString} +
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {viewType === 'month' && (
                                            <div className="w-full">
                                                {/* Month Calendar Grid */}
                                                <div className="grid grid-cols-7 gap-px border border-border rounded-lg overflow-hidden">
                                                    {/* Day Headers */}
                                                    {daysOfWeek.map((day, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="h-12 border-b border-border bg-muted/50 p-2 flex items-center justify-center text-sm font-medium"
                                                        >
                                                            {day}
                                                        </div>
                                                    ))}

                                                    {/* Calendar Days */}
                                                    {getMonthDates().map((date, idx) => {
                                                        if (!date) {
                                                            return (
                                                                <div
                                                                    key={`empty-${idx}`}
                                                                    className="h-24 border-b border-r border-border bg-muted/20"
                                                                />
                                                            )
                                                        }

                                                        const dayEvents = getEventsForDate(date)
                                                        const isToday = date.toDateString() === new Date().toDateString()
                                                        const isSelected = date.getDate() === selectedDate.getDate() && 
                                                                         date.getMonth() === selectedDate.getMonth() &&
                                                                         date.getFullYear() === selectedDate.getFullYear()

                                                        return (
                                                            <div
                                                                key={idx}
                                                                className={cn(
                                                                    "h-24 border-b border-r border-border p-2 relative cursor-pointer hover:bg-accent transition-colors",
                                                                    isSelected && "bg-blue-50 dark:bg-blue-950/20",
                                                                    isToday && "ring-2 ring-blue-500"
                                                                )}
                                                                onClick={() => setSelectedDate(date)}
                                                            >
                                                                <div className={cn(
                                                                    "text-sm font-medium mb-1",
                                                                    isToday && "text-blue-600 dark:text-blue-400",
                                                                    isSelected && !isToday && "text-blue-600 dark:text-blue-400"
                                                                )}>
                                                                    {date.getDate()}
                                                                </div>
                                                                <div className="space-y-0.5 overflow-hidden">
                                                                    {dayEvents.slice(0, 3).map((event) => (
                                                                        <div
                                                                            key={event.id}
                                                                            className={cn(
                                                                                "text-xs px-1.5 py-0.5 rounded truncate text-white",
                                                                                getEventColor(event.type)
                                                                            )}
                                                                            title={`${event.title} (${event.startTime} - ${event.endTime})`}
                                                                        >
                                                                            {event.startTime} {event.title}
                                                                        </div>
                                                                    ))}
                                                                    {dayEvents.length > 3 && (
                                                                        <div className="text-xs text-muted-foreground px-1.5">
                                                                            +{dayEvents.length - 3} more
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Add Schedule Dialog */}
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Add New Schedule</DialogTitle>
                            <DialogDescription>
                                Create a new event in your schedule.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    placeholder="Enter event title"
                                    value={newEvent.title}
                                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="date">Date *</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={newEvent.date}
                                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="startTime">Start Time *</Label>
                                    <Input
                                        id="startTime"
                                        type="time"
                                        value={formatTimeForInput(newEvent.startTime)}
                                        onChange={(e) => setNewEvent({ ...newEvent, startTime: formatTimeFromInput(e.target.value) })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="endTime">End Time *</Label>
                                    <Input
                                        id="endTime"
                                        type="time"
                                        value={formatTimeForInput(newEvent.endTime)}
                                        onChange={(e) => setNewEvent({ ...newEvent, endTime: formatTimeFromInput(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="type">Event Type *</Label>
                                <Select
                                    value={newEvent.type}
                                    onValueChange={(value: 'project' | 'meeting' | 'education') => 
                                        setNewEvent({ ...newEvent, type: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select event type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="meeting">Meeting</SelectItem>
                                        <SelectItem value="project">Project</SelectItem>
                                        <SelectItem value="education">Education</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleAddEvent}>
                                Add Event
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </main>
        </div>
    )
}

