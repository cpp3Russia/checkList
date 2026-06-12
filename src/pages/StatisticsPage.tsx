import { useEffect, useMemo, useState } from 'react'
import { Alert, Box, Button, CircularProgress, Stack, Typography } from '@mui/material'
import { ArrowBack as ArrowBackIcon, Download as DownloadIcon } from '@mui/icons-material'
import {
  CompletionRateChart,
  CompletionTrendChart,
  ForgetCurveProgressChart,
  PriorityDistributionChart
} from '@/components/Charts'
import { storageService } from '@/services/storageService'
import type { ChecklistItem, StatisticsData } from '@/types'
import { getDateRange } from '@/utils/dateUtils'

type TimeRange = 'week' | 'month' | 'year'

interface StatisticsPageProps {
  onBack?: () => void
}

export function StatisticsPage({ onBack }: StatisticsPageProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<TimeRange>('week')
  const [items, setItems] = useState<ChecklistItem[]>([])
  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await storageService.getAllItems()
        if (active) {
          setItems(data)
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : '加载统计数据失败')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [])

  const filteredItems = useMemo(() => {
    const today = new Date()
    const { start, end } = getDateRange(today, timeRange)
    return items.filter((item) => item.date >= start && item.date <= end)
  }, [items, timeRange])

  const stats = useMemo(() => {
    const total = filteredItems.length
    const completed = filteredItems.filter((item) => item.completed).length
    const pending = total - completed
    const completionRate = total === 0 ? 0 : (completed / total) * 100

    return { total, completed, pending, completionRate }
  }, [filteredItems])

  const trendData = useMemo<StatisticsData[]>(() => {
    const today = new Date()
    const { start, end } = getDateRange(today, timeRange)
    const cursor = new Date(start)
    const rows: StatisticsData[] = []

    while (cursor <= end) {
      const next = new Date(cursor)
      next.setDate(cursor.getDate() + 1)

      const dayItems = items.filter((item) => item.date >= cursor && item.date < next)
      const completedCount = dayItems.filter((item) => item.completed).length

      rows.push({
        date: new Date(cursor),
        totalCount: dayItems.length,
        completedCount,
        completionRate: dayItems.length === 0 ? 0 : completedCount / dayItems.length
      })

      cursor.setDate(cursor.getDate() + 1)
    }

    return rows
  }, [items, timeRange])

  const handleExportData = async () => {
    try {
      setLoading(true)
      const payload = {
        exportDate: new Date().toISOString(),
        range: timeRange,
        items: filteredItems,
        statistics: stats
      }

      const element = document.createElement('a')
      element.setAttribute(
        'href',
        `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(payload, null, 2))}`
      )
      element.setAttribute('download', `任务统计-${new Date().toISOString().split('T')[0]}.json`)
      element.style.display = 'none'
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
    } catch (err) {
      setError(err instanceof Error ? err.message : '导出统计失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box className="statistics-page" sx={{ height: '100%', overflowY: 'auto', pr: 1 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box className="statistics-page__heading">
          <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
            数据统计
          </Typography>
          <Typography variant="body2" color="text.secondary">
            汇总历史任务、完成趋势和复习计划。
          </Typography>
        </Box>
        {onBack && (
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={onBack}>
            返回任务页
          </Button>
        )}
      </Stack>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: 'wrap' }}>
        {(['week', 'month', 'year'] as TimeRange[]).map((range) => (
          <Button
            key={range}
            variant={timeRange === range ? 'contained' : 'outlined'}
            onClick={() => setTimeRange(range)}
            sx={{ fontSize: '1.275rem' }}
          >
            {range === 'week' ? '本周' : range === 'month' ? '本月' : '本年'}
          </Button>
        ))}
        <Box className="statistics-page__toolbar-spacer" sx={{ flex: 1 }} />
        <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleExportData} disabled={loading} sx={{ fontSize: '1.275rem' }}>
          导出统计
        </Button>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4 }}>
        <StatBlock title="总任务数" value={String(stats.total)} accent="#dce9ff" />
        <StatBlock title="已完成" value={String(stats.completed)} accent="#def3df" />
        <StatBlock title="待完成" value={String(stats.pending)} accent="#fff0d8" />
        <StatBlock title="完成率" value={`${Math.round(stats.completionRate)}%`} accent="#dff0f8" />
      </Stack>

      {loading ? (
        <Box className="statistics-page__loading" sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : filteredItems.length === 0 && items.length === 0 ? (
        <Alert severity="info">当前还没有历史任务数据，先回任务页创建一些任务后再查看统计。</Alert>
      ) : (
        <Stack spacing={3}>
          <CompletionTrendChart data={trendData} title="完成趋势" />
          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
            <Box className="statistics-page__completion-rate-panel" sx={{ flex: 1 }}>
              <CompletionRateChart items={filteredItems} title="完成分布" />
            </Box>
            <Box className="statistics-page__priority-panel" sx={{ flex: 1 }}>
              <PriorityDistributionChart items={filteredItems} title="优先级分布" />
            </Box>
          </Stack>
          <ForgetCurveProgressChart items={items} title="复习阶段进度" />
        </Stack>
      )}
    </Box>
  )
}

function StatBlock({ title, value, accent }: { title: string; value: string; accent: string }) {
  return (
    <Box className="statistics-page__stat-block" sx={{ flex: 1, p: 2.25, bgcolor: accent, borderRadius: 3 }}>
      <Typography variant="body2" color="text.secondary">
        {title}
      </Typography>
      <Typography variant="h4" sx={{ mt: 0.5 }}>
        {value}
      </Typography>
    </Box>
  )
}
