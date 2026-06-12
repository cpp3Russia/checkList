export type TaskScope = 'daily' | 'master'

export interface ChecklistItem {
  id: string
  title: string
  description?: string
  date: Date
  reviewOccurrenceDate?: Date
  sortOrder?: number
  completed: boolean
  inForgetCurve: boolean
  images: string[]
  priority: 'low' | 'medium' | 'high'
  category?: string
  project?: string
  tags?: string[]
  taskScope?: TaskScope
  createdAt: Date
  completedAt?: Date
  completedDurationMs?: number
  forgetCurveData?: ForgetCurveSchedule
  reviewHistory?: ReviewHistoryEntry[]
  isReviewInstance?: boolean
  isReviewHistoryEntry?: boolean
  reviewSourceItemId?: string
}

export interface ReviewHistoryEntry {
  id: string
  occurrenceDate: Date
  completedAt: Date
  completedDurationMs?: number
}

export interface ForgetCurveSchedule {
  level: number
  nextReviewDate: Date
  easeFactor: number
  interval: number
  lastReviewDate: Date
  reviewCount: number
}

export interface StatisticsData {
  date: Date
  totalCount: number
  completedCount: number
  completionRate: number
  averageCompletionTime?: number
}

export interface ChartData {
  date: string
  value: number
  [key: string]: any
}

export interface UserPreferences {
  theme: 'light' | 'dark'
  language: 'zh' | 'en'
  notificationsEnabled: boolean
  autoCompleteOnReminder: boolean
  forgetCurveEnabled: boolean
}

export interface Notification {
  id: string
  type: 'reminder' | 'success' | 'error' | 'info'
  title: string
  message: string
  timestamp: Date
  taskId?: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  timestamp: Date
}
