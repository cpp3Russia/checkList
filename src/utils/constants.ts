export const PRIORITY_LEVELS = {
  low: { label: 'Low', color: '#3f51b5', value: 'low' },
  medium: { label: 'Medium', color: '#ff9800', value: 'medium' },
  high: { label: 'High', color: '#f44336', value: 'high' }
} as const

export const TASK_CATEGORIES = [
  { id: 'work', label: 'Work', color: '#2196f3' },
  { id: 'study', label: 'Study', color: '#4caf50' },
  { id: 'life', label: 'Life', color: '#ff9800' },
  { id: 'health', label: 'Health', color: '#e91e63' },
  { id: 'other', label: 'Other', color: '#9c27b0' }
] as const

export const FORGET_CURVE_LEVELS = [
  { level: 0, label: 'New', days: 0 },
  { level: 1, label: 'Review 1', days: 1 },
  { level: 2, label: 'Review 2', days: 3 },
  { level: 3, label: 'Review 3', days: 7 },
  { level: 4, label: 'Review 4', days: 15 },
  { level: 5, label: 'Review 5', days: 30 }
] as const

export const CHART_COLORS = {
  primary: '#667eea',
  secondary: '#764ba2',
  success: '#4caf50',
  danger: '#f44336',
  warning: '#ff9800',
  info: '#2196f3'
} as const

export const ANIMATION_DURATION = {
  fast: 200,
  normal: 300,
  slow: 500
} as const

export const STORAGE_KEYS = {
  CHECKLISTS: 'checklists',
  FORGET_CURVES: 'forgetCurves',
  STATISTICS: 'statistics',
  USER_PREFERENCES: 'userPreferences',
  LAST_SYNC: 'lastSync'
} as const

export const ROUTES = {
  CHECKLIST: '/',
  STATISTICS: '/statistics',
  SETTINGS: '/settings'
} as const

export const ERROR_MESSAGES = {
  STORAGE_INIT_FAILED: 'Storage initialization failed',
  SAVE_FAILED: 'Save failed',
  DELETE_FAILED: 'Delete failed',
  LOAD_FAILED: 'Load failed',
  IMAGE_UPLOAD_FAILED: 'Image upload failed',
  INVALID_INPUT: 'Invalid input'
} as const

export const SUCCESS_MESSAGES = {
  ADDED: 'Added successfully',
  UPDATED: 'Updated successfully',
  DELETED: 'Deleted successfully',
  COMPLETED: 'Completed successfully',
  IMAGE_UPLOADED: 'Image uploaded successfully'
} as const
