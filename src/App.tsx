import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
  ThemeProvider,
  Typography,
  createTheme
} from '@mui/material'
import { Add as AddIcon, Delete as DeleteIcon, Refresh as RefreshIcon } from '@mui/icons-material'
import type { ChecklistItem as ChecklistItemType } from '@/types'
import { ActiveTaskSidebar } from '@/components/ActiveTaskSidebar/ActiveTaskSidebar'
import { AddTaskModal } from '@/components/AddTaskModal'
import { ChecklistItem } from '@/components/ChecklistItem'
import { ClearTasksModal, type ClearConfig } from '@/components/ClearTasksModal/ClearTasksModal'
import { DateSelector } from '@/components/DateSelector/DateSelector'
import { useChecklistData } from '@/hooks/useChecklistData'
import { storageService } from '@/services/storageService'
import { useChecklistStore } from '@/store/checklistStore'
import { useTimerStore } from '@/store/timerStore'
import { formatDuration, getTodayDate } from '@/utils/dateUtils'
import './App.scss'

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

function App() {
  const [currentDate, setCurrentDate] = useState(getTodayDate())
  const [openAddTaskModal, setOpenAddTaskModal] = useState(false)
  const [openClearTasksModal, setOpenClearTasksModal] = useState(false)
  const [editingItem, setEditingItem] = useState<ChecklistItemType | null>(null)
  const [completionDialog, setCompletionDialog] = useState<{ open: boolean; title: string; elapsedMs: number }>({
    open: false,
    title: '',
    elapsedMs: 0
  })

  const { items, loading: itemsLoading, error, addItem, removeItem } = useChecklistData(currentDate)
  const activeTaskId = useTimerStore((state) => state.activeTaskId)
  const completionRate = useMemo(() => {
    const totalCount = items.length
    const completedCount = items.filter((item) => item.completed).length
    return totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  }, [items])

  const handleSaveTask = async (item: ChecklistItemType) => {
    try {
      await addItem(item)
      setOpenAddTaskModal(false)
      setEditingItem(null)
    } catch (err) {
      console.error('Failed to save task:', err)
    }
  }

  const handleDeleteItem = async (id: string) => {
    try {
      await removeItem(id)
    } catch (err) {
      console.error('Failed to delete task:', err)
    }
  }

  const handleCompleteItem = async (
    id: string,
    images: string[],
    completed: boolean,
    completedDurationMs?: number
  ) => {
    try {
      const item = items.find((entry) => entry.id === id)
      if (!item) return

      const updatedItem = {
        ...item,
        completed,
        completedAt: completed ? new Date() : undefined,
        completedDurationMs: completed ? completedDurationMs : undefined,
        images
      }

      await storageService.saveItem(updatedItem)
      useChecklistStore.getState().completeItem(id, images, completed, completedDurationMs)
    } catch (err) {
      console.error('Failed to update task completion:', err)
    }
  }

  const handleRefresh = () => {
    setCurrentDate(getTodayDate())
  }

  const handleClearTasks = async (config: ClearConfig) => {
    try {
      let tasksToDelete: ChecklistItemType[] = []

      if (config.type === 'today') {
        const todayText = new Date().toDateString()
        tasksToDelete = items.filter((item) => new Date(item.date).toDateString() === todayText)
      } else if (config.type === 'specific' && config.date) {
        const dateText = config.date.toDateString()
        tasksToDelete = items.filter((item) => new Date(item.date).toDateString() === dateText)
      } else if (config.type === 'range' && config.startDate && config.endDate) {
        tasksToDelete = items.filter((item) => {
          const itemDate = new Date(item.date)
          return itemDate >= config.startDate! && itemDate <= config.endDate!
        })
      } else if (config.type === 'name' && config.taskName) {
        tasksToDelete = items.filter((item) => item.title === config.taskName)
      }

      for (const task of tasksToDelete) {
        await removeItem(task.id)
        useChecklistStore.getState().removeItem(task.id)
      }

      setOpenClearTasksModal(false)
    } catch (err) {
      console.error('Failed to clear tasks:', err)
    }
  }

  const handleTimerComplete = async ({ taskId, elapsedMs }: { taskId: string; elapsedMs: number }) => {
    const item = items.find((entry) => entry.id === taskId)
    if (!item) return

    await handleCompleteItem(taskId, item.images, true, elapsedMs)
    setCompletionDialog({
      open: true,
      title: item.title,
      elapsedMs
    })
  }

  const totalCount = items.length
  const completedCount = items.filter((item) => item.completed).length
  const pendingCount = totalCount - completedCount
  const pendingItems = useMemo(() => {
    const list = items.filter((item) => !item.completed)
    return [...list].sort((a, b) => {
      if (a.id === activeTaskId) return -1
      if (b.id === activeTaskId) return 1
      return a.createdAt.getTime() - b.createdAt.getTime()
    })
  }, [activeTaskId, items])
  const completedItems = useMemo(
    () =>
      [...items.filter((item) => item.completed)].sort((a, b) => {
        const aTime = a.completedAt ? a.completedAt.getTime() : 0
        const bTime = b.completedAt ? b.completedAt.getTime() : 0
        return bTime - aTime
      }),
    [items]
  )
  const sidebarRefreshKey = useMemo(
    () =>
      items
        .map((item) => `${item.id}:${item.completed ? 1 : 0}:${item.completedAt?.getTime() ?? 0}`)
        .join('|'),
    [items]
  )

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        className="app"
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#f5f5f7'
        }}
      >
        <Container
          maxWidth="lg"
          className="main"
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            py: 4,
            minHeight: 0
          }}
        >
          <Grid container spacing={4} sx={{ flex: 1 }}>
            <Grid item xs={12} md={8} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Box sx={{ flexShrink: 0 }}>
                <Box className="header">
                  <Box className="top">
                    <h1 className="title">Checklist</h1>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        setEditingItem(null)
                        setOpenAddTaskModal(true)
                      }}
                      className="btn-add"
                      size="large"
                    >
                      Add Task / 新增任务
                    </Button>
                  </Box>
                  <p className="subtitle">Task management / 任务管理</p>
                </Box>

                <DateSelector date={currentDate} onDateChange={setCurrentDate} />

                <Box
                  sx={{
                    mb: 4,
                    p: 3,
                    bgcolor: '#eeedf3',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ color: '#414755', fontWeight: 500 }}>
                      Today / 今天: <strong style={{ color: '#0058bc', fontSize: '18px' }}>{totalCount}</strong> tasks / 项
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#717786' }}>
                      Completed / 已完成 {completedCount}, Pending / 待完成 {pendingCount}
                    </Typography>
                  </Box>
                  <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                    <CircularProgress
                      variant="determinate"
                      value={completionRate}
                      size={48}
                      thickness={5}
                      sx={{ color: '#0058bc' }}
                    />
                    <Box
                      sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: 'absolute',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Typography
                        variant="caption"
                        component="div"
                        color="text.secondary"
                        sx={{ fontWeight: 700, fontSize: '10px' }}
                      >
                        {completionRate}%
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={handleRefresh}
                    sx={{ borderRadius: '10px', borderColor: '#c1c6d7' }}
                  >
                    Refresh / 刷新
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => setOpenClearTasksModal(true)}
                    sx={{ borderRadius: '10px' }}
                  >
                    Clear Tasks / 清空任务
                  </Button>
                </Stack>

                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}
              </Box>

              <Box className="body" sx={{ flex: 1, overflowY: 'auto', pr: 1, pb: 4 }}>
                {itemsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : items.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                      No tasks yet. Use "Add Task" to get started. / 还没有任务，点击上方按钮开始添加。
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    {pendingItems.map((item) => (
                        <ChecklistItem
                          key={item.id}
                          item={item}
                          onComplete={handleCompleteItem}
                          onDelete={handleDeleteItem}
                          onEdit={(entry) => {
                            setEditingItem(entry)
                            setOpenAddTaskModal(true)
                          }}
                        />
                      ))}

                    {completedItems.length > 0 && (
                      <Box sx={{ mt: 6 }}>
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
                          Completed / 已完成 ({completedItems.length})
                        </Typography>
                        <Stack spacing={1.5}>
                          {completedItems.map((item) => (
                              <ChecklistItem
                                key={item.id}
                                item={item}
                                onComplete={handleCompleteItem}
                                onDelete={handleDeleteItem}
                                onEdit={(entry) => {
                                  setEditingItem(entry)
                                  setOpenAddTaskModal(true)
                                }}
                              />
                            ))}
                        </Stack>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{ pt: { xs: 0, md: 5 } }}>
                <ActiveTaskSidebar onTimerComplete={handleTimerComplete} refreshKey={sidebarRefreshKey} />
              </Box>
            </Grid>
          </Grid>
        </Container>

        <AddTaskModal
          open={openAddTaskModal}
          onClose={() => {
            setOpenAddTaskModal(false)
            setEditingItem(null)
          }}
          onSubmit={handleSaveTask}
          initialDate={currentDate}
          existingItems={items}
          editingItem={editingItem}
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
          <DialogTitle>Task Completed / 任务完成</DialogTitle>
          <DialogContent>
            <Typography sx={{ mb: 1.5, fontWeight: 700 }}>{completionDialog.title}</Typography>
            <Typography color="text.secondary">
              Duration / 用时: {formatDuration(completionDialog.elapsedMs)}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCompletionDialog((prev) => ({ ...prev, open: false }))}>
              OK / 确定
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  )
}

export default App
