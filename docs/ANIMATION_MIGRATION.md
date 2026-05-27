# 洛克王国弹窗动效 - 项目集成指南

> 如何将 `RockPopup` 组件集成到现有项目中，替换原有弹窗。

---

## 🚀 快速集成（3 步）

### 1️⃣ 导入组件
```typescript
import { RockPopup, RewardPopup, ConfirmPopup } from '@/components/RockPopup'
```

### 2️⃣ 使用预设
```typescript
// 奖励弹窗（自带粒子 + 音效）
<RewardPopup open={true} onClose={() => {}} reward="金币 +100" />

// 确认框
<ConfirmPopup open={true} onClose={() => {}} 
  onConfirm={() => {}} title="确认删除" message="确定吗？" />

// 自定义弹窗（5 种动效）
<RockPopup open={true} onClose={() => {}} title="标题" variant="centerPop">
  内容
</RockPopup>
```

### 3️⃣ 支持的 5 种动效

| 动效 | 代码值 | 适用场景 | 时长 |
|------|-------|--------|------|
| 中心缩放弹出 | `centerPop` | 提示、确认、普通奖励 | 350ms |
| 底部上滑 | `bottomSlide` | 背包、菜单、商城 | 350ms |
| 奖励爆炸 | `reward` | 抽卡、获得精灵、强化成功 | 500ms |
| 书页翻开 | `bookFlip` | 任务书、图鉴、剧情 | 600ms |
| 从图标放大 | `zoomFromIcon` | 物品详情、成就展示 | 400ms |

---

## 📝 迁移清单

### ✅ 已完成
- [x] RockPopup 核心组件（支持 5 种动效）
- [x] RewardPopup 预设（包含粒子 + 音效）
- [x] ConfirmPopup 预设（确认框）
- [x] 演示页面 RockPopupShowcase
- [x] SCSS 完整样式和动画

### ⏳ 需要迁移的组件

#### 1. AddTaskModal → RockPopup

**原代码**（`src/components/AddTaskModal/AddTaskModal.tsx`）：
```typescript
export function AddTaskModal({ open, onClose, onSubmit, initialDate }: Props) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm">
      <DialogTitle>新增任务</DialogTitle>
      {/* ... 表单内容 ... */}
    </Dialog>
  )
}
```

**改造为**：
```typescript
import { RockPopup } from '@/components/RockPopup'

export function AddTaskModal({ open, onClose, onSubmit, initialDate }: Props) {
  return (
    <RockPopup
      open={open}
      onClose={onClose}
      title="新增任务"
      variant="centerPop"  // 改这里：使用洛克王国动效
      sound="ding"         // 新增：弹出音效
      showMask={true}      // 新增：半透明遮罩
    >
      {/* 保持原有表单内容 */}
    </RockPopup>
  )
}
```

**改动点**：
```diff
- <Dialog open={open} onClose={onClose} maxWidth="sm">
- <DialogTitle>新增任务</DialogTitle>
+ <RockPopup open={open} onClose={onClose} title="新增任务" 
+   variant="centerPop" sound="ding">
```

---

#### 2. ChecklistItem 完成动画

**原代码**（`src/components/ChecklistItem/ChecklistItem.tsx`）：
```typescript
const handleComplete = async () => {
  if (item.completed) return
  onComplete(item.id, item.images)
}
```

**改造为**：
```typescript
import { useState } from 'react'

const handleComplete = async () => {
  if (item.completed) return
  
  // 触发完成动画
  setIsCompleting(true)
  
  // 等待动画完成后再处理逻辑
  setTimeout(() => {
    onComplete(item.id, item.images)
    setIsCompleting(false)
  }, 300)
}

// 在 JSX 中
<Card className={`checklist-item ${isCompleting ? 'completing' : ''}`}>
  {/* ... 内容 ... */}
</Card>
```

**新增 SCSS**（`src/components/ChecklistItem/ChecklistItem.scss`）：
```scss
.checklist-item {
  &.completing {
    animation: itemComplete 0.3s ease-in forwards;
  }
}

@keyframes itemComplete {
  0% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
  100% {
    opacity: 0;
    transform: scale(0.8) rotate(15deg);
  }
}
```

---

#### 3. 成功提示 → RewardPopup

**原代码**（`src/pages/ChecklistPage.tsx`）：
```typescript
const handleAddTask = async (item: ChecklistItemType) => {
  try {
    await addItem(item)
    setOpenModal(false)
    // 没有成功提示
  } catch (err) {
    console.error('添加任务失败:', err)
  }
}
```

**改造为**：
```typescript
import { RewardPopup } from '@/components/RockPopup'

const [showSuccess, setShowSuccess] = useState(false)
const [successMessage, setSuccessMessage] = useState('')

const handleAddTask = async (item: ChecklistItemType) => {
  try {
    await addItem(item)
    setOpenModal(false)
    
    // 显示成功弹窗
    setSuccessMessage('✨ 任务添加成功')
    setShowSuccess(true)
  } catch (err) {
    console.error('添加任务失败:', err)
  }
}

return (
  <>
    {/* ... 其他内容 ... */}
    <RewardPopup
      open={showSuccess}
      onClose={() => setShowSuccess(false)}
      reward={successMessage}
    />
  </>
)
```

---

#### 4. 删除确认 → ConfirmPopup

**原代码**（`src/components/ChecklistItem/ChecklistItem.tsx`）：
```typescript
const handleDelete = () => {
  if (confirm('确定要删除这个任务吗？')) {
    onDelete(item.id)
  }
}
```

**改造为**：
```typescript
import { useState } from 'react'
import { ConfirmPopup } from '@/components/RockPopup'

const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

const handleDelete = () => {
  setShowDeleteConfirm(true)
}

return (
  <>
    {/* ... 任务项内容 ... */}
    <ConfirmPopup
      open={showDeleteConfirm}
      onClose={() => setShowDeleteConfirm(false)}
      onConfirm={() => {
        onDelete(item.id)
        setShowDeleteConfirm(false)
      }}
      title="删除任务"
      message="确定要删除这个任务吗？此操作无法撤销。"
    />
  </>
)
```

---

## 🎨 其他可选改造

### 5. 页面过渡动画

在 `src/pages` 中的各个页面组件添加进场动画：

```typescript
// ChecklistPage.tsx
<Container className="page-enter-animation">
  {/* 内容 */}
</Container>

// 样式
@keyframes pageEnter {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.page-enter-animation {
  animation: pageEnter 0.3s ease-out;
}
```

### 6. 列表项进场动画

```scss
.checklist-item {
  animation: itemEnter 0.3s ease-out backwards;
  
  @for $i from 0 to 20 {
    &:nth-child(#{$i}) {
      animation-delay: $i * 50ms;
    }
  }
}

@keyframes itemEnter {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

## 📦 文件检查清单

创建或修改的文件：

```
src/components/
├── RockPopup/                    ✅ 新建
│   ├── RockPopup.tsx            ✅ 核心组件
│   ├── RockPopup.scss           ✅ 样式 + 动画
│   └── index.ts                 ✅ 导出
│
├── AddTaskModal/
│   └── AddTaskModal.tsx         ⏳ 改造中
│
├── ChecklistItem/
│   └── ChecklistItem.tsx        ⏳ 改造中
│
└── (其他组件)                   ⏳ 可选改造

src/pages/
├── RockPopupShowcase.tsx        ✅ 新建（演示页）
├── ChecklistPage.tsx             ⏳ 改造中
├── StatisticsPage.tsx           ✅ 可选改造
└── SettingsPage.tsx             ✅ 可选改造

docs/
├── POKEMON_POPUP_EFFECTS.md     ✅ 新建（参考文档）
└── ANIMATION_MIGRATION.md       ⏳ 本文件
```

---

## 🔧 常见问题

### Q1: 如何自定义弹窗颜色？
```typescript
<RockPopup 
  open={true}
  onClose={() => {}}
  variant="centerPop"
  // 通过 SCSS 覆盖
  className="custom-popup"
>
  内容
</RockPopup>

// 在 SCSS 中
.custom-popup {
  .rock-popup__card {
    background: linear-gradient(135deg, #ff6b9d 0%, #c44569 100%);
  }
  
  .rock-popup__header {
    background: linear-gradient(90deg, #ff6b9d 0%, #c44569 100%);
  }
}
```

### Q2: 如何禁用音效？
```typescript
<RockPopup open={true} onClose={() => {}} sound="none">
  内容
</RockPopup>
```

### Q3: 如何在手机上调整弹窗大小？
SCSS 中已包含响应式规则，会自动调整为屏幕宽度的 70%。

### Q4: 粒子效果性能如何？
- 粒子数量限制为 40-50 个
- 使用 `requestAnimationFrame` 优化性能
- 1000ms 后自动清理

---

## ✨ 下一步计划

1. **完成迁移**：按照上述清单改造现有组件
2. **测试**：在各个页面测试动效流畅度
3. **优化**：根据设备性能调整动画时长和粒子数量
4. **补充音效**：添加真实的 MP3/WAV 音效文件
5. **分享**：在团队中推广使用规范

---

## 🎯 预期效果

- ✅ 所有弹窗都有对应的进场 / 出场动画
- ✅ 用户操作反馈明显
- ✅ 整体风格统一（洛克王国风格）
- ✅ 性能稳定（60fps 动画）
- ✅ 移动端友好（响应式适配）

