import { useMemo } from 'react'
import { Box, Card, CardContent, Typography } from '@mui/material'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import type { StatisticsData } from '@/types'
import { formatDate } from '@/utils/dateUtils'

interface CompletionTrendChartProps {
  data: StatisticsData[]
  title?: string
  height?: number
}

export function CompletionTrendChart({
  data,
  title = '完成趋势',
  height = 300
}: CompletionTrendChartProps) {
  const chartData = useMemo(
    () =>
      data.map((item) => ({
        date: formatDate(item.date, 'MM-DD'),
        completed: item.completedCount,
        total: item.totalCount,
        rate: Math.round(item.completionRate * 100)
      })),
    [data]
  )

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {title}
        </Typography>

        {chartData.length === 0 ? (
          <Box className="completion-trend-chart__empty" sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="text.secondary">暂无数据</Typography>
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="count" />
              <YAxis yAxisId="rate" orientation="right" domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="count"
                type="monotone"
                dataKey="completed"
                stroke="#667eea"
                dot={{ fill: '#667eea' }}
                name="已完成"
              />
              <Line
                yAxisId="count"
                type="monotone"
                dataKey="total"
                stroke="#764ba2"
                dot={{ fill: '#764ba2' }}
                name="总数"
              />
              <Line
                yAxisId="rate"
                type="monotone"
                dataKey="rate"
                stroke="#4caf50"
                dot={{ fill: '#4caf50' }}
                name="完成率 (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
