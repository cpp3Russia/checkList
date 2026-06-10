import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { ChecklistItem } from '@/types'

interface ChecklistStore {
  items: ChecklistItem[]
  setItems: (items: ChecklistItem[]) => void
  addItem: (item: ChecklistItem) => void
  removeItem: (id: string) => void
  updateItem: (id: string, updates: Partial<ChecklistItem>) => void
  completeItem: (id: string, images: string[], completed?: boolean, completedDurationMs?: number) => void
  getItemsByDate: (date: Date) => ChecklistItem[]
  getItemsByDateRange: (start: Date, end: Date) => ChecklistItem[]
  undoCompletion: (id: string) => void
  clearCompleted: (date: Date) => void
}

export const useChecklistStore = create<ChecklistStore>()(
  immer((set, get) => ({
    items: [],
    
    setItems: (items) => {
      set((state) => {
        state.items = items
      })
    },

    addItem: (item) => {
      set((state) => {
        const existingIndex = state.items.findIndex((entry) => entry.id === item.id)

        if (existingIndex >= 0) {
          state.items[existingIndex] = item
          return
        }

        state.items.push(item)
      })
    },
    
    removeItem: (id) => {
      set((state) => {
        state.items = state.items.filter(item => item.id !== id)
      })
    },
    
    updateItem: (id, updates) => {
      set((state) => {
        const item = state.items.find(item => item.id === id)
        if (item) {
          Object.assign(item, updates)
        }
      })
    },
    
    completeItem: (id, images, completed = true, completedDurationMs) => {
      set((state) => {
        const item = state.items.find(item => item.id === id)
        if (item) {
          item.completed = completed
          item.images = images
          item.completedAt = completed ? new Date() : undefined
          item.completedDurationMs = completed ? completedDurationMs : undefined
        }
      })
    },
    
    getItemsByDate: (date) => {
      const dateStr = date.toDateString()
      return get().items.filter(
        item => item.date.toDateString() === dateStr
      )
    },
    
    getItemsByDateRange: (start, end) => {
      return get().items.filter(
        item => item.date >= start && item.date <= end
      )
    },
    
    undoCompletion: (id) => {
      set((state) => {
        const item = state.items.find(item => item.id === id)
        if (item) {
          item.completed = false
          item.images = []
          item.completedAt = undefined
          item.completedDurationMs = undefined
        }
      })
    },
    
    clearCompleted: (date) => {
      set((state) => {
        const dateStr = date.toDateString()
        state.items = state.items.filter(
          item => !(item.date.toDateString() === dateStr && item.completed)
        )
      })
    }
  }))
)
