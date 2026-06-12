import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { ForgetCurveSchedule } from '@/types'

interface ForgetCurveStore {
  schedules: Record<string, ForgetCurveSchedule>
  addSchedule: (itemId: string, schedule: ForgetCurveSchedule) => void
  updateSchedule: (itemId: string, schedule: Partial<ForgetCurveSchedule>) => void
  removeSchedule: (itemId: string) => void
  getSchedule: (itemId: string) => ForgetCurveSchedule | undefined
  getItemsDueToday: () => string[]
  getItemsDueInDays: (days: number) => string[]
}

export const useForgetCurveStore = create<ForgetCurveStore>()(
  immer((set, get) => ({
    schedules: {},

    addSchedule: (itemId, schedule) => {
      set((state) => {
        state.schedules[itemId] = schedule
      })
    },

    updateSchedule: (itemId, updates) => {
      set((state) => {
        const current = state.schedules[itemId]
        if (current) {
          state.schedules[itemId] = { ...current, ...updates }
        }
      })
    },

    removeSchedule: (itemId) => {
      set((state) => {
        delete state.schedules[itemId]
      })
    },

    getSchedule: (itemId) => {
      return get().schedules[itemId]
    },

    getItemsDueToday: () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const dueItems: string[] = []
      Object.entries(get().schedules).forEach(([itemId, schedule]) => {
        const nextReview = new Date(schedule.nextReviewDate)
        nextReview.setHours(0, 0, 0, 0)

        if (nextReview <= today) {
          dueItems.push(itemId)
        }
      })

      return dueItems
    },

    getItemsDueInDays: (days) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const targetDate = new Date(today)
      targetDate.setDate(targetDate.getDate() + days)

      const dueItems: string[] = []
      Object.entries(get().schedules).forEach(([itemId, schedule]) => {
        const nextReview = new Date(schedule.nextReviewDate)
        nextReview.setHours(0, 0, 0, 0)

        if (nextReview <= targetDate && nextReview > today) {
          dueItems.push(itemId)
        }
      })

      return dueItems
    }
  }))
)
