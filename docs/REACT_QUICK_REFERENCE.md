# 快速参考：React vs Vue

## 📍 @ 路径别名

### 定义位置
**文件**: `vite.config.ts`  
**位置**: 第 17-26 行的 `resolve.alias` 对象

```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
    '@components': path.resolve(__dirname, './src/components'),
    // 其他别名...
  }
}
```

### 使用示例
```typescript
// ✅ 使用别名（推荐）
import { formatDate } from '@/utils/dateUtils'

// ❌ 使用相对路径（不推荐）
import { formatDate } from '../../../utils/dateUtils'
```

---

## 🔄 React vs Vue 对比表

| 功能 | Vue | React |
|------|-----|-------|
| **组件文件** | `Component.vue` | `Component.tsx` |
| **导入组件** | `import Component from '@/...'` | `import { Component } from '@/...'` |
| **状态管理** | `const count = ref(0)` | `const [count, setCount] = useState(0)` |
| **更新状态** | `count.value++` | `setCount(count + 1)` |
| **条件渲染** | `v-if="show"` | `{show && <div>...</div>}` |
| **列表渲染** | `v-for="item in items"` | `{items.map(item => ...)}` |
| **事件绑定** | `@click="handleClick"` | `onClick={handleClick}` |
| **属性绑定** | `:disabled="isDisabled"` | `disabled={isDisabled}` |
| **模板** | `<template>...</template>` | `JSX/TSX` |
| **样式作用域** | `<style scoped>` | `CSS Module 或 className` |

---

## 📚 React Hooks 常用 API

### useState - 状态管理
```typescript
const [count, setCount] = useState(0)
// 返回：[当前值, 更新函数]

// 更新状态
setCount(count + 1)
setCount(prevCount => prevCount + 1)  // 函数式更新
```

### useEffect - 副作用
```typescript
useEffect(() => {
  // 组件挂载或依赖变化时执行
  return () => {
    // 清理函数（可选）
  }
}, [dependency])  // 依赖数组
```

### useContext - 全局状态
```typescript
const value = useContext(MyContext)
```

### useCallback - 缓存函数
```typescript
const memoizedFn = useCallback(() => {
  // 函数内容
}, [dependencies])
```

### useMemo - 缓存值
```typescript
const memoizedValue = useMemo(() => {
  return expensiveCalculation()
}, [dependencies])
```

---

## 📖 JSX 语法快速参考

### 变量插值
```jsx
<div>Hello {name}</div>
<div>{1 + 2}</div>
<div>{isActive ? 'Active' : 'Inactive'}</div>
```

### 条件渲染
```jsx
// 选项1：三元运算符
{isShow ? <div>Show</div> : <div>Hide</div>}

// 选项2：逻辑与 &&（只有 true 时显示）
{isShow && <div>Show</div>}

// 选项3：if 语句（在函数中）
if (isShow) return <div>Show</div>
```

### 列表渲染
```jsx
{items.map((item, index) => (
  <div key={item.id}>
    {item.name}
  </div>
))}
```

### 事件处理
```jsx
// 无参数
<button onClick={handleClick}>Click</button>

// 有参数
<button onClick={() => handleClick(id)}>Click</button>

// 链接回调
<button onClick={() => console.log('clicked')}>Click</button>
```

### 样式
```jsx
// 内联样式（对象）
<div style={{ color: 'red', fontSize: '16px' }}>Text</div>

// className（字符串或三元）
<div className={isActive ? 'active' : 'inactive'}>Text</div>

// 动态 className
<div className={`base ${isActive ? 'active' : ''}`}>Text</div>
```

---

## 🎯 DateSelector.tsx 核心逻辑

### 1. Props 流动
```tsx
// 父组件（App.tsx）
<DateSelector 
  date={currentDate}           // 传入当前日期
  onDateChange={setCurrentDate} // 传入回调函数
/>

// 子组件接收
export const DateSelector: React.FC<DateSelectorProps> = ({ 
  date, 
  onDateChange 
}) => {
  onDateChange(newDate)  // 调用父组件函数修改状态
}
```

### 2. 状态管理
```tsx
// 四个状态
const [showOptions, setShowOptions] = useState(false)      // 快捷菜单
const [openCalendar, setOpenCalendar] = useState(false)    // 日历弹窗
const [calendarMonth, setCalendarMonth] = useState(new Date()) // 日历月份
const [selectedRange, setSelectedRange] = useState({})      // 日期范围
```

### 3. 日期范围选择流程
```
第1次点击 → selectedRange = { start: date1 }
            ↓
第2次点击 → selectedRange = { start: date1, end: date2 }
            ↓
点击"确认" → onDateChange(date1) + 关闭弹窗
```

---

## 🚀 常见问题

### Q1: React 中如何相当于 Vue 的 computed？
A: 使用 `useMemo`
```typescript
const doubled = useMemo(() => count * 2, [count])
```

### Q2: React 中如何相当于 Vue 的 watch？
A: 使用 `useEffect`
```typescript
useEffect(() => {
  console.log('count changed:', count)
}, [count])  // count 改变时执行
```

### Q3: React 中如何更新嵌套对象状态？
A: 使用对象展开 `...`
```typescript
// 原始状态
const [range, setRange] = useState({ start: null, end: null })

// 更新方式
setRange({ ...range, end: newDate })
```

### Q4: 为什么需要 key？
A: React 使用 key 来识别列表中的元素，优化 DOM diff  
```jsx
{items.map(item => <div key={item.id}>{item.name}</div>)}
```

---

## 💾 文件组织

```
src/
├── components/         # 组件
│   └── DateSelector/
│       ├── DateSelector.tsx    # 组件逻辑
│       └── DateSelector.scss   # 组件样式
├── hooks/              # 自定义 Hooks
├── store/              # 状态管理（Zustand）
├── services/           # API/数据库服务
├── utils/              # 工具函数
├── types/              # TypeScript 类型
└── assets/             # 静态资源
```

---

## 📝 命名规范

- **组件文件**: PascalCase（大驼峰）`DateSelector.tsx`
- **变量/函数**: camelCase（小驼峰）`handleClick`, `currentDate`
- **常量**: UPPER_CASE `MAX_COUNT`
- **类型/接口**: PascalCase `DateSelectorProps`

---

## 🎓 下一步学习

1. 学习 `useEffect` 处理生命周期
2. 学习 `useContext` 做全局状态管理
3. 或者用 Zustand 库（项目已集成）做状态管理
4. 学习 TypeScript 泛型 `<T>`
5. 学习性能优化：`useMemo`, `useCallback`

---

## 📚 推荐资源

- [React 官方文档](https://react.dev)
- [React Hooks 完全指南](https://react.dev/reference/react/hooks)
- [TypeScript 官方文档](https://www.typescriptlang.org)
- [Material-UI 文档](https://mui.com)

---

祝你学习顺利！🚀
