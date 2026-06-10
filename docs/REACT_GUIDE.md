# React 入门指南（为Vue开发者）

## 📍 第一个问题：@ 路径别名在哪里定义的？

**答案：** 在 `vite.config.ts` 文件中的 `resolve.alias` 对象里定义

### vite.config.ts 中的路径别名定义：

```typescript
// 这是第17-26行
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),                    // @ 指向 src 文件夹
    '@components': path.resolve(__dirname, './src/components'),
    '@pages': path.resolve(__dirname, './src/pages'),
    '@store': path.resolve(__dirname, './src/store'),
    '@hooks': path.resolve(__dirname, './src/hooks'),
    '@utils': path.resolve(__dirname, './src/utils'),
    '@services': path.resolve(__dirname, './src/services'),
    '@types': path.resolve(__dirname, './src/types'),
    '@assets': path.resolve(__dirname, './src/assets')
  }
}
```

这样定义后，你就可以在任何文件中使用 `@/xxx` 代替相对路径 `../../../xxx`

---

## 🔄 Vue 与 React 对比

### 1. **基础语法对比**

| 项目 | Vue | React |
|------|-----|-------|
| 文件扩展名 | `.vue` | `.tsx` (TypeScript) / `.jsx` |
| 模板语言 | `<template>` | `JSX` (类似HTML的JS) |
| 样式 | `<style scoped>` | CSS Module / CSS-in-JS |
| 逻辑 | `<script>` | TypeScript 函数体 |

### 2. **组件结构对比**

**Vue：** 三段式结构
```vue
<template>
  <!-- 模板 -->
</template>

<script setup>
  // 逻辑
</script>

<style scoped>
  /* 样式 */
</style>
```

**React：** 函数式组件
```tsx
// 逻辑（在函数体中）
export const MyComponent: React.FC<Props> = (props) => {
  // 返回 JSX（模板）
  return <div>内容</div>
}

// 样式在单独的 .scss 文件中
```

---

## 💡 DateSelector.tsx 详解

### 第一部分：导入（Imports）

```tsx
// 从 React 库导入 React 和 useState hook
import React, { useState } from 'react'

// 从 MUI 图标库导入图标组件
import {
  ChevronLeft,      // 左箭头图标
  ChevronRight,     // 右箭头图标
  Today,            // 今天图标
  KeyboardArrowLeft,
  KeyboardArrowRight,
  Event             // 日历图标
} from '@mui/icons-material'

// 从 MUI 组件库导入 UI 组件
import {
  Box,              // 类似 div，但样式更好用
  Button,           // 按钮组件
  ButtonGroup,      // 按钮组（多个按钮放在一起）
  Paper,            // 卡片组件（有阴影）
  Typography,       // 文字排版组件
  useTheme,         // Hook：获取主题
  Dialog,           // 对话框（弹窗）
  DialogTitle,      // 对话框标题
  DialogContent,    // 对话框内容
  DialogActions,    // 对话框操作按钮区域
  Grid              // 栅格系统（类似 Bootstrap）
} from '@mui/material'

// 导入工具函数和样式
import { formatDate, getTodayDate, addDays, getRelativeDateText } from '@/utils/dateUtils'
import './DateSelector.scss'
```

**Vue 对比：**
```vue
<script setup>
// Vue 中导入更简洁
import { ref } from 'vue'
import { formatDate, getTodayDate } from '@/utils/dateUtils'
</script>
```

---

### 第二部分：类型定义

```tsx
// 定义组件接收的 Props 类型（TypeScript）
// 这保证了使用组件时的类型安全
interface DateSelectorProps {
  date: Date                           // 当前日期
  onDateChange: (date: Date) => void  // 回调函数：当日期改变时调用
}
```

**Vue 对比：**
```vue
<script setup lang="ts">
interface Props {
  date: Date
  onDateChange: (date: Date) => void
}

defineProps<Props>()
</script>
```

---

### 第三部分：组件定义和 Hooks

```tsx
// React.FC = React Functional Component
// <DateSelectorProps> 是传给这个组件的属性类型
export const DateSelector: React.FC<DateSelectorProps> = ({
  date,           // 从 Props 中解构出日期
  onDateChange    // 从 Props 中解构出回调函数
}) => {
  // ============= 状态管理（Hooks）=============
  
  // useState 是 React 的状态管理 Hook（类似 Vue 的 ref）
  // 返回 [状态值, 更新函数]
  
  const theme = useTheme()  // 获取主题配置（MUI）

  // 控制快捷选择菜单是否显示
  const [showOptions, setShowOptions] = useState(false)
  // 等同于 Vue: const showOptions = ref(false)

  // 控制日历弹窗是否打开
  const [openCalendar, setOpenCalendar] = useState(false)

  // 日历显示的月份
  const [calendarMonth, setCalendarMonth] = useState(new Date())

  // 日期范围选择（起始日期和结束日期）
  const [selectedRange, setSelectedRange] = useState<{start?: Date, end?: Date}>({})
  // <{...}> 是 TypeScript 的泛型语法，表示类型

  // ============= 事件处理函数 =============

  // 上一天
  const handlePrevDay = () => {
    onDateChange(addDays(date, -1))
  }

  // 下一天
  const handleNextDay = () => {
    onDateChange(addDays(date, 1))
  }

  // 回到今天
  const handleToday = () => {
    onDateChange(getTodayDate())
  }

  // 快捷选择日期（传入天数偏移量）
  const handleQuickSelect = (offset: number) => {
    onDateChange(addDays(getTodayDate(), offset))
    setShowOptions(false)  // 选择后关闭菜单
  }

  // ============= 工具函数 =============

  // 获取指定月份的天数
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  // 获取指定月份的第一天是周几（0=周日, 1=周一...）
  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  // 处理日历中的日期点击
  const handleCalendarDayClick = (day: number) => {
    const clickedDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day)
    
    // 第一次点击：设置起始日期
    if (!selectedRange.start) {
      setSelectedRange({ start: clickedDate })
    }
    // 第二次点击：设置结束日期
    else if (!selectedRange.end) {
      // 确保结束日期晚于起始日期
      if (clickedDate < selectedRange.start) {
        setSelectedRange({ start: clickedDate, end: selectedRange.start })
      } else {
        setSelectedRange({ ...selectedRange, end: clickedDate })
      }
    }
    // 第三次点击：重新开始选择
    else {
      setSelectedRange({ start: clickedDate })
    }
  }

  // 确认日期范围选择
  const handleConfirmRange = () => {
    if (selectedRange.start && selectedRange.end) {
      onDateChange(selectedRange.start)  // 设置为范围的起始日期
      setOpenCalendar(false)             // 关闭对话框
      setSelectedRange({})               // 重置选择
    }
  }

  // 检查指定日期是否在选定范围内
  const isDateInRange = (day: number) => {
    if (!selectedRange.start || !selectedRange.end) return false
    const dateToCheck = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day)
    return dateToCheck >= selectedRange.start && dateToCheck <= selectedRange.end
  }

  // 渲染日历天数
  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(calendarMonth)
    const firstDay = getFirstDayOfMonth(calendarMonth)
    const days = []

    // 填充月份前的空白（例如6月1号是周二，前面要空出周日和周一）
    for (let i = 0; i < firstDay; i++) {
      days.push(<Box key={`empty-${i}`} className="calendar-day empty" />)
    }

    // 填充实际的日期
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day)
      // 检查这个日期是否被选中
      const isSelected = selectedRange.start?.toDateString() === currentDate.toDateString() ||
                        selectedRange.end?.toDateString() === currentDate.toDateString()
      // 检查这个日期是否在范围内
      const isInRange = isDateInRange(day)

      days.push(
        <Button
          key={day}
          className={`calendar-day ${isSelected ? 'selected' : ''} ${isInRange ? 'in-range' : ''}`}
          onClick={() => handleCalendarDayClick(day)}
        >
          {day}
        </Button>
      )
    }

    return days
  }

  // ============= JSX 返回（模板部分）=============
  
  return (
    <Paper elevation={0} className="date-selector animate-date-switch">
      {/* 日期选择器头部 */}
      <Box className="date-selector-header">
        
        {/* 按钮组：上一天 | 今天 | 下一天 */}
        <ButtonGroup variant="outlined" size="small">
          <Button
            onClick={handlePrevDay}
            className="date-nav-btn"
            startIcon={<KeyboardArrowLeft />}
          >
            上一天
          </Button>

          <Button
            onClick={handleToday}
            className={`date-display-btn ${getTodayDate().toDateString() === date.toDateString() ? 'active' : ''}`}
            startIcon={<Today />}
          >
            <Box className="date-info">
              <Typography variant="h6" className="date-text">
                {getRelativeDateText(date)}
              </Typography>
              <Typography variant="caption" className="date-full">
                {formatDate(date, 'YYYY年 MM月DD日 dddd')}
              </Typography>
            </Box>
          </Button>

          <Button
            onClick={handleNextDay}
            className="date-nav-btn"
            endIcon={<KeyboardArrowRight />}
          >
            下一天
          </Button>
        </ButtonGroup>

        {/* 快捷选择和日历选择按钮 */}
        <Box className="date-selector-actions">
          <Button
            size="small"
            onClick={() => setShowOptions(!showOptions)}
            variant="text"
            sx={{fontSize:16}}
          >
            快捷选择
          </Button>
          <Button
            size="small"
            onClick={() => setOpenCalendar(true)}
            variant="text"
            startIcon={<Event />}
          >
            日历选择
          </Button>
        </Box>
      </Box>

      {/* 快捷选择选项菜单（当 showOptions 为 true 时显示） */}
      {showOptions && (
        <Box className="quick-select-options">
          {[
            { label: '今天', offset: 0 },
            { label: '明天', offset: 1 },
            { label: '后天', offset: 2 },
            { label: '下周', offset: 7 },
            { label: '下月', offset: 30 }
          ].map((option) => (
            <Button
              key={option.offset}
              size="small"
              className="quick-option"
              onClick={() => handleQuickSelect(option.offset)}
            >
              {option.label}
            </Button>
          ))}
        </Box>
      )}

      {/* 日历对话框（弹窗） */}
      <Dialog open={openCalendar} onClose={() => setOpenCalendar(false)} maxWidth="sm" fullWidth>
        <DialogTitle>批量跳过日期</DialogTitle>
        <DialogContent>
          <Box className="calendar-container">
            
            {/* 日历头部：月份导航 */}
            <Box className="calendar-header">
              <Button
                size="small"
                onClick={() => {
                  const newMonth = new Date(calendarMonth)
                  newMonth.setMonth(newMonth.getMonth() - 1)
                  setCalendarMonth(newMonth)
                }}
              >
                <ChevronLeft />
              </Button>
              <Typography variant="h6">
                {formatDate(calendarMonth, 'YYYY年 MM月')}
              </Typography>
              <Button
                size="small"
                onClick={() => {
                  const newMonth = new Date(calendarMonth)
                  newMonth.setMonth(newMonth.getMonth() + 1)
                  setCalendarMonth(newMonth)
                }}
              >
                <ChevronRight />
              </Button>
            </Box>

            {/* 星期行（日 一 二 三 四 五 六） */}
            <Box className="calendar-weekdays">
              {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
                <Box key={day} className="weekday-label">
                  {day}
                </Box>
              ))}
            </Box>

            {/* 日期网格 */}
            <Grid container spacing={0.5} className="calendar-days">
              {renderCalendarDays().map((day, index) => (
                <Grid item xs={12 / 7} key={index}>
                  {day}
                </Grid>
              ))}
            </Grid>

            {/* 显示选定的日期范围 */}
            {selectedRange.start && selectedRange.end && (
              <Typography variant="body2" className="range-info">
                已选择：{formatDate(selectedRange.start, 'MM-DD')} 至 {formatDate(selectedRange.end, 'MM-DD')}
              </Typography>
            )}
          </Box>
        </DialogContent>

        {/* 对话框操作按钮 */}
        <DialogActions>
          <Button onClick={() => {
            setOpenCalendar(false)
            setSelectedRange({})
          }}>
            取消
          </Button>
          <Button
            onClick={handleConfirmRange}
            variant="contained"
            disabled={!selectedRange.start || !selectedRange.end}  {/* 没选完整范围时禁用 */}
          >
            确认
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  )
}
```

---

## 🔑 关键概念解释

### 1. **React Hooks**
- `useState`: 管理组件状态（Vue 的 `ref`）
- `useTheme`: 获取 MUI 主题
- 其他常用的：`useEffect`（生命周期）、`useContext`（全局状态）

### 2. **JSX 语法**
```tsx
// JSX 是 JavaScript + XML
// 看起来像 HTML，实际是 JavaScript

// 变量插值用 {}
<div>Hello {name}</div>

// 条件渲染用 &&
{showOptions && <div>内容</div>}

// 列表渲染用 .map()
{items.map(item => <div key={item.id}>{item.name}</div>)}

// 事件绑定用 onClick、onChange 等
<Button onClick={handleClick}>点击</Button>
```

### 3. **Props 流动**
```tsx
// 父组件传递 Props
<DateSelector date={currentDate} onDateChange={setCurrentDate} />

// 子组件接收并使用
export const DateSelector: React.FC<DateSelectorProps> = ({
  date,
  onDateChange
}) => {
  onDateChange(newDate)  // 调用父组件的函数
}
```

---

## 📚 学习资源

- React 官方文档：https://react.dev
- React Hooks API：https://react.dev/reference/react/hooks
- MUI 文档：https://mui.com

## 💬 总结

React 相比 Vue 的主要差异：
- ✅ 更灵活（可以写更复杂的逻辑）
- ❌ 更啰嗦（需要写更多代码）
- ✅ 生态更大（第三方库众多）
- ✅ 学习曲线陡（但值得学）

祝你学习顺利！🚀
