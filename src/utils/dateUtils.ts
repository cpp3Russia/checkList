import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

export function getTodayDate(): Date {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

export function getDateRange(
  date: Date,
  type: 'day' | 'week' | 'month' | 'year'
): { start: Date; end: Date } {
  const start = new Date(date)
  const end = new Date(date)

  start.setHours(0, 0, 0, 0)

  switch (type) {
    case 'day':
      end.setHours(23, 59, 59, 999)
      break
    case 'week': {
      const dayOfWeek = start.getDay()
      start.setDate(start.getDate() - dayOfWeek)
      end.setTime(start.getTime())
      end.setDate(start.getDate() + 6)
      end.setHours(23, 59, 59, 999)
      break
    }
    case 'month':
      start.setDate(1)
      end.setMonth(end.getMonth() + 1)
      end.setDate(0)
      end.setHours(23, 59, 59, 999)
      break
    case 'year':
      start.setMonth(0, 1)
      end.setMonth(11, 31)
      end.setHours(23, 59, 59, 999)
      break
  }

  return { start, end }
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

export function normalizeToDayStart(date: Date): Date {
  const normalized = new Date(date)
  normalized.setHours(0, 0, 0, 0)
  return normalized
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function getRelativeDateText(date: Date): string {
  const today = getTodayDate()
  const yesterday = addDays(today, -1)
  const tomorrow = addDays(today, 1)
  const dayAfterTomorrow = addDays(today, 2)

  if (isSameDay(date, today)) return '今天'
  if (isSameDay(date, yesterday)) return '昨天'
  if (isSameDay(date, tomorrow)) return '明天'
  if (isSameDay(date, dayAfterTomorrow)) return '后天'

  return formatDate(date, 'MM-DD')
}

export function getTaskSummaryDateLabel(date: Date): string {
  const today = getTodayDate()
  const yesterday = addDays(today, -1)
  const tomorrow = addDays(today, 1)
  const dayAfterTomorrow = addDays(today, 2)

  if (isSameDay(date, today)) return '今日'
  if (isSameDay(date, tomorrow)) return '明天'
  if (isSameDay(date, dayAfterTomorrow)) return '后天'
  if (isSameDay(date, yesterday)) return '昨日'

  return formatDate(date, 'YYYY年M月D日')
}

export function formatDate(date: Date, format = 'YYYY-MM-DD HH:mm'): string {
  return dayjs(date).format(format)
}

export function parseDate(dateString: string, format = 'YYYY-MM-DD'): Date {
  return dayjs(dateString, format).toDate()
}

export function getDaysDiff(date1: Date, date2: Date): number {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  d1.setHours(0, 0, 0, 0)
  d2.setHours(0, 0, 0, 0)

  return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))
}

export function formatDuration(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':')
}

export function getWeekDayName(date: Date, format: 'short' | 'long' = 'short'): string {
  const names = {
    short: ['日', '一', '二', '三', '四', '五', '六'],
    long: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  }

  return names[format][date.getDay()]
}

export function getWeekDates(date: Date): Date[] {
  const { start } = getDateRange(date, 'week')
  const dates: Date[] = []

  for (let i = 0; i < 7; i++) {
    dates.push(addDays(start, i))
  }

  return dates
}

export function getMonthDates(date: Date): Date[] {
  const { start, end } = getDateRange(date, 'month')
  const dates: Date[] = []
  const current = new Date(start)

  while (current <= end) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }

  return dates
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6
}

export function isWeekday(date: Date): boolean {
  return !isWeekend(date)
}
