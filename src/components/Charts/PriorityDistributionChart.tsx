import { useMemo } from 'react'
import { Box, Card, CardContent, Typography } from '@mui/material'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import type { ChecklistItem } from '@/types'

interface PriorityDistributionChartProps {
  items: ChecklistItem[]
  title?: string
  height?: number
}

export function PriorityDistributionChart({
  items,
  title = '优先级分布',
  height = 300
}: PriorityDistributionChartProps) {
  const chartData = useMemo(() => {
    const counts = { high: 0, medium: 0, low: 0 }

    items.forEach((item) => {
      counts[item.priority] += 1
    })

    return [
      { priority: '高', count: counts.high, fill: '#f44336' },
      { priority: '中', count: counts.medium, fill: '#ff9800' },
      { priority: '低', count: counts.low, fill: '#4caf50' }
    ]
  }, [items])

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {title}
        </Typography>

        {items.length === 0 ? (
          <Box className="priority-distribution-chart__empty" sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="text.secondary">暂无数据</Typography>
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="priority" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#667eea" name="任务数" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
