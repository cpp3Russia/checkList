import { useState } from 'react'
import { Container, Box, Stack, Button, CircularProgress, Alert, Typography } from '@mui/material'
import { Download as DownloadIcon, Refresh as RefreshIcon } from '@mui/icons-material'
import { useChecklistStore } from '@/store/checklistStore'
import { useForgetCurve } from '@/hooks/useForgetCurve'
import { useForgetCurveStore } from '@/store/forgetCurveStore'
import {
  CompletionTrendChart,
  ForgetCurveProgressChart,
  CompletionRateChart,
  PriorityDistributionChart
} from '@/components/Charts'
import { getDateRange } from '@/utils/dateUtils'

export function StatisticsPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week')

  const checklistItems = useChecklistStore(state => state.items)
  useForgetCurve()
  const schedules = useForgetCurveStore(state => Array.from(state.schedules.values()))

  // 获取指定时间范围的数据
  const getFilteredItems = (range: 'week' | 'month' | 'year') => {
    const today = new Date()
    const { start, end } = getDateRange(today, range)
    
    return checklistItems.filter(item => 
      item.date >= start && item.date <= end
    )
  }

  const filteredItems = getFilteredItems(timeRange)

  const handleExportData = async () => {
    try {
      setLoading(true)
      const data = {
        exportDate: new Date().toISOString(),
        items: checklistItems,
        statistics: {
          totalItems: checklistItems.length,
          completedItems: checklistItems.filter(item => item.completed).length,
          completionRate: checklistItems.length === 0 ? 0 : 
            (checklistItems.filter(item => item.completed).length / checklistItems.length) * 100
        }
      }
      
      const dataStr = JSON.stringify(data, null, 2)
      const element = document.createElement('a')
      element.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(dataStr))
      element.setAttribute('download', `checklist-export-${new Date().toISOString().split('T')[0]}.json`)
      element.style.display = 'none'
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
    } catch (err) {
      setError(err instanceof Error ? err.message : '导出失败')
    } finally {
      setLoading(false)
    }
  }

  // 统计信息
  const stats = {
    total: filteredItems.length,
    completed: filteredItems.filter(item => item.completed).length,
    pending: filteredItems.filter(item => !item.completed).length,
    completionRate: filteredItems.length === 0 ? 0 : 
      (filteredItems.filter(item => item.completed).length / filteredItems.length) * 100
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* 页面标题 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
          数据统计
        </Typography>
        <Typography variant="body2" color="text.secondary">
          查看你的任务完成情况和学习进度
        </Typography>
      </Box>

      {/* 错误提示 */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 操作栏 */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Button
          variant="outlined"
          onClick={() => setTimeRange('week')}
          color={timeRange === 'week' ? 'primary' : 'inherit'}
        >
          本周
        </Button>
        <Button
          variant="outlined"
          onClick={() => setTimeRange('month')}
          color={timeRange === 'month' ? 'primary' : 'inherit'}
        >
          本月
        </Button>
        <Button
          variant="outlined"
          onClick={() => setTimeRange('year')}
          color={timeRange === 'year' ? 'primary' : 'inherit'}
        >
          本年
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleExportData}
          disabled={loading}
        >
          导出数据
        </Button>
      </Stack>

      {/* 统计摘要 */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4 }}>
        <Box sx={{ flex: 1, p: 2, bgcolor: 'primary.light', borderRadius: 2 }}>
          <Typography variant="body2" color="text.secondary">
            总任务数
          </Typography>
          <Typography variant="h4">{stats.total}</Typography>
        </Box>
        <Box sx={{ flex: 1, p: 2, bgcolor: 'success.light', borderRadius: 2 }}>
          <Typography variant="body2" color="text.secondary">
            已完成
          </Typography>
          <Typography variant="h4">{stats.completed}</Typography>
        </Box>
        <Box sx={{ flex: 1, p: 2, bgcolor: 'warning.light', borderRadius: 2 }}>
          <Typography variant="body2" color="text.secondary">
            待完成
          </Typography>
          <Typography variant="h4">{stats.pending}</Typography>
        </Box>
        <Box sx={{ flex: 1, p: 2, bgcolor: 'info.light', borderRadius: 2 }}>
          <Typography variant="body2" color="text.secondary">
            完成率
          </Typography>
          <Typography variant="h4">{Math.round(stats.completionRate)}%</Typography>
        </Box>
      </Stack>

      {/* 图表区域 */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Stack spacing={3}>
          <CompletionTrendChart data={[]} />
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
            <Box sx={{ flex: 1 }}>
              <CompletionRateChart items={filteredItems} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <PriorityDistributionChart items={filteredItems} />
            </Box>
          </Stack>
          <ForgetCurveProgressChart schedules={[]} />
        </Stack>
      )}
    </Container>
  )
}
