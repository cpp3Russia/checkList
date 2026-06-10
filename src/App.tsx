import { useMemo, useState } from 'react'
import {
  Alert,
  Breadcrumbs,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  ThemeProvider,
  Typography,
  createTheme
} from '@mui/material'
import { Add as AddIcon, Delete as DeleteIcon, Refresh as RefreshIcon } from '@mui/icons-material'
import { ActiveTaskSidebar } from '@/components/ActiveTaskSidebar/ActiveTaskSidebar'
import { AddTaskModal } from '@/components/AddTaskModal'
import { ChecklistItem } from '@/components/ChecklistItem'
import { ClearTasksModal, type ClearConfig } from '@/components/ClearTasksModal/ClearTasksModal'
import { DateSelector } from '@/components/DateSelector/DateSelector'
import { useChecklistData } from '@/hooks/useChecklistData'
import { StatisticsPage } from '@/pages/StatisticsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { storageService } from '@/services/storageService'
import { useChecklistStore } from '@/store/checklistStore'
import { useTimerStore } from '@/store/timerStore'
import type { ChecklistItem as ChecklistItemType, TaskScope } from '@/types'
import { formatDuration, getTaskSummaryDateLabel, getTodayDate, isSameDay } from '@/utils/dateUtils'
import { calculateNextReviewDate } from '@/utils/forgetCurveUtils'
import './App.scss'

type AppView = 'tasks' | 'statistics' | 'settings'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0058bc' },
    secondary: { main: '#4c4aca' },
    error: { main: '#ba1a1a' },
    background: {
      default: '#f5f5f7',
      paper: '#ffffff'
    },
    text: {
      primary: '#1a1b1f',
      secondary: '#414755'
    }
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: {
      fontSize: '48px',
      fontWeight: 700,
      letterSpacing: '-0.022em'
    },
    h4: {
      fontSize: '34px',
      fontWeight: 700,
      letterSpacing: '-0.022em'
    },
    h5: {
      fontSize: '22px',
      fontWeight: 600,
      letterSpacing: '-0.015em'
    },
    body1: {
      fontSize: '17px',
      letterSpacing: '-0.015em'
    },
    body2: {
      fontSize: '15px',
      letterSpacing: '-0.01em'
    },
    caption: {
      fontSize: '11px',
      letterSpacing: '0.01em'
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none'
          }
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          border: '1px solid #c1c6d7'
        }
      }
    }
  }
})

const navItems: Array<{ key: AppView; label: string; subtitle: string }> = [
  { key: 'tasks', label: '任务清单', subtitle: '今日任务与专注' },
  { key: 'statistics', label: '数据统计', subtitle: '趋势与完成情况' }
]

const sortByOrder = (list: ChecklistItemType[]) =>
  [...list].sort((a, b) => {
    const aOrder = a.sortOrder ?? Number.MAX_SAFE_INTEGER
    const bOrder = b.sortOrder ?? Number.MAX_SAFE_INTEGER

    if (aOrder !== bOrder) {
      return aOrder - bOrder
    }

    return a.createdAt.getTime() - b.createdAt.getTime()
  })

const getTaskScope = (item: ChecklistItemType) => item.taskScope ?? 'daily'

const resolveEditableTask = (item: ChecklistItemType) =>
  useChecklistStore.getState().items.find((entry) => entry.id === (item.reviewSourceItemId ?? item.id)) ?? item

function App() {
  const [currentView, setCurrentView] = useState<AppView>('tasks')
  const [currentDate, setCurrentDate] = useState(getTodayDate())
  const [openAddTaskModal, setOpenAddTaskModal] = useState(false)
  const [openClearTasksModal, setOpenClearTasksModal] = useState(false)
  const [defaultTaskScope, setDefaultTaskScope] = useState<TaskScope>('daily')
  const [editingItem, setEditingItem] = useState<ChecklistItemType | null>(null)
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null)
  const [completionDialog, setCompletionDialog] = useState<{ open: boolean; title: string; elapsedMs: number }>({
    open: false,
    title: '',
    elapsedMs: 0
  })

  const { items, loading: itemsLoading, error, saveItem, saveItems, removeItem } = useChecklistData(currentDate)
  const storedItems = useChecklistStore((state) => state.items)
  const activeTaskId = useTimerStore((state) => state.activeTaskId)

  const summaryLabel = getTaskSummaryDateLabel(currentDate)
  const totalCount = items.length
  const completedCount = items.filter((item) => item.completed).length
  const pendingCount = totalCount - completedCount

  const completionRate = useMemo(() => {
    if (totalCount === 0) {
      return 0
    }

    return Math.round((completedCount / totalCount) * 100)
  }, [completedCount, totalCount])

  const masterItems = useMemo(
    () => sortByOrder(storedItems.filter((item) => getTaskScope(item) === 'master')),
    [storedItems]
  )
  const masterTotalCount = masterItems.length
  const masterPendingItems = useMemo(() => masterItems.filter((item) => !item.completed), [masterItems])
  const masterCompletedItems = useMemo(() => masterItems.filter((item) => item.completed), [masterItems])

  const pendingItems = useMemo(() => {
    const list = sortByOrder(items.filter((item) => !item.completed))

    if (!activeTaskId) {
      return list
    }

    return [...list].sort((a, b) => {
      if (a.id === activeTaskId) return -1
      if (b.id === activeTaskId) return 1
      return 0
    })
  }, [activeTaskId, items])

  const completedItems = useMemo(
    () =>
      sortByOrder(items.filter((item) => item.completed)).sort((a, b) => {
        const aTime = a.completedAt ? a.completedAt.getTime() : 0
        const bTime = b.completedAt ? b.completedAt.getTime() : 0
        return bTime - aTime
      }),
    [items]
  )

  const pendingSourceItems = useMemo(() => {
    const seen = new Set<string>()

    return pendingItems
      .map((item) => storedItems.find((entry) => entry.id === (item.reviewSourceItemId ?? item.id)))
      .filter((item): item is ChecklistItemType => Boolean(item))
      .filter((item) => getTaskScope(item) === 'daily')
      .filter((item) => isSameDay(new Date(item.date), currentDate) && !item.completed)
      .filter((item) => {
        if (seen.has(item.id)) {
          return false
        }

        seen.add(item.id)
        return true
      })
  }, [currentDate, pendingItems, storedItems])

  const hasAnyTasks = items.length > 0 || masterItems.length > 0

  const resolveTaskById = (taskId: string) =>
    items.find((item) => item.id === taskId) ?? storedItems.find((item) => item.id === taskId)

  const resolvePersistedTaskId = (taskId: string) => {
    const task = resolveTaskById(taskId)
    return task?.reviewSourceItemId ?? task?.id ?? null
  }

  const persistPendingOrder = async (orderedPendingItems: ChecklistItemType[]) => {
    const nextPendingItems = orderedPendingItems
      .map((item) => storedItems.find((entry) => entry.id === (item.reviewSourceItemId ?? item.id)))
      .filter((item): item is ChecklistItemType => Boolean(item))
      .filter((item, index, list) => list.findIndex((entry) => entry.id === item.id) === index)
      .filter((item) => getTaskScope(item) === 'daily')
      .filter((item) => isSameDay(new Date(item.date), currentDate) && !item.completed)
      .map((item, index) => ({
        ...item,
        sortOrder: index
      }))

    await saveItems(nextPendingItems)
  }

  const openCreateTaskModal = (taskScope: TaskScope = 'daily') => {
    setEditingItem(null)
    setDefaultTaskScope(taskScope)
    setOpenAddTaskModal(true)
  }

  const moveMasterTaskToDaily = async (sourceItemId: string, targetItemId?: string | null) => {
    const sourceItem = storedItems.find((item) => item.id === sourceItemId)
    if (!sourceItem || getTaskScope(sourceItem) !== 'master') {
      return
    }

    const nextPendingItems = [...pendingSourceItems]
    const targetIndex = targetItemId
      ? nextPendingItems.findIndex((item) => item.id === targetItemId)
      : nextPendingItems.length
    const insertIndex = targetIndex >= 0 ? targetIndex : nextPendingItems.length

    nextPendingItems.splice(insertIndex, 0, {
      ...sourceItem,
      taskScope: 'daily',
      date: new Date(currentDate),
      completed: false,
      completedAt: undefined,
      completedDurationMs: undefined
    })

    await saveItems(
      nextPendingItems.map((item, index) => ({
        ...item,
        sortOrder: index
      }))
    )
  }

  const handleSaveTask = async (item: ChecklistItemType) => {
    try {
      await saveItem(item)
      setOpenAddTaskModal(false)
      setEditingItem(null)
    } catch (err) {
      console.error('保存任务失败:', err)
    }
  }

  const handleDeleteItem = async (id: string) => {
    try {
      const targetItem = resolveTaskById(id)
      if (targetItem?.isReviewHistoryEntry) return

      const targetId = targetItem?.reviewSourceItemId ?? targetItem?.id ?? id
      await removeItem(targetId)
    } catch (err) {
      console.error('删除任务失败:', err)
    }
  }

  const handleCompleteItem = async (
    id: string,
    images: string[],
    completed: boolean,
    completedDurationMs?: number
  ) => {
    try {
      const item = resolveTaskById(id)
      if (!item || item.isReviewHistoryEntry) return

      const sourceItemId = item.reviewSourceItemId ?? item.id
      const sourceItem = useChecklistStore.getState().items.find((entry) => entry.id === sourceItemId)
      if (!sourceItem) return

      if (item.isReviewInstance && completed) {
        const currentSchedule = sourceItem.forgetCurveData
        if (!currentSchedule) return

        const completionTime = new Date()
        const nextSchedule = calculateNextReviewDate(currentSchedule.level, completionTime)
        const updatedReviewItem = {
          ...sourceItem,
          reviewHistory: [
            ...(sourceItem.reviewHistory ?? []),
            {
              id: `${sourceItem.id}::history::${completionTime.getTime()}`,
              occurrenceDate: new Date(item.date),
              completedAt: completionTime,
              completedDurationMs
            }
          ],
          forgetCurveData: nextSchedule,
          reviewOccurrenceDate: nextSchedule.nextReviewDate
        }

        await storageService.saveItem(updatedReviewItem)
        useChecklistStore.getState().updateItem(sourceItemId, {
          reviewHistory: updatedReviewItem.reviewHistory,
          forgetCurveData: nextSchedule,
          reviewOccurrenceDate: nextSchedule.nextReviewDate
        })
        return
      }

      const updatedItem = {
        ...sourceItem,
        completed,
        completedAt: completed ? new Date() : undefined,
        completedDurationMs: completed ? completedDurationMs : undefined,
        images
      }

      await storageService.saveItem(updatedItem)
      useChecklistStore.getState().completeItem(sourceItemId, images, completed, completedDurationMs)
    } catch (err) {
      console.error('更新任务完成状态失败:', err)
    }
  }

  const handleClearTasks = async (config: ClearConfig) => {
    try {
      const allItems = await storageService.getAllItems()
      const isDailyTask = (item: ChecklistItemType) => getTaskScope(item) === 'daily'
      let tasksToDelete: ChecklistItemType[] = []

      if (config.type === 'today') {
        const todayText = new Date().toDateString()
        tasksToDelete = allItems.filter(
          (item) => isDailyTask(item) && new Date(item.date).toDateString() === todayText
        )
      } else if (config.type === 'specific' && config.date) {
        const dateText = config.date.toDateString()
        tasksToDelete = allItems.filter(
          (item) => isDailyTask(item) && new Date(item.date).toDateString() === dateText
        )
      } else if (config.type === 'range' && config.startDate && config.endDate) {
        const startDate = new Date(config.startDate)
        startDate.setHours(0, 0, 0, 0)
        const endDate = new Date(config.endDate)
        endDate.setHours(23, 59, 59, 999)

        tasksToDelete = allItems.filter((item) => {
          const itemDate = new Date(item.date)
          return isDailyTask(item) && itemDate >= startDate && itemDate <= endDate
        })
      } else if (config.type === 'name' && config.taskName) {
        tasksToDelete = allItems.filter((item) => isDailyTask(item) && item.title === config.taskName)
      }

      for (const task of tasksToDelete) {
        await removeItem(task.id)
      }

      setOpenClearTasksModal(false)
    } catch (err) {
      console.error('清空任务失败:', err)
    }
  }

  const handleTimerComplete = async ({ taskId, elapsedMs }: { taskId: string; elapsedMs: number }) => {
    const item = resolveTaskById(taskId)
    if (!item) return

    await handleCompleteItem(taskId, item.images, true, elapsedMs)
    setCompletionDialog({
      open: true,
      title: item.title,
      elapsedMs
    })
  }

  const handlePendingTaskDrop = async (targetId: string) => {
    if (!draggingTaskId || draggingTaskId === targetId) {
      setDraggingTaskId(null)
      return
    }

    const draggingTask = resolveTaskById(draggingTaskId)
    const targetPersistedId = resolvePersistedTaskId(targetId)

    if (!draggingTask || !targetPersistedId) {
      setDraggingTaskId(null)
      return
    }

    try {
      if (getTaskScope(draggingTask) === 'master') {
        const sourceItemId = resolvePersistedTaskId(draggingTaskId)
        if (!sourceItemId) return

        await moveMasterTaskToDaily(sourceItemId, targetPersistedId)
        return
      }

      const currentIndex = pendingItems.findIndex((item) => item.id === draggingTaskId)
      const targetIndex = pendingItems.findIndex((item) => item.id === targetId)
      const sourcePersistedId = resolvePersistedTaskId(draggingTaskId)

      if (currentIndex < 0 || targetIndex < 0 || !sourcePersistedId || sourcePersistedId === targetPersistedId) {
        return
      }

      const reordered = [...pendingItems]
      const [movedItem] = reordered.splice(currentIndex, 1)
      reordered.splice(targetIndex, 0, movedItem)

      await persistPendingOrder(reordered)
    } catch (err) {
      console.error('更新任务顺序失败:', err)
    } finally {
      setDraggingTaskId(null)
    }
  }

  const handlePendingListDrop = async () => {
    if (!draggingTaskId) {
      return
    }

    const draggingTask = resolveTaskById(draggingTaskId)
    if (!draggingTask) {
      setDraggingTaskId(null)
      return
    }

    try {
      if (getTaskScope(draggingTask) === 'master') {
        const sourceItemId = resolvePersistedTaskId(draggingTaskId)
        if (!sourceItemId) return

        await moveMasterTaskToDaily(sourceItemId)
        return
      }

      const currentIndex = pendingItems.findIndex((item) => item.id === draggingTaskId)
      if (currentIndex < 0 || currentIndex === pendingItems.length - 1) {
        return
      }

      const reordered = [...pendingItems]
      const [movedItem] = reordered.splice(currentIndex, 1)
      reordered.push(movedItem)

      await persistPendingOrder(reordered)
    } catch (err) {
      console.error('更新任务顺序失败:', err)
    } finally {
      setDraggingTaskId(null)
    }
  }

  const renderDraggableItem = (item: ChecklistItemType, mode: 'daily' | 'master') => (
    <Box
      key={item.id}
      onDragOver={mode === 'daily' ? (event) => event.preventDefault() : undefined}
      onDrop={
        mode === 'daily'
          ? (event) => {
              event.preventDefault()
              event.stopPropagation()
              void handlePendingTaskDrop(item.id)
            }
          : undefined
      }
      className={`task-grid__cell ${draggingTaskId === item.id ? 'is-dragging' : ''} ${
        activeTaskId === item.id ? 'is-active-task' : ''
      } ${mode === 'master' ? 'task-grid__cell--master' : ''}`}
    >
      <ChecklistItem
        item={item}
        onComplete={handleCompleteItem}
        onDelete={handleDeleteItem}
        onEdit={(entry) => {
          const editableTask = resolveEditableTask(entry)
          setEditingItem(editableTask)
          setDefaultTaskScope(getTaskScope(editableTask))
          setOpenAddTaskModal(true)
        }}
        dragging={draggingTaskId === item.id}
        dragHandleProps={{
          draggable: true,
          onDragStart: (event) => {
            event.dataTransfer.effectAllowed = 'move'
            event.dataTransfer.setData('text/plain', item.id)
            setDraggingTaskId(item.id)
          },
          onDragEnd: () => setDraggingTaskId(null)
        }}
      />
    </Box>
  )

  const renderMasterHoverCard = () => (
    <Box className="master-hover-card">
      <Box className="master-hover-card__summary">
        <Box className="master-hover-card__summary-copy">
          <Typography variant="body2" sx={{ color: '#20406e', fontWeight: 700 }}>
            总任务栏 <strong style={{ color: '#0058bc', fontSize: '18px' }}>{masterTotalCount}</strong> 项
          </Typography>
          <Typography variant="caption" sx={{ color: '#61748f', fontSize: 14 }}>
            待安排 {masterPendingItems.length} 项，已完成 {masterCompletedItems.length} 项
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => openCreateTaskModal('master')}
            sx={{ borderRadius: '999px', px: 1.5, fontWeight: 700, minWidth: 'fit-content' ,fontSize: '1.35rem'}}
          >
            新增总任务
          </Button>
          <Chip label={`待安排 ${masterPendingItems.length}`} sx={{ fontSize: '1.35rem', bgcolor: '#ebf5ff', color: '#0e5bd9', fontWeight: 700 }} />
          <Chip label={`已完成 ${masterCompletedItems.length}`} variant="outlined" sx={{ fontSize: '1.35rem',fontWeight: 700 }} />
        </Stack>
      </Box>

      <Box className="master-hover-card__panel">
        <Box className="master-hover-card__panel-head">
          <Box>
            <Typography variant="h6" sx={{ fontSize: 20, fontWeight: 800, color: '#24324a' }}>
              总任务栏
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, color: '#667289' }}>
              长期任务先放这里，需要执行时直接拖到下面的当日任务区。
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => openCreateTaskModal('master')}
            sx={{ borderRadius: '12px', fontSize: 14, flexShrink: 0 }}
          >
            新增总任务
          </Button>
        </Box>

        {masterPendingItems.length > 0 ? (
          <Box className="task-grid task-grid--master" sx={{ mt: 2 }}>
            {masterPendingItems.map((item) => renderDraggableItem(item, 'master'))}
          </Box>
        ) : (
          <Box className="board-section__empty">
            <Typography color="text.secondary">总任务栏还是空的，可以先把长期任务放这里。</Typography>
          </Box>
        )}

        {masterCompletedItems.length > 0 && (
          <Box sx={{ mt: 3.5 }}>
            <Typography
              variant="subtitle2"
              sx={{
                mb: 2,
                color: 'text.secondary',
                fontWeight: 700,
                borderTop: '1px dashed rgba(45, 71, 124, 0.18)',
                pt: 2.5
              }}
            >
              总任务栏已完成（{masterCompletedItems.length}）
            </Typography>
            <Box className="task-grid task-grid--completed">
              {masterCompletedItems.map((item) => (
                <Box key={item.id} className="task-grid__cell task-grid__cell--master">
                  <ChecklistItem
                    item={item}
                    onComplete={handleCompleteItem}
                    onDelete={handleDeleteItem}
                    onEdit={(entry) => {
                      const editableTask = resolveEditableTask(entry)
                      setEditingItem(editableTask)
                      setDefaultTaskScope(getTaskScope(editableTask))
                      setOpenAddTaskModal(true)
                    }}
                  />
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  )

  const renderTaskView = () => (
    <Box className="workspace">
      <Box className="workspace__main">
        <Box className="workspace__header-wrap" sx={{ flexShrink: 0 }}>
          <Box className="header">
            <Box className="top">
              <h1 className="title">任务清单</h1>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => openCreateTaskModal('daily')}
                className="btn-add"
                size="large"
                sx={{ fontSize: 16 }}
              >
                新增任务
              </Button>
            </Box>
            <p className="subtitle">管理当前日期的任务安排和完成进度</p>
          </Box>

          <DateSelector date={currentDate} onDateChange={setCurrentDate} />

          <Box className="workspace__overview-stack">
            {renderMasterHoverCard()}

            <Box
              className="workspace__summary"
              sx={{
                mb: 4,
                p: 3,
                bgcolor: '#eeedf3',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2
              }}
            >
              <Box className="workspace__summary-text">
                <Typography variant="body2" sx={{ color: '#414755', fontWeight: 500 }}>
                  {summaryLabel}任务 <strong style={{ color: '#0058bc', fontSize: '18px' }}>{totalCount}</strong> 项
                </Typography>
                <Typography variant="caption" sx={{ color: '#717786', fontSize: 14 }}>
                  已完成 {completedCount} 项，待完成 {pendingCount} 项
                </Typography>
              </Box>
              <Box className="workspace__summary-progress" sx={{ position: 'relative', display: 'inline-flex' }}>
                <CircularProgress
                  variant="determinate"
                  value={completionRate}
                  size={48}
                  thickness={5}
                  sx={{ color: '#0058bc' }}
                />
                <Box
                  className="workspace__summary-progress-label"
                  sx={{
                    inset: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Typography variant="caption" component="div" color="text.secondary" sx={{ fontWeight: 700, fontSize: '10px' }}>
                    {completionRate}%
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          <Stack direction="row" spacing={2} sx={{ mb: 4, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => setCurrentDate(getTodayDate())}
              sx={{ borderRadius: '10px', borderColor: '#c1c6d7', fontSize: 14 }}
            >
              回到今天
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setOpenClearTasksModal(true)}
              sx={{ borderRadius: '10px', fontSize: 14 }}
            >
              清空任务
            </Button>
          </Stack>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
        </Box>

        <Box className="body">
          {itemsLoading ? (
            <Box className="body__loading" sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : !hasAnyTasks ? (
            <Box className="body__empty" sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                还没有任务，点击“新增任务”开始记录吧。
              </Typography>
            </Box>
          ) : (
            <Box className="body__list">
              <Box className="board-section board-section--daily">
                <Box className="board-section__header">
                  <Box>
                    <Typography variant="h6" sx={{ fontSize: 22, fontWeight: 800, color: '#24324a' }}>
                      当日任务
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, color: '#667289' }}>
                      这里会统计今天的进度。总任务栏里的任务拖到这里后，就会进入今日安排。
                    </Typography>
                  </Box>
                  <Chip label={`今日待完成 ${pendingItems.length}`} sx={{ fontSize: '1.35rem', bgcolor: '#edf2ff', color: '#314c9d', fontWeight: 700 }} />
                </Box>

                <Box
                  className={`daily-dropzone ${draggingTaskId ? 'is-droppable' : ''}`}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault()
                    void handlePendingListDrop()
                  }}
                >
                  {pendingItems.length > 0 ? (
                    <Box className="task-grid" sx={{ mt: 2 }}>
                      {pendingItems.map((item) => renderDraggableItem(item, 'daily'))}
                    </Box>
                  ) : (
                    <Box className="daily-dropzone__empty">
                      <Typography sx={{ fontWeight: 700, color: '#24324a' }}>今天还没有待完成任务</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        可以新增当日任务，或者把上面的总任务拖到这里。
                      </Typography>
                    </Box>
                  )}
                </Box>

                {completedItems.length > 0 && (
                  <Box className="body__completed-section" sx={{ mt: 6 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        mb: 2,
                        color: 'text.secondary',
                        fontWeight: 'bold',
                        borderTop: '1px dashed rgba(0,0,0,0.1)',
                        pt: 3
                      }}
                    >
                      已完成任务（{completedItems.length}）
                    </Typography>
                    <Box className="task-grid task-grid--completed">
                      {completedItems.map((item) => (
                        <Box key={item.id} className="task-grid__cell">
                          <ChecklistItem
                            item={item}
                            onComplete={handleCompleteItem}
                            onDelete={handleDeleteItem}
                            onEdit={(entry) => {
                              const editableTask = resolveEditableTask(entry)
                              setEditingItem(editableTask)
                              setDefaultTaskScope(getTaskScope(editableTask))
                              setOpenAddTaskModal(true)
                            }}
                          />
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      <Box className="workspace__side">
        <ActiveTaskSidebar statsItems={items} onTimerComplete={handleTimerComplete} />
      </Box>
    </Box>
  )

  const renderView = () => {
    if (currentView === 'statistics') {
      return <StatisticsPage onBack={() => setCurrentView('tasks')} />
    }

    if (currentView === 'settings') {
      return <SettingsPage onBack={() => setCurrentView('tasks')} />
    }

    return renderTaskView()
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box className="app">
        <Container maxWidth="xl" className="main">
          <Box className="shell">
            <Box className="shell__nav" sx={{ fontSize: '1.7rem', width: '100%', py: 1, borderRadius: '8px' }}>
              {navItems.map((item) => (
                <Button
                  key={item.key}
                  onMouseEnter={() => setCurrentView(item.key)}
                  variant={currentView === item.key ? 'contained' : 'text'}
                  className={`nav-pill ${currentView === item.key ? 'is-active' : ''}`}
                  sx={{ fontSize: '1.275rem' }}
                >
                  <span>{item.label}</span>
                  <small>{item.subtitle}</small>
                </Button>
              ))}
            </Box>

            <Box className="shell__content">
              {currentView !== 'tasks' && (
                <Breadcrumbs sx={{ mb: 2, px: 1, width: '100%', py: 1, borderRadius: '8px' }}>
                  <Button size="small" onClick={() => setCurrentView('tasks')} sx={{ fontSize: 19 }}>
                    任务清单
                  </Button>
                  <Typography color="text.primary">{currentView === 'statistics' ? '数据统计' : '偏好设置'}</Typography>
                </Breadcrumbs>
              )}
              {renderView()}
            </Box>
          </Box>
        </Container>

        <AddTaskModal
          open={openAddTaskModal}
          onClose={() => {
            setOpenAddTaskModal(false)
            setEditingItem(null)
          }}
          onSubmit={handleSaveTask}
          initialDate={currentDate}
          existingItems={storedItems}
          editingItem={editingItem}
          defaultTaskScope={defaultTaskScope}
        />

        <ClearTasksModal
          open={openClearTasksModal}
          onClose={() => setOpenClearTasksModal(false)}
          onConfirm={handleClearTasks}
        />

        <Dialog
          open={completionDialog.open}
          onClose={() => setCompletionDialog((prev) => ({ ...prev, open: false }))}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>任务已完成</DialogTitle>
          <DialogContent>
            <Typography sx={{ mb: 1.5, fontWeight: 700 }}>{completionDialog.title}</Typography>
            <Typography color="text.secondary">用时：{formatDuration(completionDialog.elapsedMs)}</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCompletionDialog((prev) => ({ ...prev, open: false }))}>确定</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  )
}

export default App
