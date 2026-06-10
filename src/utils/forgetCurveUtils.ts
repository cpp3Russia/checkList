import type { ForgetCurveSchedule } from '@/types'
import { normalizeToDayStart } from '@/utils/dateUtils'

export const FORGET_CURVE_INTERVALS = [0, 1, 3, 7, 15, 30]

export function calculateNextReviewDate(
  currentLevel: number,
  lastReviewDate: Date = new Date()
): ForgetCurveSchedule {
  const nextLevel = Math.min(currentLevel + 1, FORGET_CURVE_INTERVALS.length - 1)
  const interval = FORGET_CURVE_INTERVALS[nextLevel]
  const nextDate = new Date(lastReviewDate)

  nextDate.setDate(nextDate.getDate() + interval)
  nextDate.setHours(9, 0, 0, 0)

  return {
    level: nextLevel,
    nextReviewDate: nextDate,
    easeFactor: 2.5,
    interval,
    lastReviewDate,
    reviewCount: currentLevel + 1
  }
}

export function createInitialReviewSchedule(baseDate: Date = new Date()): ForgetCurveSchedule {
  return calculateNextReviewDate(0, normalizeToDayStart(baseDate))
}

export function calculateEaseFactor(quality: number, easeFactor: number): number {
  const nextEaseFactor = easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
  return Math.max(1.3, nextEaseFactor)
}

export function shouldRemindReview(schedule: ForgetCurveSchedule): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const nextReview = new Date(schedule.nextReviewDate)
  nextReview.setHours(0, 0, 0, 0)

  return nextReview <= today
}

export function getReviewProgress(schedule: ForgetCurveSchedule): number {
  if (schedule.level === 0) return 0
  return (schedule.level / (FORGET_CURVE_INTERVALS.length - 1)) * 100
}

export function getDaysUntilNextReview(schedule: ForgetCurveSchedule): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const nextReview = new Date(schedule.nextReviewDate)
  nextReview.setHours(0, 0, 0, 0)

  const diff = nextReview.getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function formatReviewInfo(schedule: ForgetCurveSchedule): string {
  const daysUntil = getDaysUntilNextReview(schedule)

  if (daysUntil === 0) return 'Review today'
  if (daysUntil === 1) return 'Review tomorrow'
  if (daysUntil > 1) return `Review in ${daysUntil} days`

  return `Overdue by ${Math.abs(daysUntil)} days`
}

export function generateReviewPlan(
  createdDate: Date,
  isInForgetCurve: boolean
): ForgetCurveSchedule[] {
  if (!isInForgetCurve) return []

  const plan: ForgetCurveSchedule[] = []
  let currentDate = normalizeToDayStart(createdDate)

  for (let level = 0; level < FORGET_CURVE_INTERVALS.length - 1; level++) {
    const schedule = calculateNextReviewDate(level, currentDate)
    plan.push(schedule)
    currentDate = new Date(schedule.nextReviewDate)
  }

  return plan
}
