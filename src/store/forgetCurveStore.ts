import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { ForgetCurveSchedule } from '@/types'

interface ForgetCurveStore {
  schedules: Map<string, ForgetCurveSchedule>
  addSchedule: (itemId: string, schedule: ForgetCurveSchedule) => void
  updateSchedule: (itemId: string, schedule: Partial<ForgetCurveSchedule>) => void
  removeSchedule: (itemId: string) => void
  getSchedule: (itemId: string) => ForgetCurveSchedule | undefined
  getItemsDueToday: () => string[]
  getItemsDueInDays: (days: number) => string[]
}

export const useForgetCurveStore = create<ForgetCurveStore>()(
  immer((set, get) => ({
    schedules: new Map(),
    
    addSchedule: (itemId, schedule) => {
      set((state) => {
        state.schedules.set(itemId, schedule)
      })
    },
    
    updateSchedule: (itemId, updates) => {
      set((state) => {
        const current = state.schedules.get(itemId)
        if (current) {
          state.schedules.set(itemId, { ...current, ...updates })
        }
      })
    },
    
    removeSchedule: (itemId) => {
      set((state) => {
        state.schedules.delete(itemId)
      })
    },
    
    getSchedule: (itemId) => {
      return get().schedules.get(itemId)
    },
    
    getItemsDueToday: () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const dueItems: string[] = []
      get().schedules.forEach((schedule, itemId) => {
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
      get().schedules.forEach((schedule, itemId) => {
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
