import { useEffect, useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Checkbox,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography
} from '@mui/material'
import {
  AccessTime as AccessTimeIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIndicatorIcon,
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
  dragHandleProps?: {
    draggable: boolean
    onDragStart: (event: React.DragEvent<HTMLElement>) => void
    onDragEnd: () => void
  }
  dragging?: boolean
}

const priorityLabelMap: Record<ChecklistItemType['priority'], string> = {
  high: '高优先级',
  medium: '中优先级',
  low: '低优先级'
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
  onEdit,
  dragHandleProps,
  dragging = false
}: ChecklistItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [localCompleted, setLocalCompleted] = useState(item.completed)
  const [isAnimating, setIsAnimating] = useState(false)
  const { reviewInfo } = useForgetCurve(item.reviewSourceItemId ?? item.id)
  const { activeTaskId, isRunning, pauseTimer, startTimer } = useTimerStore()

  const isCurrentActive = activeTaskId === item.id
  const isReadOnlyReviewHistory = Boolean(item.isReviewHistoryEntry)
  const shouldShowActions = (isHovered || dragging) && !isReadOnlyReviewHistory
  const descriptionText = item.description?.trim()

  useEffect(() => {
    setLocalCompleted(item.completed)
  }, [item.completed])

  const handleComplete = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation()
    const completed = event.target.checked
    setLocalCompleted(completed)

    if (completed) {
      setIsAnimating(true)
      window.setTimeout(() => setIsAnimating(false), 500)
    }

    onComplete(item.id, item.images, completed, item.completedDurationMs)
  }

  const handleToggleTimer = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()

    if (isCurrentActive && isRunning) {
      pauseTimer()
      return
    }

    startTimer(item.id)
  }

  const reviewChipLabel = item.isReviewHistoryEntry ? '复习记录' : item.isReviewInstance ? '复习任务' : '复习计划'

  return (
    <Card
      className={`item ${localCompleted ? 'done' : ''} ${isAnimating ? 'pop' : ''} ${dragging ? 'dragging' : ''} ${
        isCurrentActive ? 'is-current-active' : ''
      } ${isCurrentActive && !isRunning ? 'is-current-paused' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
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
        <Box className="checklist-item__layout" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
          {dragHandleProps ? (
            <Box
              className="checklist-item__drag-handle"
              role="button"
              aria-label="拖拽排序"
              title="拖拽排序"
              draggable={dragHandleProps.draggable}
              onDragStart={dragHandleProps.onDragStart}
              onDragEnd={dragHandleProps.onDragEnd}
            >
              <DragIndicatorIcon fontSize="small" />
            </Box>
          ) : null}

          <Checkbox
            checked={localCompleted}
            onChange={handleComplete}
            disabled={isReadOnlyReviewHistory}
            sx={{ mt: 0.25 }}
          />

          <Box className="checklist-item__content" sx={{ flex: 1, minWidth: 0 }}>
            <Box
              className="checklist-item__title-row"
              sx={{ mb: 0.75, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}
            >
              {descriptionText ? (
                <Tooltip
                  title={
                    <Box sx={{ maxWidth: 280 }}>
                      <Typography
                        sx={{
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          color: 'rgba(255, 255, 255, 0.72)',
                          mb: 0.75
                        }}
                      >
                        任务说明
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 13,
                          lineHeight: 1.65,
                          color: '#fff',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word'
                        }}
                      >
                        {descriptionText}
                      </Typography>
                    </Box>
                  }
                  arrow
                  placement="top-start"
                  enterDelay={180}
                  slotProps={{
                    tooltip: {
                      sx: {
                        bgcolor: 'rgba(24, 31, 43, 0.96)',
                        borderRadius: '14px',
                        px: 1.5,
                        py: 1.25,
                        boxShadow: '0 16px 34px rgba(17, 24, 39, 0.28)'
                      }
                    },
                    arrow: {
                      sx: {
                        color: 'rgba(24, 31, 43, 0.96)'
                      }
                    }
                  }}
                >
                  <Box className="checklist-item__title-wrap">
                    <Typography
                      className="checklist-item__title has-description"
                      sx={{
                        textDecoration: localCompleted ? 'line-through' : 'none',
                        color: localCompleted ? 'text.secondary' : 'text.primary',
                        fontSize: 16,
                        fontWeight: 700,
                        lineHeight: 1.45,
                        minWidth: 0,
                        flex: 1
                      }}
                    >
                      {item.title}
                    </Typography>
                  </Box>
                </Tooltip>
              ) : (
                <Typography
                  className="checklist-item__title"
                  sx={{
                    textDecoration: localCompleted ? 'line-through' : 'none',
                    color: localCompleted ? 'text.secondary' : 'text.primary',
                    fontSize: 16,
                    fontWeight: 700,
                    lineHeight: 1.45,
                    minWidth: 0,
                    flex: 1
                  }}
                >
                  {item.title}
                </Typography>
              )}

              {isCurrentActive ? (
                <Chip
                  icon={<AccessTimeIcon />}
                  label={isRunning ? '进行中' : '已暂停'}
                  size="small"
                  className={`checklist-item__active-chip ${isRunning ? 'is-running' : 'is-paused'}`}
                />
              ) : null}
            </Box>

            <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap', rowGap: 1 }}>
              {item.project && <Chip label={item.project} size="small" color="secondary" />}
              <Chip
                label={priorityLabelMap[item.priority]}
                size="small"
                color={priorityColorMap[item.priority]}
                variant="outlined"
              />
              {item.inForgetCurve ? <Chip label={reviewChipLabel} size="small" className="checklist-item__review-chip" /> : null}
              {item.category && <Chip label={item.category} size="small" />}
              {item.tags?.map((tag) => (
                <Chip key={tag} label={tag} size="small" variant="outlined" />
              ))}
            </Stack>

            <Box
              className="checklist-item__meta"
              sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}
            >
              <Typography variant="caption" color="text.secondary">
                {getRelativeDateText(item.date)} / {formatDate(item.date, 'YYYY-MM-DD')}
              </Typography>

              {item.completedDurationMs ? (
                <Typography variant="caption" color="text.secondary">
                  用时：{formatDuration(item.completedDurationMs)}
                </Typography>
              ) : null}

              {item.completedAt ? (
                <Typography variant="caption" color="text.secondary">
                  完成于：{formatDate(item.completedAt, 'YYYY-MM-DD HH:mm:ss')}
                </Typography>
              ) : null}

              {item.inForgetCurve && reviewInfo && !item.isReviewHistoryEntry ? (
                <Box
                  className="checklist-item__forget-curve"
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
                  <Typography variant="caption">
                    {item.isReviewInstance ? `本次复习 · ${reviewInfo.infoText}` : reviewInfo.infoText}
                  </Typography>
                </Box>
              ) : null}

              {item.images.length > 0 ? (
                <Box className="checklist-item__images" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <PhotoLibraryIcon sx={{ fontSize: 14 }} />
                  <Typography variant="caption">{item.images.length} 张图片</Typography>
                </Box>
              ) : null}
            </Box>
          </Box>

          <Box className={`checklist-item__actions ${shouldShowActions ? 'is-visible' : ''}`}>
            {localCompleted && !isReadOnlyReviewHistory ? (
              <>
                <IconButton
                  size="small"
                  color="success"
                  onClick={(event) => {
                    event.stopPropagation()
                    onComplete(item.id, item.images, false)
                  }}
                  title="恢复任务"
                >
                  <RestartIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  onClick={(event) => {
                    event.stopPropagation()
                    onDelete(item.id)
                  }}
                  title="删除任务"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </>
            ) : !localCompleted ? (
              <>
                <IconButton
                  size="small"
                  color={isCurrentActive && isRunning ? 'primary' : 'default'}
                  onClick={handleToggleTimer}
                  title={isCurrentActive && isRunning ? '暂停任务' : '开始任务'}
                >
                  {isCurrentActive && isRunning ? <PauseIcon fontSize="small" /> : <PlayIcon fontSize="small" />}
                </IconButton>
                <IconButton
                  size="small"
                  onClick={(event) => {
                    event.stopPropagation()
                    onEdit(item)
                  }}
                  title="编辑任务"
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  onClick={(event) => {
                    event.stopPropagation()
                    onDelete(item.id)
                  }}
                  title="删除任务"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </>
            ) : null}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}
