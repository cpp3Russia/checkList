import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import { v4 as uuidv4 } from 'uuid'
import type { ChecklistItem, TaskScope } from '@/types'
import { getTodayDate } from '@/utils/dateUtils'
import { createInitialReviewSchedule } from '@/utils/forgetCurveUtils'
import './AddTaskModal.scss'

interface AddTaskModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (item: ChecklistItem) => void | Promise<void>
  initialDate?: Date
  existingItems?: ChecklistItem[]
  editingItem?: ChecklistItem | null
  defaultTaskScope?: TaskScope
}

type Priority = 'low' | 'medium' | 'high'

interface FormState {
  title: string
  description: string
  project: string
  priority: Priority
  category: string
  tags: string[]
  tagInput: string
  taskScope: TaskScope
  inForgetCurve: boolean
  batchAddDays: number
}

const createDefaultState = (taskScope: TaskScope = 'daily'): FormState => ({
  title: '',
  description: '',
  project: '',
  priority: 'medium',
  category: '',
  tags: [],
  tagInput: '',
  taskScope,
  inForgetCurve: false,
  batchAddDays: 0
})

const isSameDate = (left: Date, right: Date) => new Date(left).toDateString() === new Date(right).toDateString()

export function AddTaskModal({
  open,
  onClose,
  onSubmit,
  initialDate,
  existingItems = [],
  editingItem = null,
  defaultTaskScope = 'daily'
}: AddTaskModalProps) {
  const [formData, setFormData] = useState<FormState>(createDefaultState(defaultTaskScope))
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return

    if (editingItem) {
      const taskScope = editingItem.taskScope ?? 'daily'

      setFormData({
        title: editingItem.title,
        description: editingItem.description || '',
        project: editingItem.project || '',
        priority: editingItem.priority,
        category: editingItem.category || '',
        tags: editingItem.tags || [],
        tagInput: '',
        taskScope,
        inForgetCurve: taskScope === 'daily' ? editingItem.inForgetCurve : false,
        batchAddDays: 0
      })
      return
    }

    setFormData(createDefaultState(defaultTaskScope))
  }, [defaultTaskScope, editingItem, open])

  const handleClose = () => {
    if (submitting) return
    setFormData(createDefaultState(defaultTaskScope))
    onClose()
  }

  const closeAfterSubmit = () => {
    setFormData(createDefaultState(defaultTaskScope))
    onClose()
  }

  const getScopeItems = () =>
    existingItems.filter((item) => (item.taskScope ?? 'daily') === formData.taskScope)

  const getUniqueTitleForDate = (baseTitle: string, targetDate: Date) => {
    const scopeItems = getScopeItems().filter((item) => {
      if (editingItem && item.id === editingItem.id) return false
      if (formData.taskScope === 'master') return true
      return isSameDate(item.date, targetDate)
    })

    let finalTitle = baseTitle
    let counter = 1

    while (scopeItems.some((item) => item.title === finalTitle)) {
      finalTitle = `${baseTitle}（${counter}）`
      counter += 1
    }

    return finalTitle
  }

  const getNextSortOrder = (targetDate: Date, offset = 0) => {
    const scopeItems = getScopeItems().filter((item) => {
      if (formData.taskScope === 'master') return true
      return isSameDate(item.date, targetDate)
    })

    const maxSortOrder = scopeItems.reduce((max, item, index) => {
      const currentOrder = item.sortOrder ?? index
      return Math.max(max, currentOrder)
    }, -1)

    return maxSortOrder + 1 + offset
  }

  const buildItem = (title: string, date: Date, repeatOffset = 0): ChecklistItem => {
    const taskScope = formData.taskScope
    const inForgetCurve = taskScope === 'daily' ? formData.inForgetCurve : false

    return {
      id: editingItem?.id || uuidv4(),
      title: getUniqueTitleForDate(title, date),
      description: formData.description.trim() || undefined,
      project: formData.project.trim() || undefined,
      date,
      sortOrder: editingItem?.sortOrder ?? getNextSortOrder(date, repeatOffset),
      completed: editingItem?.completed || false,
      taskScope,
      inForgetCurve,
      images: editingItem?.images || [],
      priority: formData.priority,
      category: formData.category.trim() || undefined,
      tags: formData.tags.length > 0 ? formData.tags : undefined,
      createdAt: editingItem?.createdAt || new Date(),
      completedAt: editingItem?.completedAt,
      completedDurationMs: editingItem?.completedDurationMs,
      reviewOccurrenceDate: inForgetCurve
        ? editingItem?.reviewOccurrenceDate ??
          editingItem?.forgetCurveData?.nextReviewDate ??
          createInitialReviewSchedule(date).nextReviewDate
        : undefined,
      forgetCurveData: inForgetCurve
        ? editingItem?.forgetCurveData ?? createInitialReviewSchedule(date)
        : undefined
    }
  }

  const handleSubmit = async () => {
    if (submitting) return

    const baseTitle = formData.title.trim() || '未命名任务'
    const baseDate = editingItem?.date || initialDate || getTodayDate()
    const repeatDays = editingItem || formData.taskScope === 'master' ? 0 : Math.max(0, formData.batchAddDays)

    try {
      setSubmitting(true)

      await onSubmit(buildItem(baseTitle, baseDate))

      for (let index = 1; index <= repeatDays; index += 1) {
        const nextDate = new Date(baseDate)
        nextDate.setDate(nextDate.getDate() + index)
        await onSubmit({
          ...buildItem(baseTitle, nextDate, index),
          id: uuidv4()
        })
      }

      closeAfterSubmit()
    } finally {
      setSubmitting(false)
    }
  }

  const addTag = () => {
    const tag = formData.tagInput.trim()
    if (!tag || formData.tags.includes(tag)) return

    setFormData((prev) => ({
      ...prev,
      tags: [...prev.tags, tag],
      tagInput: ''
    }))
  }

  const titleText = editingItem ? '编辑任务' : formData.taskScope === 'master' ? '新增总任务' : '新增任务'
  const submitText = editingItem ? '保存' : '创建'

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth className="add-modal">
      <DialogTitle sx={{ fontWeight: 700, fontSize: '24px', pb: 1 }}>{titleText}</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Stack spacing={3}>
          <TextField
            autoFocus
            fullWidth
            label="任务标题"
            placeholder={formData.taskScope === 'master' ? '想先存入总任务栏的长期任务' : '今天要做什么？'}
            value={formData.title}
            onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
          />

          <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}>
            <InputLabel>任务归属</InputLabel>
            <Select
              value={formData.taskScope}
              label="任务归属"
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  taskScope: event.target.value as TaskScope,
                  inForgetCurve: event.target.value === 'master' ? false : prev.inForgetCurve
                }))
              }
            >
              <MenuItem value="daily">当日任务</MenuItem>
              <MenuItem value="master">总任务栏</MenuItem>
            </Select>
          </FormControl>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              fullWidth
              label="项目"
              placeholder="输入项目名称"
              value={formData.project}
              onChange={(event) => setFormData((prev) => ({ ...prev, project: event.target.value }))}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
            <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}>
              <InputLabel>优先级</InputLabel>
              <Select
                value={formData.priority}
                label="优先级"
                onChange={(event) => setFormData((prev) => ({ ...prev, priority: event.target.value as Priority }))}
              >
                <MenuItem value="low">低</MenuItem>
                <MenuItem value="medium">中</MenuItem>
                <MenuItem value="high">高</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          <TextField
            fullWidth
            multiline
            rows={3}
            label="任务说明"
            placeholder="补充任务细节"
            value={formData.description}
            onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
          />

          <TextField
            fullWidth
            label="分类"
            placeholder="例如：工作、学习、生活"
            value={formData.category}
            onChange={(event) => setFormData((prev) => ({ ...prev, category: event.target.value }))}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
          />

          {formData.taskScope === 'daily' ? (
            <Box
              className="add-modal__forget-curve"
              sx={{ p: 2, borderRadius: '16px', bgcolor: '#f4f3f8', border: '1px solid #e3e2e7' }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.inForgetCurve}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, inForgetCurve: event.target.checked }))
                    }
                  />
                }
                label={
                  <Box className="add-modal__forget-curve-copy">
                    <Typography sx={{ fontWeight: 600, fontSize: '15px' }}>加入复习周期</Typography>
                    <Typography variant="caption" color="text.secondary">
                      完成后继续安排后续提醒
                    </Typography>
                  </Box>
                }
              />
            </Box>
          ) : (
            <Box
              sx={{
                p: 2,
                borderRadius: '16px',
                bgcolor: '#f8f9fc',
                border: '1px dashed #d5dceb'
              }}
            >
              <Typography sx={{ fontWeight: 600, fontSize: '15px', color: '#31405a' }}>总任务栏任务</Typography>
              <Typography variant="caption" color="text.secondary">
                这类任务会常驻在总任务栏，拖入当天后才会进入每日任务区。
              </Typography>
            </Box>
          )}

          <Box className="add-modal__tags">
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
              标签
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2 }}>
              <TextField
                size="small"
                label="新增标签"
                placeholder="按回车添加"
                value={formData.tagInput}
                onChange={(event) => setFormData((prev) => ({ ...prev, tagInput: event.target.value }))}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    addTag()
                  }
                }}
                sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />
              <Button variant="outlined" onClick={addTag} sx={{ borderRadius: '10px', fontSize: 14 }}>
                添加
              </Button>
            </Stack>

            {formData.tags.length > 0 && (
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mb: 2 }}>
                {formData.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() =>
                      setFormData((prev) => ({
                        ...prev,
                        tags: prev.tags.filter((item) => item !== tag)
                      }))
                    }
                    size="small"
                    sx={{ borderRadius: '6px' }}
                  />
                ))}
              </Stack>
            )}
          </Box>

          {!editingItem && formData.taskScope === 'daily' ? (
            <TextField
              type="number"
              label="复制到未来几天"
              placeholder="0"
              value={formData.batchAddDays}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  batchAddDays: Math.max(0, Number(event.target.value) || 0)
                }))
              }
              helperText="例如填 3，会额外创建未来 3 天的同任务。"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 4, pt: 2, gap: 1 }}>
        <Button onClick={handleClose} disabled={submitting} sx={{ borderRadius: '10px', px: 3, fontSize: 14 }}>
          取消
        </Button>
        <Button
          onClick={() => void handleSubmit()}
          variant="contained"
          disabled={submitting}
          sx={{ borderRadius: '10px', px: 4, bgcolor: '#0058bc', fontSize: 14 }}
        >
          {submitText}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
