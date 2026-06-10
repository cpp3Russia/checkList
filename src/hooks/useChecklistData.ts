import { useEffect, useState } from 'react'
import type { ChecklistItem } from '@/types'
import { useChecklistStore } from '@/store/checklistStore'
import { storageService } from '@/services/storageService'
import { FORGET_CURVE_INTERVALS, calculateNextReviewDate, createInitialReviewSchedule } from '@/utils/forgetCurveUtils'
import { isSameDay } from '@/utils/dateUtils'

const LAST_REVIEW_LEVEL = FORGET_CURVE_INTERVALS.length - 1
const REVIEW_INSTANCE_SUFFIX = '::review::'

const isPersistedReviewInstance = (item: ChecklistItem) => item.id.includes(REVIEW_INSTANCE_SUFFIX)

const hydrateForgetCurveItem = (item: ChecklistItem): ChecklistItem => {
  const taskScope = item.taskScope ?? 'daily'

  if (taskScope === 'master') {
    return {
      ...item,
      taskScope,
      inForgetCurve: false,
      reviewOccurrenceDate: undefined,
      forgetCurveData: undefined
    }
  }

  if (!item.inForgetCurve) {
    return {
      ...item,
      taskScope,
      reviewOccurrenceDate: undefined
    }
  }

  const schedule = item.forgetCurveData ?? createInitialReviewSchedule(item.completedAt ?? item.date)

  return {
    ...item,
    taskScope,
    forgetCurveData: schedule,
    reviewOccurrenceDate: item.reviewOccurrenceDate ?? schedule.nextReviewDate
  }
}

const buildReviewInstances = (item: ChecklistItem): ChecklistItem[] => {
  if (!item.inForgetCurve || !item.forgetCurveData || !item.reviewOccurrenceDate) {
    return []
  }

  const reviewInstances: ChecklistItem[] = []
  let currentSchedule = { ...item.forgetCurveData }
  let currentOccurrenceDate = new Date(item.reviewOccurrenceDate)

  for (let level = currentSchedule.level; level <= LAST_REVIEW_LEVEL; level += 1) {
    reviewInstances.push({
      ...item,
      id: `${item.id}::review::${currentOccurrenceDate.getTime()}`,
      date: currentOccurrenceDate,
      isReviewInstance: true,
      reviewSourceItemId: item.id,
      completed: false,
      completedAt: undefined,
      completedDurationMs: undefined
    })

    if (level >= LAST_REVIEW_LEVEL) {
      break
    }

    currentSchedule = calculateNextReviewDate(level, currentOccurrenceDate)
    currentOccurrenceDate = new Date(currentSchedule.nextReviewDate)
  }

  return reviewInstances
}

const buildReviewHistoryEntries = (item: ChecklistItem): ChecklistItem[] => {
  if (!item.reviewHistory?.length) {
    return []
  }

  return item.reviewHistory.map((entry) => ({
    ...item,
    id: entry.id,
    date: new Date(entry.occurrenceDate),
    completed: true,
    completedAt: new Date(entry.completedAt),
    completedDurationMs: entry.completedDurationMs,
    isReviewInstance: false,
    isReviewHistoryEntry: true,
    reviewSourceItemId: item.id
  }))
}

export function useChecklistData(date: Date) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const items = useChecklistStore((state) => state.items)
  const setItems = useChecklistStore((state) => state.setItems)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        const storedItems = await storageService.getAllItems()
        const invalidReviewInstances = storedItems.filter(isPersistedReviewInstance)

        if (invalidReviewInstances.length > 0) {
          await Promise.all(invalidReviewInstances.map((item) => storageService.deleteItem(item.id)))
        }

        const data = storedItems.filter((item) => !isPersistedReviewInstance(item))
        const hydratedItems = data.map(hydrateForgetCurveItem)
        const itemsNeedingUpdate = hydratedItems.filter((item, index) => {
          const source = data[index]
          return (
            source.inForgetCurve &&
            (!source.forgetCurveData || !source.reviewOccurrenceDate)
          )
        })

        if (itemsNeedingUpdate.length > 0) {
          await Promise.all(itemsNeedingUpdate.map((item) => storageService.saveItem(item)))
        }

        setItems(hydratedItems)
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载任务失败')
        console.error('加载清单数据失败:', err)
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [date, setItems])

  const displayItems = items
    .filter((item) => (item.taskScope ?? 'daily') === 'daily')
    .flatMap((item) => {
      const entries: ChecklistItem[] = []

      if (isSameDay(new Date(item.date), date)) {
        entries.push(item)
      }

      buildReviewInstances(item).forEach((reviewInstance) => {
        if (isSameDay(reviewInstance.date, date)) {
          entries.push(reviewInstance)
        }
      })

      buildReviewHistoryEntries(item).forEach((historyEntry) => {
        if (isSameDay(historyEntry.date, date)) {
          entries.push(historyEntry)
        }
      })

      return entries
    })
    .sort((a, b) => {
      const aOrder = a.sortOrder ?? Number.MAX_SAFE_INTEGER
      const bOrder = b.sortOrder ?? Number.MAX_SAFE_INTEGER

      if (aOrder !== bOrder) {
        return aOrder - bOrder
      }

      return a.createdAt.getTime() - b.createdAt.getTime()
    })

  const saveItem = async (item: ChecklistItem) => {
    try {
      const normalizedItem = hydrateForgetCurveItem(item)
      await storageService.saveItem(normalizedItem)
      useChecklistStore.getState().addItem(normalizedItem)
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存任务失败')
      throw err
    }
  }

  const saveItems = async (nextItems: ChecklistItem[]) => {
    try {
      const normalizedItems = nextItems.map(hydrateForgetCurveItem)

      await Promise.all(normalizedItems.map((item) => storageService.saveItem(item)))

      const currentItems = useChecklistStore.getState().items
      const nextItemMap = new Map(normalizedItems.map((item) => [item.id, item]))
      const mergedItems = currentItems.map((item) => nextItemMap.get(item.id) ?? item)

      normalizedItems.forEach((item) => {
        if (!mergedItems.some((entry) => entry.id === item.id)) {
          mergedItems.push(item)
        }
      })

      useChecklistStore.getState().setItems(mergedItems)
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新任务顺序失败')
      throw err
    }
  }

  const removeItem = async (id: string) => {
    try {
      await storageService.deleteItem(id)
      useChecklistStore.getState().removeItem(id)
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除任务失败')
      throw err
    }
  }

  return {
    items: displayItems,
    loading,
    error,
    saveItem,
    saveItems,
    removeItem
  }
}
