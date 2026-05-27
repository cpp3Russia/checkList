import { useMemo, useState } from 'react'
import {
  Box,
  Button,
  ButtonGroup,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Typography
} from '@mui/material'
import {
  ChevronLeft,
  ChevronRight,
  Event,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  Today
} from '@mui/icons-material'
import { addDays, formatDate, getRelativeDateText, getTodayDate, isSameDay } from '@/utils/dateUtils'
import './DateSelector.scss'

interface DateSelectorProps {
  date: Date
  onDateChange: (date: Date) => void
}

const quickOptions = [
  { label: 'Today', offset: 0 },
  { label: 'Tomorrow', offset: 1 },
  { label: 'In 2 days', offset: 2 },
  { label: 'In 1 week', offset: 7 },
  { label: 'In 30 days', offset: 30 }
]

function buildCalendarDays(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay()
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const cells: Array<number | null> = []

  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let day = 1; day <= daysInMonth; day++) cells.push(day)

  return cells
}

export function DateSelector({ date, onDateChange }: DateSelectorProps) {
  const [showQuickOptions, setShowQuickOptions] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(new Date(date))
  const calendarDays = useMemo(() => buildCalendarDays(calendarMonth), [calendarMonth])

  const handlePickDay = (day: number) => {
    onDateChange(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day))
    setCalendarOpen(false)
  }

  return (
    <Paper elevation={0} className="date-sel slide-in">
      <Box className="date-head">
        <ButtonGroup variant="outlined" size="small">
          <Button onClick={() => onDateChange(addDays(date, -1))} className="btn-nav" startIcon={<KeyboardArrowLeft />}>
            Prev
          </Button>
          <Button
            onClick={() => onDateChange(getTodayDate())}
            className={`btn-date ${isSameDay(date, getTodayDate()) ? 'active' : ''}`}
            startIcon={<Today />}
          >
            <Box className="d-info">
              <Typography variant="h6" className="d-text">
                {getRelativeDateText(date)}
              </Typography>
              <Typography variant="caption" className="d-full">
                {formatDate(date, 'YYYY-MM-DD')}
              </Typography>
            </Box>
          </Button>
          <Button onClick={() => onDateChange(addDays(date, 1))} className="btn-nav" endIcon={<KeyboardArrowRight />}>
            Next
          </Button>
        </ButtonGroup>

        <Box className="date-acts">
          <Button size="small" variant="text" onClick={() => setShowQuickOptions((value) => !value)}>
            Quick pick
          </Button>
          <Button
            size="small"
            variant="text"
            startIcon={<Event />}
            onClick={() => {
              setCalendarMonth(new Date(date))
              setCalendarOpen(true)
            }}
          >
            Calendar
          </Button>
        </Box>
      </Box>

      {showQuickOptions && (
        <Box className="quick-opts">
          {quickOptions.map((option) => (
            <Button
              key={option.offset}
              size="small"
              className="q-opt"
              onClick={() => {
                onDateChange(addDays(getTodayDate(), option.offset))
                setShowQuickOptions(false)
              }}
            >
              {option.label}
            </Button>
          ))}
        </Box>
      )}

      <Dialog open={calendarOpen} onClose={() => setCalendarOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Select date</DialogTitle>
        <DialogContent>
          <Box className="cal-cnt">
            <Box className="cal-head">
              <Button
                size="small"
                onClick={() =>
                  setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))
                }
              >
                <ChevronLeft />
              </Button>
              <Typography variant="h6">{formatDate(calendarMonth, 'YYYY-MM')}</Typography>
              <Button
                size="small"
                onClick={() =>
                  setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))
                }
              >
                <ChevronRight />
              </Button>
            </Box>

            <Box className="cal-wks">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <Box key={day} className="wk-lbl">
                  {day}
                </Box>
              ))}
            </Box>

            <Box className="cal-days-grid">
              {calendarDays.map((day, index) => {
                if (day === null) {
                  return <Box key={`empty-${index}`} className="cal-day empty" />
                }

                const currentDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day)
                const active = isSameDay(currentDay, date)

                return (
                  <Button
                    key={day}
                    className={`cal-day ${active ? 'active' : ''}`}
                    onClick={() => handlePickDay(day)}
                  >
                    {day}
                  </Button>
                )
              })}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCalendarOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  )
}
