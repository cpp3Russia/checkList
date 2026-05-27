import { useEffect, useState } from 'react'
import { useForgetCurveStore } from '@/store/forgetCurveStore'
import { useChecklistStore } from '@/store/checklistStore'
import type { ForgetCurveSchedule } from '@/types'
import {
  calculateNextReviewDate,
  shouldRemindReview,
  getDaysUntilNextReview,
  formatReviewInfo
} from '@/utils/forgetCurveUtils'

export function useForgetCurve(itemId?: string) {
  const [reminders, setReminders] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const forgetCurveStore = useForgetCurveStore()
  const checklistStore = useChecklistStore()

  const addToForgetCurve = (id: string) => {
    const schedule = calculateNextReviewDate(0)
    forgetCurveStore.addSchedule(id, schedule)
  }

  const markAsReviewed = (id: string) => {
    const current = forgetCurveStore.getSchedule(id)
    if (current) {
      const nextSchedule = calculateNextReviewDate(current.level)
      forgetCurveStore.updateSchedule(id, nextSchedule)
    }
  }

  const getDueItems = () => {
    return forgetCurveStore.getItemsDueToday()
  }

  const getUpcomingSchedule = (days: number = 30) => {
    const schedule: { [day: number]: string[] } = {}

    for (let i = 0; i <= days; i++) {
      const dueItems = i === 0
        ? forgetCurveStore.getItemsDueToday()
        : forgetCurveStore.getItemsDueInDays(i)

      if (dueItems.length > 0) {
        schedule[i] = dueItems
      }
    }

    return schedule
  }

  const getReviewInfo = (id: string) => {
    const schedule = forgetCurveStore.getSchedule(id)
    if (!schedule) return null

    return {
      schedule,
      shouldRemind: shouldRemindReview(schedule),
      daysUntil: getDaysUntilNextReview(schedule),
      infoText: formatReviewInfo(schedule)
    }
  }

  useEffect(() => {
    const checkReminders = async () => {
      try {
        setLoading(true)
        const dueItems = getDueItems()
        setReminders(dueItems)
      } finally {
        setLoading(false)
      }
    }

    const interval = setInterval(checkReminders, 60000)
    checkReminders()

    return () => clearInterval(interval)
  }, [])

  if (itemId) {
    const reviewInfo = getReviewInfo(itemId)
    return {
      reviewInfo,
      addToForgetCurve: () => addToForgetCurve(itemId),
      markAsReviewed: () => markAsReviewed(itemId)
    }
  }

  return {
    reminders,
    loading,
    getDueItems,
    getUpcomingSchedule,
    addToForgetCurve,
    markAsReviewed,
    getReviewInfo
  }
}
