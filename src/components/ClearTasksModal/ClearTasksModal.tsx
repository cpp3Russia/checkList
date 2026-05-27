import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Radio,
  RadioGroup,
  TextField,
  Typography
} from '@mui/material'
import { formatDate, getTodayDate } from '@/utils/dateUtils'

interface ClearTasksModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (clearConfig: ClearConfig) => void
}

export interface ClearConfig {
  type: 'today' | 'specific' | 'range' | 'name'
  date?: Date
  startDate?: Date
  endDate?: Date
  taskName?: string
}

export function ClearTasksModal({ open, onClose, onConfirm }: ClearTasksModalProps) {
  const today = formatDate(getTodayDate(), 'YYYY-MM-DD')
  const [clearType, setClearType] = useState<ClearConfig['type']>('today')
  const [selectedDate, setSelectedDate] = useState(today)
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [taskName, setTaskName] = useState('')

  const handleClose = () => {
    setClearType('today')
    setSelectedDate(today)
    setStartDate(today)
    setEndDate(today)
    setTaskName('')
    onClose()
  }

  const handleConfirm = () => {
    if (clearType === 'today') {
      onConfirm({ type: 'today' })
    } else if (clearType === 'specific') {
      onConfirm({ type: 'specific', date: new Date(selectedDate) })
    } else if (clearType === 'range') {
      onConfirm({
        type: 'range',
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      })
    } else if (taskName.trim()) {
      onConfirm({ type: 'name', taskName: taskName.trim() })
    }
  }

  const isRangeInvalid = new Date(startDate) > new Date(endDate)
  const isConfirmDisabled =
    (clearType === 'name' && !taskName.trim()) || (clearType === 'range' && isRangeInvalid)

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Clear Tasks / 清空任务</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          This will permanently delete matching tasks. / 该操作会永久删除匹配任务。
        </Alert>

        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
          Scope / 范围
        </Typography>

        <RadioGroup value={clearType} onChange={(e) => setClearType(e.target.value as ClearConfig['type'])}>
          <FormControlLabel value="today" control={<Radio />} label="Today / 今天" />
          <FormControlLabel value="specific" control={<Radio />} label="Specific date / 指定日期" />
          <FormControlLabel value="range" control={<Radio />} label="Date range / 日期区间" />
          <FormControlLabel value="name" control={<Radio />} label="Task title / 任务标题" />
        </RadioGroup>

        {clearType === 'specific' && (
          <Box sx={{ mt: 2 }}>
            <TextField
              type="date"
              label="Date / 日期"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Box>
        )}

        {clearType === 'range' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              type="date"
              label="Start / 开始"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              type="date"
              label="End / 结束"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            {isRangeInvalid && <Alert severity="error">Start date must be before end date. / 开始日期不能晚于结束日期。</Alert>}
          </Box>
        )}

        {clearType === 'name' && (
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Task title / 任务标题"
              placeholder="Enter title / 输入任务标题"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              helperText="Deletes all matching titles. / 会删除所有同名任务。"
              fullWidth
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose}>Cancel / 取消</Button>
        <Button onClick={handleConfirm} variant="contained" color="error" disabled={isConfirmDisabled}>
          Delete / 删除
        </Button>
      </DialogActions>
    </Dialog>
  )
}
