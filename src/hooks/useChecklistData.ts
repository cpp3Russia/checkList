import { useEffect, useState } from 'react'
import type { ChecklistItem } from '@/types'
import { useChecklistStore } from '@/store/checklistStore'
import { storageService } from '@/services/storageService'

export function useChecklistData(date: Date) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const items = useChecklistStore(state => state.items)
  const setItems = useChecklistStore(state => state.setItems)

  // 当日期变化时，拉取数据并存入 store
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        // 从存储服务加载该日期的所有数据
        const data = await storageService.getItemsByDate(date)
        
        // 合并到 store 中已有数据（避免重复加载不同日期的数据时丢失已改但未存的状态）
        // 简单处理：直接全量替换为当前日期的数据，或者更复杂的按 ID 更新
        setItems(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败')
        console.error('加载清单数据失败:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [date]) // 移除了 storeItems 依赖，避免循环触发

  // 过滤出当前日期要显示的任务
  const dateStr = date.toDateString()
  const displayItems = items.filter(item => {
    const itemDate = new Date(item.date)
    return itemDate.toDateString() === dateStr
  })

  const addItem = async (item: ChecklistItem) => {
    try {
      await storageService.saveItem(item)
      // 更新 store 会自动触发 re-render
      useChecklistStore.getState().addItem(item)
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加失败')
      throw err
    }
  }

  const removeItem = async (id: string) => {
    try {
      await storageService.deleteItem(id)
      useChecklistStore.getState().removeItem(id)
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败')
      throw err
    }
  }

  return {
    items: displayItems,
    loading,
    error,
    addItem,
    removeItem
  }
}
