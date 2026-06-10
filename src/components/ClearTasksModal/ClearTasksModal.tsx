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
      <DialogTitle>清空任务</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          该操作会永久删除符合条件的任务，请谨慎确认。
        </Alert>

        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
          清空范围
        </Typography>

        <RadioGroup value={clearType} onChange={(e) => setClearType(e.target.value as ClearConfig['type'])}>
          <FormControlLabel value="today" control={<Radio />} label="今天" />
          <FormControlLabel value="specific" control={<Radio />} label="指定日期" />
          <FormControlLabel value="range" control={<Radio />} label="日期区间" />
          <FormControlLabel value="name" control={<Radio />} label="任务标题" />
        </RadioGroup>

        {clearType === 'specific' && (
          <Box className="clear-tasks-modal__specific" sx={{ mt: 2 }}>
            <TextField
              type="date"
              label="日期"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Box>
        )}

        {clearType === 'range' && (
          <Box className="clear-tasks-modal__range" sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              type="date"
              label="开始日期"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              type="date"
              label="结束日期"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            {isRangeInvalid && <Alert severity="error">开始日期不能晚于结束日期。</Alert>}
          </Box>
        )}

        {clearType === 'name' && (
          <Box className="clear-tasks-modal__name" sx={{ mt: 2 }}>
            <TextField
              label="任务标题"
              placeholder="输入任务标题"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              helperText="会删除所有同名任务。"
              fullWidth
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 ,fontSize: 14}}>
        <Button onClick={handleClose} sx={{fontSize: 14}}>取消</Button>
        <Button onClick={handleConfirm} variant="contained" color="error" disabled={isConfirmDisabled} sx={{fontSize: 14}}>
          删除
        </Button>
      </DialogActions>
    </Dialog>
  )
}
