import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface StopResult {
  taskId: string | null
  elapsedMs: number
}

interface TimerState {
  activeTaskId: string | null
  startTime: number | null
  accumulatedTime: number
  isRunning: boolean
  startTimer: (taskId: string) => void
  pauseTimer: () => void
  stopTimer: () => StopResult
  clearTimer: () => void
  getElapsedMs: () => number
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      activeTaskId: null,
      startTime: null,
      accumulatedTime: 0,
      isRunning: false,

      startTimer: (taskId) => {
        const { activeTaskId, isRunning } = get()

        if (activeTaskId !== taskId) {
          set({
            activeTaskId: taskId,
            startTime: Date.now(),
            accumulatedTime: 0,
            isRunning: true
          })
          return
        }

        if (!isRunning) {
          set({
            startTime: Date.now(),
            isRunning: true
          })
        }
      },

      pauseTimer: () => {
        const { isRunning, startTime, accumulatedTime } = get()

        if (isRunning && startTime) {
          const now = Date.now()
          set({
            isRunning: false,
            accumulatedTime: accumulatedTime + (now - startTime),
            startTime: null
          })
        }
      },

      stopTimer: () => {
        const { activeTaskId, startTime, accumulatedTime, isRunning } = get()
        const elapsedMs =
          isRunning && startTime ? accumulatedTime + (Date.now() - startTime) : accumulatedTime

        set({
          activeTaskId: null,
          startTime: null,
          accumulatedTime: 0,
          isRunning: false
        })

        return {
          taskId: activeTaskId,
          elapsedMs
        }
      },

      clearTimer: () => {
        set({
          activeTaskId: null,
          startTime: null,
          accumulatedTime: 0,
          isRunning: false
        })
      },

      getElapsedMs: () => {
        const { startTime, accumulatedTime, isRunning } = get()

        if (!isRunning || !startTime) {
          return accumulatedTime
        }

        return accumulatedTime + (Date.now() - startTime)
      }
    }),
    {
      name: 'timer-storage',
      onRehydrateStorage: () => (state) => {
        if (state?.isRunning && state.startTime) {
          // 页面刷新后 startTime 已过期，将已流逝的时间累加到 accumulatedTime 并重置
          state.accumulatedTime += Date.now() - state.startTime
          state.startTime = Date.now()
        }
      }
    }
  )
)
