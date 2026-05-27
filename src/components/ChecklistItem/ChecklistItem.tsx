import { useEffect, useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Checkbox,
  Chip,
  IconButton,
  Stack,
  Typography
} from '@mui/material'
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Pause as PauseIcon,
  PhotoLibrary as PhotoLibraryIcon,
  PlayArrow as PlayIcon,
  Refresh as RefreshIcon,
  RestartAlt as RestartIcon
} from '@mui/icons-material'
import type { ChecklistItem as ChecklistItemType, ForgetCurveSchedule } from '@/types'
import { useForgetCurve } from '@/hooks/useForgetCurve'
import { useTimerStore } from '@/store/timerStore'
import { formatDate, formatDuration, getRelativeDateText } from '@/utils/dateUtils'
import './ChecklistItem.scss'

interface ChecklistItemProps {
  item: ChecklistItemType
  onComplete: (id: string, images: string[], completed: boolean, completedDurationMs?: number) => void
  onDelete: (id: string) => void
  onEdit: (item: ChecklistItemType) => void
  forgetCurveInfo?: ForgetCurveSchedule
}

const priorityLabelMap: Record<ChecklistItemType['priority'], string> = {
  high: 'High / 高优先级',
  medium: 'Medium / 中优先级',
  low: 'Low / 低优先级'
}

const priorityColorMap: Record<ChecklistItemType['priority'], 'error' | 'warning' | 'success'> = {
  high: 'error',
  medium: 'warning',
  low: 'success'
}

export function ChecklistItem({
  item,
  onComplete,
  onDelete,
  onEdit
}: ChecklistItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [localCompleted, setLocalCompleted] = useState(item.completed)
  const [isAnimating, setIsAnimating] = useState(false)
  const { reviewInfo } = useForgetCurve(item.id)
  const { activeTaskId, isRunning, pauseTimer, startTimer } = useTimerStore()

  const isCurrentActive = activeTaskId === item.id

  useEffect(() => {
    setLocalCompleted(item.completed)
  }, [item.completed])

  const handleComplete = (event: React.ChangeEvent<HTMLInputElement>) => {
    const completed = event.target.checked
    setLocalCompleted(completed)

    if (completed) {
      setIsAnimating(true)
      window.setTimeout(() => setIsAnimating(false), 500)
    }

    onComplete(item.id, item.images, completed, item.completedDurationMs)
  }

  const handleToggleTimer = () => {
    if (isCurrentActive && isRunning) {
      pauseTimer()
      return
    }

    startTimer(item.id)
  }

  return (
    <Card
      className={`item ${localCompleted ? 'done' : ''} ${isAnimating ? 'pop' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        mb: 2,
        transition: 'all 0.3s ease',
        '&.done': {
          opacity: 0.75,
          backgroundColor: 'rgba(76, 175, 80, 0.1)'
        },
        '&:hover': {
          boxShadow: 3,
          transform: 'translateY(-2px)'
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Checkbox checked={localCompleted} onChange={handleComplete} sx={{ mt: 0.5 }} />

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h6"
              sx={{
                mb: 0.5,
                textDecoration: localCompleted ? 'line-through' : 'none',
                color: localCompleted ? 'text.secondary' : 'text.primary'
              }}
            >
              {item.title}
            </Typography>

            {item.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {item.description}
              </Typography>
            )}

            <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }}>
              {item.project && <Chip label={item.project} size="small" color="secondary" />}
              <Chip
                label={priorityLabelMap[item.priority]}
                size="small"
                color={priorityColorMap[item.priority]}
                variant="outlined"
              />
              {item.category && <Chip label={item.category} size="small" />}
              {item.tags?.map((tag) => (
                <Chip key={tag} label={tag} size="small" variant="outlined" />
              ))}
            </Stack>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography variant="caption" color="text.secondary">
                {getRelativeDateText(item.date)} / {formatDate(item.date, 'YYYY-MM-DD')}
              </Typography>

              {item.completedDurationMs ? (
                <Typography variant="caption" color="text.secondary">
                  Duration / 用时: {formatDuration(item.completedDurationMs)}
                </Typography>
              ) : null}

              {item.completedAt ? (
                <Typography variant="caption" color="text.secondary">
                  Finished / 完成于: {formatDate(item.completedAt, 'YYYY-MM-DD HH:mm:ss')}
                </Typography>
              ) : null}

              {item.inForgetCurve && reviewInfo && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 1,
                    py: 0.5,
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderRadius: 1
                  }}
                >
                  <RefreshIcon sx={{ fontSize: 14 }} />
                  <Typography variant="caption">{reviewInfo.infoText}</Typography>
                </Box>
              )}

              {item.images.length > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <PhotoLibraryIcon sx={{ fontSize: 14 }} />
                  <Typography variant="caption">{item.images.length} images / 张图片</Typography>
                </Box>
              )}
            </Box>
          </Box>

          {isHovered && (
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {localCompleted ? (
                <>
                  <IconButton
                    size="small"
                    color="success"
                    onClick={() => onComplete(item.id, item.images, false)}
                    title="Restore / 恢复"
                  >
                    <RestartIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => onDelete(item.id)}
                    title="Delete / 删除"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </>
              ) : (
                <>
                  <IconButton
                    size="small"
                    color={isCurrentActive && isRunning ? 'primary' : 'default'}
                    onClick={handleToggleTimer}
                    title={isCurrentActive && isRunning ? 'Pause timer / Pause' : 'Start timer / Start'}
                  >
                    {isCurrentActive && isRunning ? (
                      <PauseIcon fontSize="small" />
                    ) : (
                      <PlayIcon fontSize="small" />
                    )}
                  </IconButton>
                  <IconButton size="small" onClick={() => onEdit(item)} title="Edit / 编辑">
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => onDelete(item.id)}
                    title="Delete / 删除"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </>
              )}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  )
}
