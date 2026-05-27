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
  title = 'Priority distribution',
  height = 300
}: PriorityDistributionChartProps) {
  const chartData = useMemo(() => {
    const counts = { high: 0, medium: 0, low: 0 }

    items.forEach((item) => {
      counts[item.priority] += 1
    })

    return [
      { priority: 'High', count: counts.high, fill: '#f44336' },
      { priority: 'Medium', count: counts.medium, fill: '#ff9800' },
      { priority: 'Low', count: counts.low, fill: '#4caf50' }
    ]
  }, [items])

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {title}
        </Typography>

        {items.length === 0 ? (
          <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="text.secondary">No data</Typography>
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="priority" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#667eea" name="Tasks" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
