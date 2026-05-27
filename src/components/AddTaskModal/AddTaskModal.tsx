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
import type { ChecklistItem } from '@/types'
import { getTodayDate } from '@/utils/dateUtils'
import './AddTaskModal.scss'

interface AddTaskModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (item: ChecklistItem) => void
  initialDate?: Date
  existingItems?: ChecklistItem[]
  editingItem?: ChecklistItem | null
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
  inForgetCurve: boolean
  batchAddDays: number
}

const defaultState: FormState = {
  title: '',
  description: '',
  project: '',
  priority: 'medium',
  category: '',
  tags: [],
  tagInput: '',
  inForgetCurve: false,
  batchAddDays: 0
}

export function AddTaskModal({
  open,
  onClose,
  onSubmit,
  initialDate,
  existingItems = [],
  editingItem = null
}: AddTaskModalProps) {
  const [formData, setFormData] = useState<FormState>(defaultState)

  useEffect(() => {
    if (!open) return

    if (editingItem) {
      setFormData({
        title: editingItem.title,
        description: editingItem.description || '',
        project: editingItem.project || '',
        priority: editingItem.priority,
        category: editingItem.category || '',
        tags: editingItem.tags || [],
        tagInput: '',
        inForgetCurve: editingItem.inForgetCurve,
        batchAddDays: 0
      })
      return
    }

    setFormData(defaultState)
  }, [editingItem, open])

  const handleClose = () => {
    setFormData(defaultState)
    onClose()
  }

  const getUniqueTitleForDate = (baseTitle: string, targetDate: Date) => {
    const dateText = targetDate.toDateString()
    const tasksOnDate = existingItems.filter((item) => {
      if (editingItem && item.id === editingItem.id) return false
      return new Date(item.date).toDateString() === dateText
    })

    let finalTitle = baseTitle
    let counter = 1

    while (tasksOnDate.some((item) => item.title === finalTitle)) {
      finalTitle = `${baseTitle} (${counter})`
      counter += 1
    }

    return finalTitle
  }

  const buildItem = (title: string, date: Date): ChecklistItem => ({
    id: editingItem?.id || uuidv4(),
    title: getUniqueTitleForDate(title, date),
    description: formData.description.trim() || undefined,
    project: formData.project.trim() || undefined,
    date,
    completed: editingItem?.completed || false,
    inForgetCurve: formData.inForgetCurve,
    images: editingItem?.images || [],
    priority: formData.priority,
    category: formData.category.trim() || undefined,
    tags: formData.tags.length > 0 ? formData.tags : undefined,
    createdAt: editingItem?.createdAt || new Date(),
    completedAt: editingItem?.completedAt,
    completedDurationMs: editingItem?.completedDurationMs,
    forgetCurveData: editingItem?.forgetCurveData
  })

  const handleSubmit = () => {
    const baseTitle = formData.title.trim() || 'Untitled task'
    const baseDate = editingItem?.date || initialDate || getTodayDate()
    const repeatDays = editingItem ? 0 : Math.max(0, formData.batchAddDays)

    onSubmit(buildItem(baseTitle, baseDate))

    for (let i = 1; i <= repeatDays; i++) {
      const nextDate = new Date(baseDate)
      nextDate.setDate(nextDate.getDate() + i)
      onSubmit({
        ...buildItem(baseTitle, nextDate),
        id: uuidv4()
      })
    }

    handleClose()
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

  const titleText = editingItem ? 'Edit Task / 编辑任务' : 'Add Task / 新增任务'
  const submitText = editingItem ? 'Save / 保存' : 'Create / 创建'

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth className="add-modal">
      <DialogTitle sx={{ fontWeight: 700, fontSize: '24px', pb: 1 }}>{titleText}</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Stack spacing={3}>
          <TextField
            autoFocus
            fullWidth
            label="Title / 标题"
            placeholder="What needs to be done? / 今天要做什么？"
            value={formData.title}
            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              fullWidth
              label="Project / 项目"
              placeholder="Project name / 项目名称"
              value={formData.project}
              onChange={(e) => setFormData((prev) => ({ ...prev, project: e.target.value }))}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
            <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}>
              <InputLabel>Priority / 优先级</InputLabel>
              <Select
                value={formData.priority}
                label="Priority / 优先级"
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, priority: e.target.value as Priority }))
                }
              >
                <MenuItem value="low">Low / 低</MenuItem>
                <MenuItem value="medium">Medium / 中</MenuItem>
                <MenuItem value="high">High / 高</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description / 描述"
            placeholder="Add more details / 补充一些备注"
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
          />

          <TextField
            fullWidth
            label="Category / 分类"
            placeholder="Work, Study, Life... / 工作、学习、生活..."
            value={formData.category}
            onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
          />

          <Box sx={{ p: 2, borderRadius: '16px', bgcolor: '#f4f3f8', border: '1px solid #e3e2e7' }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.inForgetCurve}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, inForgetCurve: e.target.checked }))
                  }
                />
              }
              label={
                <Box>
                  <Typography sx={{ fontWeight: 600, fontSize: '15px' }}>
                    Add to review cycle / 加入复习周期
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Enable follow-up reminders / 完成后继续提醒复习
                  </Typography>
                </Box>
              }
            />
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
              Tags / 标签
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2 }}>
              <TextField
                size="small"
                label="Add tag / 添加标签"
                placeholder="Press Enter / 回车添加"
                value={formData.tagInput}
                onChange={(e) => setFormData((prev) => ({ ...prev, tagInput: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag()
                  }
                }}
                sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />
              <Button variant="outlined" onClick={addTag} sx={{ borderRadius: '10px' }}>
                Add / 添加
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

          {!editingItem && (
            <TextField
              type="number"
              label="Repeat for future days / 复制到未来天数"
              placeholder="0"
              value={formData.batchAddDays}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  batchAddDays: Math.max(0, Number(e.target.value) || 0)
                }))
              }
              helperText="Set 3 to also create this task for the next 3 days / 填 3 会额外创建未来 3 天的任务"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 4, pt: 2, gap: 1 }}>
        <Button onClick={handleClose} sx={{ borderRadius: '10px', px: 3 }}>
          Cancel / 取消
        </Button>
        <Button onClick={handleSubmit} variant="contained" sx={{ borderRadius: '10px', px: 4, bgcolor: '#0058bc' }}>
          {submitText}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
