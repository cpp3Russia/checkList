import { useMemo } from 'react'
import { Box, Card, CardContent, Typography } from '@mui/material'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
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
  const chartData = useMemo(() => {
    return data.map(item => ({
      date: formatDate(item.date, 'MM-DD'),
      completed: item.completedCount,
      total: item.totalCount,
      rate: Math.round(item.completionRate * 100)
    }))
  }, [data])

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {title}
        </Typography>

        {chartData.length === 0 ? (
          <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="text.secondary">
              暂无数据
            </Typography>
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="completed"
                stroke="#667eea"
                dot={{ fill: '#667eea' }}
                name="已完成"
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#764ba2"
                dot={{ fill: '#764ba2' }}
                name="总数"
              />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="#4caf50"
                dot={{ fill: '#4caf50' }}
                yAxisId="right"
                name="完成率(%)"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
