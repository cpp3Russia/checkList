# 项目结构说明

## 目录树

```
项目测试/
├── 根目录配置文件
│   ├── package.json           # 项目依赖配置
│   ├── vite.config.ts         # Vite 构建配置
│   ├── tsconfig.json          # TypeScript 编译配置
│   ├── tsconfig.node.json     # Node 部分 TypeScript 配置
│   ├── index.html             # HTML 入口
│   ├── .gitignore             # Git 忽略文件
│   └── adaption.config.js     # 屏幕适配配置
│
├── docs/                      # 📚 文档目录
│   ├── PROJECT_STATUS.md
│   ├── PROJECT_DELIVERY.md
│   ├── SETUP_GUIDE.md
│   ├── QUICK_REFERENCE.md
│   ├── DEPENDENCIES.md
│   ├── ADAPTION.md
│   ├── INSTRUCTIONS.md
│   └── README.md
│
├── public/                    # 🌐 静态资源
│   ├── icons/
│   ├── images/
│   └── fonts/
│
├── src/                       # 💻 源代码主目录
│   ├── main.tsx              # React 入口文件
│   ├── App.tsx               # 主应用组件
│   ├── App.scss              # 主应用样式
│   │
│   ├── components/            # 🧩 可复用组件
│   │   ├── DateSelector/           # 日期选择器
│   │   │   ├── DateSelector.tsx
│   │   │   └── DateSelector.scss
│   │   ├── ChecklistItem/          # 清单项目
│   │   │   ├── ChecklistItem.tsx
│   │   │   └── ChecklistItem.scss
│   │   ├── AddTaskModal/           # 添加任务模态框
│   │   ├── ImageUpload/            # 图片上传组件
│   │   └── Charts/                 # 图表组件
│   │
│   ├── pages/                 # 📄 页面级组件
│   │   ├── ChecklistPage/
│   │   ├── StatisticsPage/
│   │   └── SettingsPage/
│   │
│   ├── hooks/                 # 🎣 自定义 Hooks
│   │   ├── useChecklistData.ts
│   │   └── useForgetCurve.ts
│   │
│   ├── store/                 # 🗄️ 状态管理 (Zustand)
│   │   ├── checklistStore.ts
│   │   └── forgetCurveStore.ts
│   │
│   ├── services/              # 🔧 服务层
│   │   └── storageService.ts  # IndexedDB 持久化
│   │
│   ├── types/                 # 📝 TypeScript 类型定义
│   │   └── index.ts
│   │
│   ├── utils/                 # 🛠️ 工具函数
│   │   ├── forgetCurveUtils.ts      # 遗忘曲线算法
│   │   ├── dateUtils.ts            # 日期处理工具
│   │   ├── imageUtils.ts           # 图片处理工具
│   │   └── constants.ts            # 常量定义
│   │
│   └── assets/                # 🎨 静态资源和样式
│       ├── styles/
│       │   ├── index.scss     # 全局样式入口
│       │   ├── variables.scss # Sass 变量
│       │   ├── mixins.scss    # Sass mixins
│       │   ├── functions.scss # Sass 函数
│       │   └── animations.scss # 动画定义
│       ├── icons/
│       └── images/
```

## 文件用途说明

### 🔧 配置文件
- **package.json** - 32 个依赖包配置，包含所有生产和开发依赖
- **vite.config.ts** - Vite 构建配置，路径别名，SCSS 预处理
- **tsconfig.json** - TypeScript 编译选项，路径别名
- **index.html** - React 应用的 HTML 入口点

### 📚 核心模块

#### 状态管理 (store/)
- `checklistStore.ts` - 待办事项状态（Zustand + Immer）
- `forgetCurveStore.ts` - 遗忘曲线日程状态

#### 业务逻辑 (hooks/)
- `useChecklistData.ts` - 清单数据 CRUD 操作 Hook
- `useForgetCurve.ts` - 遗忘曲线复习 Hook

#### 工具函数 (utils/)
- `forgetCurveUtils.ts` - SM-2 算法实现（1/3/7/15/30 天间隔）
- `dateUtils.ts` - 日期处理（Day.js 包装）
- `imageUtils.ts` - 图片压缩、验证、转 Base64
- `constants.ts` - 常量定义

#### 服务层 (services/)
- `storageService.ts` - IndexedDB 单例，3 个 object stores

#### 类型定义 (types/)
- `index.ts` - 所有 TypeScript 接口定义

#### UI 组件 (components/)
- `DateSelector/` - 日期选择器组件（已完成）
- `ChecklistItem/` - 清单项目组件（待开发）
- `AddTaskModal/` - 添加任务模态框（待开发）
- `ImageUpload/` - 图片上传组件（待开发）
- `Charts/` - 图表组件集（待开发）

### 🎨 样式系统 (assets/styles/)
- **index.scss** - 全局样式，HTML/body 基础设置
- **variables.scss** - UI 宽度/高度常量（1136×640）
- **functions.scss** - Sass 函数（px2vh、px2vw）
- **mixins.scss** - Sass mixins（cspx、cispx 屏幕自适应）
- **animations.scss** - 10+ 个 CSS 动画关键帧

## 屏幕适配系统

基于 1136×640 设计canvas，支持多设备自适应：

```scss
@include cspx(padding, 20px);      // 竖屏用 vh，横屏用 vw
@include cispx(font-size, 0.8, 16px); // 动态缩放（比例 0.8）
```

## 核心功能实现

### 1. 遗忘曲线算法
- SM-2 算法实现
- 5 级复习间隔：1、3、7、15、30 天
- 自动推荐复习日期
- 复习进度跟踪

### 2. 数据持久化
- IndexedDB 离线存储
- 3 个对象存储：checklists、forgetCurves、statistics
- 日期和完成状态索引

### 3. 图片处理
- 自动压缩（最大 10MB）
- 支持格式：JPEG/PNG/WebP/GIF
- 缩略图生成
- Base64 编码存储

### 4. 动画系统
- 任务滑入动画 (0.3s)
- 任务完成动画 (0.5s)
- 日期切换动画 (0.3s)
- 脉冲、旋转等辅助动画

## 导入路径别名

项目配置了路径别名，方便导入：

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

使用示例：
```typescript
import { useChecklistData } from '@/hooks/useChecklistData'
import { storageService } from '@/services/storageService'
import type { ChecklistItem } from '@/types'
```

## 下一步开发

1. ✅ 项目结构和配置 - **完成**
2. ✅ 核心工具和 Hooks - **完成**
3. 🟨 UI 组件开发 - 进行中
   - [ ] ChecklistItem 组件
   - [ ] AddTaskModal 组件
   - [ ] ImageUpload 组件
   - [ ] 图表组件集
4. [ ] 页面级组件
   - [ ] ChecklistPage
   - [ ] StatisticsPage
   - [ ] SettingsPage
5. [ ] 集成测试和优化
6. [ ] 构建和部署

