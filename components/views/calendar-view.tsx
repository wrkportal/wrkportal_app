'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  format, isSameMonth, isToday, isSameDay, addMonths, subMonths
} from 'date-fns'

interface CalendarItem {
  id: string
  title: string
  startDate: Date
  endDate?: Date
  color?: string
  onClick?: () => void
}

interface CalendarViewProps {
  items: CalendarItem[]
  className?: string
}

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const defaultColors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#06b6d4']

export function CalendarView({ items, className }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date())
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const getItemsForDay = (day: Date) => {
    return items.filter((item) => {
      const start = new Date(item.startDate)
      const end = item.endDate ? new Date(item.endDate) : start
      return day >= new Date(start.toDateString()) && day <= new Date(end.toDateString())
    })
  }

  const selectedDayItems = selectedDate ? getItemsForDay(selectedDate) : []

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{format(currentDate, 'MMMM yyyy')}</h2>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-px">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
        {days.map((day) => {
          const dayItems = getItemsForDay(day)
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isSelected = selectedDate && isSameDay(day, selectedDate)

          return (
            <div
              key={day.toISOString()}
              className={cn(
                'min-h-[80px] bg-card p-1.5 cursor-pointer transition-colors hover:bg-accent/30',
                !isCurrentMonth && 'opacity-40',
                isSelected && 'ring-2 ring-primary ring-inset',
              )}
              onClick={() => setSelectedDate(day)}
            >
              <span className={cn(
                'inline-flex items-center justify-center w-6 h-6 text-xs rounded-full',
                isToday(day) && 'bg-primary text-primary-foreground font-bold',
              )}>
                {format(day, 'd')}
              </span>
              <div className="mt-1 space-y-0.5">
                {dayItems.slice(0, 3).map((item, i) => (
                  <div
                    key={item.id}
                    className="text-[10px] leading-tight px-1 py-0.5 rounded truncate text-white"
                    style={{ backgroundColor: item.color || defaultColors[i % defaultColors.length] }}
                    onClick={(e) => {
                      e.stopPropagation()
                      item.onClick?.()
                    }}
                  >
                    {item.title}
                  </div>
                ))}
                {dayItems.length > 3 && (
                  <div className="text-[10px] text-muted-foreground px-1">
                    +{dayItems.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Selected day detail */}
      {selectedDate && (
        <div className="border rounded-lg p-4">
          <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </h3>
          {selectedDayItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">No items scheduled for this day.</p>
          ) : (
            <div className="space-y-2">
              {selectedDayItems.map((item, i) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/30 cursor-pointer"
                  onClick={() => item.onClick?.()}
                >
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: item.color || defaultColors[i % defaultColors.length] }}
                  />
                  <span className="text-sm">{item.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
