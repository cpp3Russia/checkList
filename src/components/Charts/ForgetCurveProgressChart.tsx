import { useMemo } from 'react'
import { Box, Card, CardContent, Typography } from '@mui/material'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import type { ForgetCurveSchedule } from '@/types'
import { FORGET_CURVE_INTERVALS } from '@/utils/forgetCurveUtils'

interface ForgetCurveProgressChartProps {
  schedules: ForgetCurveSchedule[]
  title?: string
  height?: number
}

export function ForgetCurveProgressChart({
  schedules,
  title = '遗忘曲线复习进度',
  height = 300
}: ForgetCurveProgressChartProps) {
  const chartData = useMemo(() => {
    // 计算每个复习阶段的数量
    const levelCounts: Record<number, number> = {}

    FORGET_CURVE_INTERVALS.forEach((_, level) => {
      levelCounts[level] = 0
    })

    schedules.forEach(schedule => {
      if (schedule.level < FORGET_CURVE_INTERVALS.length) {
        levelCounts[schedule.level] = (levelCounts[schedule.level] || 0) + 1
      }
    })

    return FORGET_CURVE_INTERVALS.map((days, level) => ({
      level: `第 ${level} 阶段\n(${days}天)`,
      count: levelCounts[level] || 0
    }))
  }, [schedules])

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {title}
        </Typography>

        {chartData.length === 0 || chartData.every(d => d.count === 0) ? (
          <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="text.secondary">
              暂无复习数据
            </Typography>
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="level" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="count"
                fill="#667eea"
                name="任务数"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
