'use client'

import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  FolderKanban, UserPlus, Target, Clock, Zap, Brain, Flame, DollarSign, Trophy
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Achievement {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  unlocked: boolean
  progress: number // 0-100
  maxProgress: number
  currentProgress: number
}

const achievements: Achievement[] = [
  { id: 'first-project', title: 'First Project', description: 'Create your first project', icon: <FolderKanban className="h-5 w-5" />, unlocked: false, progress: 0, maxProgress: 1, currentProgress: 0 },
  { id: 'team-player', title: 'Team Player', description: 'Invite 3 team members', icon: <UserPlus className="h-5 w-5" />, unlocked: false, progress: 0, maxProgress: 3, currentProgress: 0 },
  { id: 'goal-setter', title: 'Goal Setter', description: 'Create 5 OKRs', icon: <Target className="h-5 w-5" />, unlocked: false, progress: 0, maxProgress: 5, currentProgress: 0 },
  { id: 'time-tracker', title: 'Time Tracker', description: 'Log 40 hours in a week', icon: <Clock className="h-5 w-5" />, unlocked: false, progress: 0, maxProgress: 40, currentProgress: 0 },
  { id: 'sprint-champion', title: 'Sprint Champion', description: 'Complete all tasks in a sprint', icon: <Zap className="h-5 w-5" />, unlocked: false, progress: 0, maxProgress: 1, currentProgress: 0 },
  { id: 'ai-explorer', title: 'AI Explorer', description: 'Use 5 different AI tools', icon: <Brain className="h-5 w-5" />, unlocked: false, progress: 0, maxProgress: 5, currentProgress: 0 },
  { id: 'streak-master', title: 'Streak Master', description: 'Log in 7 days in a row', icon: <Flame className="h-5 w-5" />, unlocked: false, progress: 0, maxProgress: 7, currentProgress: 0 },
  { id: 'budget-boss', title: 'Budget Boss', description: 'Keep a project under budget', icon: <DollarSign className="h-5 w-5" />, unlocked: false, progress: 0, maxProgress: 1, currentProgress: 0 },
]

export function Achievements() {
  const [userAchievements, setUserAchievements] = React.useState(achievements)

  React.useEffect(() => {
    const stored = localStorage.getItem('wrkportal_achievements')
    if (stored) {
      const progress: Record<string, number> = JSON.parse(stored)
      setUserAchievements((prev) =>
        prev.map((a) => {
          const current = progress[a.id] || 0
          return {
            ...a,
            currentProgress: current,
            progress: Math.min(100, Math.round((current / a.maxProgress) * 100)),
            unlocked: current >= a.maxProgress,
          }
        })
      )
    }
  }, [])

  const unlockedCount = userAchievements.filter((a) => a.unlocked).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Achievements
        </h3>
        <span className="text-sm text-muted-foreground">{unlockedCount}/{userAchievements.length} unlocked</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {userAchievements.map((achievement) => (
          <Card
            key={achievement.id}
            className={cn(
              'transition-all',
              achievement.unlocked
                ? 'border-yellow-500/30 bg-gradient-to-br from-yellow-500/5 to-transparent shadow-sm shadow-yellow-500/10'
                : 'opacity-50 grayscale'
            )}
          >
            <CardContent className="p-4 text-center">
              <div className={cn(
                'inline-flex items-center justify-center w-10 h-10 rounded-full mb-2',
                achievement.unlocked
                  ? 'bg-yellow-500/20 text-yellow-500'
                  : 'bg-muted text-muted-foreground'
              )}>
                {achievement.icon}
              </div>
              <p className="text-xs font-semibold mb-0.5">{achievement.title}</p>
              <p className="text-[10px] text-muted-foreground mb-2">{achievement.description}</p>
              {!achievement.unlocked && (
                <div className="space-y-1">
                  <Progress value={achievement.progress} className="h-1" />
                  <p className="text-[10px] text-muted-foreground">
                    {achievement.currentProgress}/{achievement.maxProgress}
                  </p>
                </div>
              )}
              {achievement.unlocked && (
                <span className="text-[10px] text-yellow-500 font-medium">Unlocked!</span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function StreakCounter() {
  const [streak, setStreak] = React.useState(0)

  React.useEffect(() => {
    const stored = localStorage.getItem('wrkportal_streak')
    if (stored) {
      const data = JSON.parse(stored)
      const lastVisit = new Date(data.lastVisit)
      const today = new Date()
      const diffDays = Math.floor((today.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24))

      if (diffDays === 0) {
        setStreak(data.count)
      } else if (diffDays === 1) {
        const newCount = data.count + 1
        setStreak(newCount)
        localStorage.setItem('wrkportal_streak', JSON.stringify({ count: newCount, lastVisit: today.toISOString() }))
      } else {
        setStreak(1)
        localStorage.setItem('wrkportal_streak', JSON.stringify({ count: 1, lastVisit: today.toISOString() }))
      }
    } else {
      setStreak(1)
      localStorage.setItem('wrkportal_streak', JSON.stringify({ count: 1, lastVisit: new Date().toISOString() }))
    }
  }, [])

  if (streak === 0) return null

  return (
    <div className="flex items-center gap-1.5 text-sm">
      <Flame className={cn('h-4 w-4', streak >= 7 ? 'text-orange-500' : 'text-muted-foreground')} />
      <span className="font-medium">{streak}</span>
      <span className="text-muted-foreground text-xs">day streak</span>
    </div>
  )
}
