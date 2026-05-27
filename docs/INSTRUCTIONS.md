# React 遗忘曲线 Checklist 项目实现指南

## 📋 项目概述

基于 React + TypeScript 的智能待办清单系统，集成艾宾浩斯遗忘曲线、动态日期管理、图片记录和数据可视化功能。

## 🎯 核心功能需求

### 1. **日期管理模块**
- ✅ 默认显示今天日期
- ✅ 日期选择器支持前后翻页
- ✅ 快速日期快捷方式（今天、昨天、周、月）
- ✅ 日期格式统一处理

### 2. **Checklist 管理**
- ✅ 创建新任务（add list）
- ✅ 删除任务
- ✅ 标记完成/未完成
- ✅ 任务优先级设置
- ✅ 任务分类标签

### 3. **遗忘曲线集成**
- ✅ 创建任务时可选择"加入遗忘曲线"
- ✅ 基于艾宾浩斯遗忘曲线自动推荐日期
  - 第一次复习：1 天后
  - 第二次复习：3 天后
  - 第三次复习：7 天后
  - 第四次复习：15 天后
  - 第五次复习：30 天后
- ✅ 到期日期自动弹出任务
- ✅ 用户可选择加入今日清单或跳过

### 4. **图片记录功能**
- ✅ 完成任务时上传/拍照
- ✅ 图片压缩和存储
- ✅ 图片预览和删除
- ✅ 支持多张图片

### 5. **数据可视化**
- ✅ 折线图展示完成趋势
- ✅ 日完成率统计
- ✅ 周/月对比数据
- ✅ 遗忘曲线复习情况图表

### 6. **动效设计**（参考洛克王国风格）
- ✅ 任务添加动画（滑入）
- ✅ 任务完成动画（缩放 + 淡出）
- ✅ 任务删除动画（侧滑 + 淡出）
- ✅ 日期切换过渡动画
- ✅ 图表数据更新动画

### 7. **屏幕适配**
- ✅ 使用已有的 SCSS 混合函数（cspx, cispx）
- ✅ 响应式布局（竖屏/横屏）
- ✅ 移动端优先设计

## 🔧 核心功能实现详解

### 遗忘曲线算法

```typescript
export interface ForgetCurveSchedule {
  level: number;
  nextReviewDate: Date;
  easeFactor: number;
  interval: number;
  lastReviewDate: Date;
  reviewCount: number;
}

export const FORGET_CURVE_INTERVALS = [0, 1, 3, 7, 15, 30];

export function calculateNextReviewDate(
  currentLevel: number,
  lastReviewDate: Date
): ForgetCurveSchedule {
  const nextLevel = Math.min(currentLevel + 1, FORGET_CURVE_INTERVALS.length - 1);
  const interval = FORGET_CURVE_INTERVALS[nextLevel];
  
  const nextDate = new Date(lastReviewDate);
  nextDate.setDate(nextDate.getDate() + interval);
  nextDate.setHours(9, 0, 0, 0);
  
  return {
    level: nextLevel,
    nextReviewDate: nextDate,
    easeFactor: 2.5,
    interval,
    lastReviewDate,
    reviewCount: currentLevel + 1
  };
}
```

### 日期管理

```typescript
export function getTodayDate(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function getDateRange(date: Date, type: 'day' | 'week' | 'month' | 'year') {
  const start = new Date(date);
  const end = new Date(date);
  
  start.setHours(0, 0, 0, 0);
  
  switch (type) {
    case 'day':
      end.setHours(23, 59, 59, 999);
      break;
    case 'week':
      const dayOfWeek = start.getDay();
      start.setDate(start.getDate() - dayOfWeek);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    // ...
  }
  
  return { start, end };
}
```

### 状态管理示例

```typescript
// Zustand + Immer
interface ChecklistStore {
  items: ChecklistItem[];
  addItem: (item: ChecklistItem) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<ChecklistItem>) => void;
  completeItem: (id: string, images: string[]) => void;
}

const useChecklistStore = create<ChecklistStore>()(
  immer((set) => ({
    items: [],
    addItem: (item) => {
      set((state) => {
        state.items.push(item);
      });
    },
    // ...
  }))
);
```

### 数据持久化

```typescript
// IndexedDB 存储结构
- checklists (keyPath: 'id')
  - 索引：date, completed
- forgetCurves (keyPath: 'itemId')
- statistics (keyPath: 'date')
  - 索引：date
```

## 🎨 动效实现

### CSS 动画

```scss
@keyframes taskSlideIn {
  from {
    opacity: 0;
    transform: translateX(-30px) rotateZ(-5deg);
  }
  to {
    opacity: 1;
    transform: translateX(0) rotateZ(0);
  }
}

@keyframes taskComplete {
  0% { opacity: 1; transform: scale(1) rotateZ(0deg); }
  50% { opacity: 1; transform: scale(1.1) rotateZ(5deg); }
  100% { opacity: 0; transform: scale(0) rotateZ(360deg); }
}
```

## 📦 依赖配置

参考项目中的 `package.json` 文件，包含以下关键包：

- React 18.3.1
- Material-UI 6.4.0
- Zustand 4.5.5
- Recharts 2.14.4
- Framer Motion 11.8.0
- Day.js 1.11.13
- 以及 26 个其他支持包

## 下一步

1. ✅ 项目结构和配置 - 已完成
2. ✅ 核心工具和 Hooks - 已完成
3. 🟨 UI 组件开发 - 进行中
4. [ ] 页面级组件
5. [ ] 集成测试和优化

