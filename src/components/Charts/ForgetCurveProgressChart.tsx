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
import { FORGET_CURVE_INTERVALS, createInitialReviewSchedule, generateReviewPlan } from '@/utils/forgetCurveUtils'

interface ForgetCurveProgressChartProps {
  items: ChecklistItem[]
  title?: string
  height?: number
}

export function ForgetCurveProgressChart({
  items,
  title = '复习阶段进度',
  height = 300
}: ForgetCurveProgressChartProps) {
  const chartData = useMemo(() => {
    const allReviewItems = items.filter((item) => item.inForgetCurve)

    const cumulativeLevelCounts: Record<number, number> = {}
    const activeLevelCounts: Record<number, number> = {}

    FORGET_CURVE_INTERVALS.forEach((_, level) => {
      cumulativeLevelCounts[level] = 0
      activeLevelCounts[level] = 0
    })

    allReviewItems.forEach((item) => {
      const baseDate = item.completedAt ?? item.date
      const fullPlan = generateReviewPlan(baseDate, true)
      const currentSchedule = item.forgetCurveData ?? createInitialReviewSchedule(baseDate)

      fullPlan.forEach((schedule) => {
        cumulativeLevelCounts[schedule.level] = (cumulativeLevelCounts[schedule.level] || 0) + 1
      })

      activeLevelCounts[currentSchedule.level] = (activeLevelCounts[currentSchedule.level] || 0) + 1
    })

    return FORGET_CURVE_INTERVALS.map((days, level) => ({
      level: `阶段 ${level}`,
      interval: `${days} 天`,
      cumulativeCount: cumulativeLevelCounts[level] || 0,
      activeCount: activeLevelCounts[level] || 0
    }))
  }, [items])

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 1.5 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          浅色柱表示所有复习任务在完整遗忘曲线里会经过该阶段多少次，深色柱表示当前正停留在该阶段的任务数。
        </Typography>

        {chartData.every((item) => item.cumulativeCount === 0 && item.activeCount === 0) ? (
          <Box
            className="forget-curve-progress-chart__empty"
            sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Typography color="text.secondary">暂无复习数据</Typography>
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="level" />
              <YAxis allowDecimals={false} />
              <Tooltip
                formatter={(value, name, item) => {
                  if (name === 'activeCount') {
                    return [value, `当前停留任务数 · ${item.payload.interval}`]
                  }

                  return [value, `累计经过任务数 · ${item.payload.interval}`]
                }}
              />
              <Legend />
              <Bar dataKey="cumulativeCount" fill="#9bbcff" name="累计经过该阶段的任务数" />
              <Bar dataKey="activeCount" fill="#1a63d9" name="当前停留在该阶段的任务数" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
