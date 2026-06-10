import { useMemo } from 'react'
import { Box, Card, CardContent, Chip, Stack, Typography } from '@mui/material'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { ChecklistItem } from '@/types'

interface CompletionRateChartProps {
  items: ChecklistItem[]
  title?: string
  height?: number
}

export function CompletionRateChart({
  items,
  title = '完成统计',
  height = 300
}: CompletionRateChartProps) {
  const chartData = useMemo(() => {
    const completed = items.filter((item) => item.completed).length
    const pending = items.length - completed

    return [
      { name: '已完成', value: completed },
      { name: '待完成', value: pending }
    ]
  }, [items])

  const completionRate = items.length === 0 ? 0 : Math.round((chartData[0].value / items.length) * 100)
  const colors = ['#4caf50', '#ff9800']

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {title}
        </Typography>

        {items.length === 0 ? (
          <Box className="completion-rate-chart__empty" sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="text.secondary">暂无数据</Typography>
          </Box>
        ) : (
          <>
            <Box className="completion-rate-chart__summary" sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Box className="completion-rate-chart__summary-value" sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="primary">
                  {completionRate}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  完成率
                </Typography>
              </Box>
            </Box>

            <ResponsiveContainer width="100%" height={height}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  dataKey="value"
                >
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            <Stack direction="row" spacing={1} sx={{ mt: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Chip label={`总计：${items.length}`} variant="outlined" />
              <Chip label={`已完成：${chartData[0].value}`} color="success" variant="outlined" />
              <Chip label={`待完成：${chartData[1].value}`} color="warning" variant="outlined" />
            </Stack>
          </>
        )}
      </CardContent>
    </Card>
  )
}
