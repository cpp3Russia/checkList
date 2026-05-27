import { useEffect, useState } from 'react'
import { subDays } from 'date-fns'
import { storageService } from '@/services/storageService'
import type { ChecklistItem } from '@/types'

export interface TaskInsights {
  totalTasks: number
  completedTasks: number
  completionRate: number
  completedLast7Days: number
  createdLast7Days: number
  averageCompletionMinutes: number
  dailyCompleted: Array<{ label: string; value: number }>
}

const EMPTY_INSIGHTS: TaskInsights = {
  totalTasks: 0,
  completedTasks: 0,
  completionRate: 0,
  completedLast7Days: 0,
  createdLast7Days: 0,
  averageCompletionMinutes: 0,
  dailyCompleted: []
}

const isAfterDate = (value: Date, threshold: Date) => value.getTime() >= threshold.getTime()

function buildInsights(items: ChecklistItem[]): TaskInsights {
  const totalTasks = items.length
  const completedItems = items.filter((item) => item.completed)
  const completedTasks = completedItems.length
  const weekAgo = subDays(new Date(), 6)
  weekAgo.setHours(0, 0, 0, 0)
  const dailyCompleted = Array.from({ length: 7 }, (_, index) => {
    const day = subDays(new Date(), 6 - index)
    day.setHours(0, 0, 0, 0)

    const nextDay = new Date(day)
    nextDay.setDate(day.getDate() + 1)

    return {
      label: `${day.getMonth() + 1}/${day.getDate()}`,
      value: completedItems.filter((item) => {
        if (!item.completedAt) {
          return false
        }

        return item.completedAt >= day && item.completedAt < nextDay
      }).length
    }
  })

  const completionTimes = completedItems
    .map((item) => item.completedDurationMs)
    .filter((value): value is number => typeof value === 'number' && value > 0)

  const averageCompletionMinutes =
    completionTimes.length > 0
      ? Math.round(completionTimes.reduce((sum, value) => sum + value, 0) / completionTimes.length / 60000)
      : 0

  return {
    totalTasks,
    completedTasks,
    completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    completedLast7Days: completedItems.filter(
      (item) => item.completedAt && isAfterDate(item.completedAt, weekAgo)
    ).length,
    createdLast7Days: items.filter((item) => isAfterDate(item.createdAt, weekAgo)).length,
    averageCompletionMinutes,
    dailyCompleted
  }
}

export function useTaskInsights(refreshKey: string) {
  const [insights, setInsights] = useState<TaskInsights>(EMPTY_INSIGHTS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const items = await storageService.getAllItems()

        if (!active) {
          return
        }

        setInsights(buildInsights(items))
      } catch (err) {
        if (!active) {
          return
        }

        setError(err instanceof Error ? err.message : 'Failed to load task insights')
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      active = false
    }
  }, [refreshKey])

  return {
    insights,
    loading,
    error
  }
}
