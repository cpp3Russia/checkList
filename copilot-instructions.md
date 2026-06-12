# React Forget Curve Checklist - GitHub Copilot Instructions

## 🎯 项目总体概述

**React 遗忘曲线智能待办清单系统** - 一个基于艾宾浩斯遗忘曲线的智能任务管理应用。

### 核心目标
用户可以创建待办任务，选择是否纳入遗忘曲线系统。系统在推荐复习日期自动提醒用户，记录完成过程中的图片，并通过折线图展示完成趋势和复习进度。

### 关键特性
- 📝 日期选择器 + 任务列表管理
- 🧠 艾宾浩斯遗忘曲线复习计划
- 📸 图片记录和压缩
- 📊 数据可视化（趋势折线图、复习进度）
- 🎨 洛克王国手游风格动效
- 📱 完全响应式设计

---

## 📦 技术栈详情

### 核心框架
- `react`: ^18.3.1
- `react-dom`: ^18.3.1
- `typescript`: ^5.5.4
- `vite`: ^5.4.3

### UI 框架与样式
- `@mui/material`: ^6.4.0
- `@mui/icons-material`: ^6.4.0
- `@emotion/react`: ^11.13.3
- `@emotion/styled`: ^11.13.0
- `sass`: ^1.83.0

### 状态管理
- `zustand`: ^4.5.5
- `immer`: ^10.1.1

### 数据存储
- `idb`: ^9.2.0（IndexedDB 封装）
- `localforage`: ^1.10.0

### 日期和时间
- `dayjs`: ^1.11.13
- `date-fns`: ^3.6.0

### 数据可视化
- `recharts`: ^2.14.4（主要用于趋势图）
- `echarts`: ^5.6.0
- `chart.js`: ^4.4.6
- `react-chartjs-2`: ^5.2.0

### 动画库
- `framer-motion`: ^11.8.0
- `react-spring`: ^9.7.4
- `animate.css`: ^4.1.1

### 图片处理
- `compressorjs`: ^1.2.1
- `html2canvas`: ^1.4.1

### 表单与验证
- `react-hook-form`: ^7.53.2
- `zod`: ^3.24.1

### 工具库
- `uuid`: ^10.0.0
- `lodash-es`: ^4.17.21
- `clsx`: ^2.1.1

---

## 🏗️ 项目结构说明

```
src/
├── components/              # 可复用 UI 组件
│   ├── DateSelector/       # ✅ 日期选择器（已完成）
│   ├── ChecklistItem/      # 清单单项
│   ├── AddTaskModal/       # 新增任务对话框（含遗忘曲线选项）
│   ├── ImageUpload/        # 图片上传组件
│   └── Charts/             # 数据可视化组件集
│
├── pages/                  # 页面级组件
│   ├── ChecklistPage.tsx   # 主清单页
│   ├── StatisticsPage.tsx  # 统计分析页
│   └── SettingsPage.tsx    # 设置页
│
├── hooks/                  # 自定义 React Hooks
│   ├── useChecklistData.ts # ✅ 清单数据管理（已完成）
│   └── useForgetCurve.ts   # ✅ 遗忘曲线管理（已完成）
│
├── store/                  # Zustand 全局状态
│   ├── checklistStore.ts   # ✅ 待办项状态（已完成）
│   └── forgetCurveStore.ts # ✅ 复习日程状态（已完成）
│
├── services/               # 业务逻辑服务层
│   └── storageService.ts   # ✅ IndexedDB 持久化（已完成）
│
├── types/                  # TypeScript 接口定义
│   └── index.ts            # ✅ 完整类型定义（已完成）
│
├── utils/                  # 工具函数库
│   ├── forgetCurveUtils.ts # ✅ 遗忘曲线算法 SM-2（已完成）
│   ├── dateUtils.ts        # ✅ 日期处理工具（已完成）
│   ├── imageUtils.ts       # ✅ 图片压缩验证（已完成）
│   └── constants.ts        # ✅ 常量定义（已完成）
│
├── assets/                 # 静态资源和样式
│   └── styles/             # ✅ SCSS 样式系统
│       ├── index.scss      # 全局样式入口
│       ├── variables.scss  # 屏幕适配变量
│       ├── functions.scss  # Sass 函数库
│       ├── mixins.scss     # 屏幕适配 Mixins
│       └── animations.scss # 动画关键帧定义
│
├── App.tsx                 # ✅ React 应用主组件
└── main.tsx                # ✅ React 入口文件
```

---

## 📐 编码规范与约定

### TypeScript 规范
- 使用 `strict: true` 严格类型检查
- 所有函数必须有类型注解和返回值类型
- 使用接口（interface）定义数据结构
- 避免使用 `any` 类型

### React 规范
- 函数式组件 + Hooks 编写
- 使用 `React.FC<Props>` 定义组件类型
- Props 始终通过接口定义
- 组件文件与样式文件同目录

### 文件命名
- 组件文件：PascalCase（如 DateSelector.tsx）
- 工具函数：camelCase（如 forgetCurveUtils.ts）
- 样式文件：lowercase + dash（如 animations.scss）
- 常量：camelCase 小写开头（如 forgetCurveIntervals）

### 导入路径
统一使用路径别名（已配置在 tsconfig.json）：
```typescript
@/          // src/
@components // src/components/
@hooks      // src/hooks/
@store      // src/store/
@utils      // src/utils/
@services   // src/services/
@types      // src/types/
@assets     // src/assets/
```

### 样式规范
- 使用 SCSS，避免 CSS-in-JS 混用
- 所有尺寸使用屏幕适配 Mixins：`@include cspx()` 或 `@include cispx()`
- 动画使用预定义的关键帧
- 颜色值使用主题变量

---

## 🔧 核心功能实现细节

### 1. 遗忘曲线算法（SM-2）
**文件**: `src/utils/forgetCurveUtils.ts`

```typescript
// 复习间隔：[0, 1, 3, 7, 15, 30] 天
// 算法基于艾宾浩斯研究和 SuperMemo 2 实现
calculateNextReviewDate(level, date)   // 计算下次复习日期
calculateEaseFactor(quality, factor)   // 更新难度系数
shouldRemindReview(schedule)            // 判断是否需要提醒
getDaysUntilNextReview(schedule)        // 计算距离天数
```

### 2. 状态管理（Zustand + Immer）
**文件**: `src/store/`

- `checklistStore.ts` - 任务列表状态
  - 方法：addItem, removeItem, updateItem, completeItem, getItemsByDate
- `forgetCurveStore.ts` - 遗忘曲线状态
  - 方法：addSchedule, updateSchedule, getSchedule, getItemsDueToday

### 3. 数据存储（IndexedDB）
**文件**: `src/services/storageService.ts`

```typescript
// 三个 Object Stores
- checklists   // 索引：date, completed
- forgetCurves // 主键：itemId
- statistics   // 索引：date
```

### 4. 屏幕适配系统
**文件**: `src/assets/styles/`

- 设计基准：1136×640px
- 竖屏使用 `vh` 单位，横屏使用 `vw` 单位
- Mixin 使用：
  ```scss
  @include cspx(padding, 20px);           // 固定尺寸
  @include cispx(font-size, 0.8, 16px);   // 动态缩放（80% 比例）
  ```

---

## 🎨 设计系统

### 动效设计（洛克王国风格）

| 动画 | 时长 | 使用场景 | 效果描述 |
|------|------|---------|--------|
| taskSlideIn | 0.3s | 任务创建 | 左侧滑入 + 旋转 + 淡入 |
| taskComplete | 0.5s | 任务完成 | 缩放 + 旋转 + 淡出 |
| taskSlideOut | 0.4s | 任务删除 | 侧滑 + 3D 旋转 + 淡出 |
| dateSwitch | 0.3s | 日期切换 | 淡入淡出过渡 |

### 色彩方案

- **主色**: `#667eea`（紫蓝）
- **辅色**: `#764ba2`（深紫）
- **背景**: 深色渐变 `#0f0f23` → `#1a1a3e`
- **文字**: 浅色 `#fff`，辅助 `rgba(255,255,255,0.6)`

---

## ✅ 功能需求清单（必查项目）

### 1 基础功能
- [ ] 日期选择器（前/后翻页，默认今天）
- [ ] 添加/删除/完成任务
- [ ] 任务优先级和分类
- [ ] 任务列表显示

### 2 遗忘曲线集成
- [ ] 创建任务时选择是否加入遗忘曲线
- [ ] 自动计算复习日期（1/3/7/15/30 天）
- [ ] 超期任务自动弹出提醒
- [ ] 用户可选择加入今日清单或跳过

### 3 图片记录
- [ ] 完成任务时上传/拍照
- [ ] 自动压缩图片
- [ ] 多张图片支持
- [ ] 缩略图预览

### 4 数据可视化
- [ ] 完成趋势折线图（日/周/月）
- [ ] 遗忘曲线复习进度图
- [ ] 完成率统计

### 5 屏幕适配
- [ ] 竖屏/横屏自适应
- [ ] 移动端优先
- [ ] 响应式布局

---

## 💻 可用资源与脚本

### npm 脚本
```bash
npm run dev          # 启动 Vite 开发服务器（http://localhost:5173）
npm run build        # 构建生产版本（dist/）
npm run preview      # 预览生产构建
npm run type-check   # TypeScript 类型检查
npm run lint         # ESLint 代码检查
npm run format       # Prettier 代码格式化
```

### 项目命令
```bash
npm install          # 安装全部依赖
npm install <pkg>    # 安装新包
npm update           # 更新依赖
```

---

## ⚠️ 重要开发规则

### 最高优先级
修改时只改指定位置，不动其他逻辑。这是最重要的要求。

### 核心约定
1. ✅ **只修改指定的地方** - 每次明确告知修改范围
2. ✅ **保护现有逻辑** - 不破坏已实现功能
3. ✅ **遵循路径别名** - 使用 @/ 等配置的别名
4. ✅ **按规范编写** - 参考已完成代码的风格
5. ✅ **类型完整性** - 新增代码必须有类型注解

### 提交前检查清单
每次修改提交前必须检查：
- ✅ 是否完成了**所有指定需求**（需要逐项确认）
- ✅ 是否保留了其他逻辑**完全不变**
- ✅ 新增类型是否添加到 `src/types/index.ts`
- ✅ 导入路径是否使用别名
- ✅ TypeScript 类型检查是否通过

---

## 📊 项目完成度

### ✅ 已完成（100%）
- 项目配置和构建工具
- TypeScript 类型定义全套
- 遗忘曲线 SM-2 算法
- 日期处理工具函数
- 图片压缩验证工具
- Zustand 状态管理
- IndexedDB 数据层
- 自定义 Hooks 集合
- SCSS 屏幕适配系统
- CSS 动画关键帧
- 项目文档

### 🟨 进行中（30%）
- [ ] ChecklistItem 组件
- [ ] AddTaskModal 组件
- [ ] ImageUpload 组件

### ❌ 待开始（0%）
- [ ] 图表组件集合
- [ ] 页面级组件
- [ ] 系统通知模块

**整体就绪度**：70% ⭐⭐⭐⭐⭐

---

## 📚 参考文档

- [项目结构详解](./PROJECT_STRUCTURE.md)
- [实现指南](./INSTRUCTIONS.md)
- [屏幕适配详情](./ADAPTION.md)
- [快速参考卡片](./QUICK_REFERENCE.md)
- [项目状态报告](./PROJECT_STATUS.md)
