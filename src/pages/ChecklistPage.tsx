import { useState } from 'react'
import {
  Container,
  Box,
  Button,
  Stack,
  CircularProgress,
  Alert,
  Typography
} from '@mui/material'
import { Add as AddIcon, Refresh as RefreshIcon } from '@mui/icons-material'
import type { ChecklistItem as ChecklistItemType } from '@/types'
import { useChecklistData } from '@/hooks/useChecklistData'
import { useChecklistStore } from '@/store/checklistStore'
import { AddTaskModal } from '@/components/AddTaskModal'
import { ChecklistItem } from '@/components/ChecklistItem'
import { getTodayDate } from '@/utils/dateUtils'

export function ChecklistPage() {
  const [currentDate, setCurrentDate] = useState(getTodayDate())
  const [openModal, setOpenModal] = useState(false)
  const [editingItem, setEditingItem] = useState<ChecklistItemType | null>(null)

  const { items, loading, error, saveItem, removeItem } = useChecklistData(currentDate)
  const checklistStore = useChecklistStore()

  const handleAddTask = async (item: ChecklistItemType) => {
    try {
      await saveItem(item)
      setOpenModal(false)
    } catch (err) {
      console.error('添加任务失败:', err)
    }
  }

  const handleDeleteItem = async (id: string) => {
    try {
      await removeItem(id)
    } catch (err) {
      console.error('删除任务失败:', err)
    }
  }

  const handleCompleteItem = (id: string, images: string[], completed: boolean) => {
    checklistStore.completeItem(id, images, completed)
  }

  const handleRefresh = () => {
    // 重新加载当前日期的数据
    setCurrentDate(getTodayDate())
  }

  // 统计信息
  const totalCount = items.length
  const completedCount = items.filter(item => item.completed).length
  const pendingCount = totalCount - completedCount

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      {/* 页面标题 */}
      <Box className="checklist-page__header" sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
          待办清单
        </Typography>
        <Typography variant="body2" color="text.secondary">
          今天有 {totalCount} 个任务，已完成 {completedCount} 个，待完成 {pendingCount} 个
        </Typography>
      </Box>

      {/* 操作栏 */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenModal(true)}
        >
          新增任务
        </Button>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
        >
          刷新
        </Button>
      </Stack>

      {/* 错误提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 加载中 */}
      {loading ? (
        <Box className="checklist-page__loading" sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : items.length === 0 ? (
        <Box className="checklist-page__empty" sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            暂无任务，点击"新增任务"开始吧
          </Typography>
        </Box>
      ) : (
        /* 任务列表 */
        <Box className="checklist-page__list">
          {/* 已完成的任务 */}
          {items.filter(item => !item.completed).length > 0 && (
            <Box className="checklist-page__pending-section" sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                待完成 ({items.filter(item => !item.completed).length})
              </Typography>
              {items
                .filter(item => !item.completed)
                .map(item => (
                  <ChecklistItem
                    key={item.id}
                    item={item}
                    onComplete={handleCompleteItem}
                    onDelete={handleDeleteItem}
                    onEdit={setEditingItem}
                  />
                ))}
            </Box>
          )}

          {/* 已完成的任务 */}
          {items.filter(item => item.completed).length > 0 && (
            <Box className="checklist-page__completed-section">
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                已完成 ({items.filter(item => item.completed).length})
              </Typography>
              {items
                .filter(item => item.completed)
                .map(item => (
                  <ChecklistItem
                    key={item.id}
                    item={item}
                    onComplete={handleCompleteItem}
                    onDelete={handleDeleteItem}
                    onEdit={setEditingItem}
                  />
                ))}
            </Box>
          )}
        </Box>
      )}

      {/* 新增任务对话框 */}
      <AddTaskModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSubmit={handleAddTask}
        initialDate={currentDate}
        existingItems={items}
      />
    </Container>
  )
}
