import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography
} from '@mui/material'
import { Save as SaveIcon } from '@mui/icons-material'

interface SettingsPageProps {
  onBack?: () => void
}

export function SettingsPage({ onBack }: SettingsPageProps) {
  const [preferences, setPreferences] = useState({
    theme: 'light' as 'light' | 'dark',
    language: 'zh' as 'zh' | 'en',
    notificationsEnabled: true,
    autoCompleteOnReminder: false,
    forgetCurveEnabled: true
  })
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    localStorage.setItem('userPreferences', JSON.stringify(preferences))
    setSaved(true)
    window.setTimeout(() => setSaved(false), 3000)
  }

  return (
    <Box className="settings-page" sx={{ height: '100%', overflowY: 'auto', pr: 1 }}>
      <Box className="settings-page__header" sx={{ mb: 3 }}>
        {onBack && (
          <Button variant="outlined" size="small" sx={{ mb: 2 }} onClick={onBack}>
            返回任务页
          </Button>
        )}
        <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
          偏好设置
        </Typography>
        <Typography variant="body2" color="text.secondary">
          这里保留全局偏好和数据管理入口。
        </Typography>
      </Box>

      {saved && (
        <Alert severity="success" sx={{ mb: 2 }}>
          设置已保存
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            外观设置
          </Typography>
          <Stack spacing={2}>
            <FormControl fullWidth>
              <InputLabel>主题</InputLabel>
              <Select
                value={preferences.theme}
                label="主题"
                onChange={(event) =>
                  setPreferences((prev) => ({ ...prev, theme: event.target.value as 'light' | 'dark' }))
                }
              >
                <MenuItem value="light">浅色</MenuItem>
                <MenuItem value="dark">深色</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>语言</InputLabel>
              <Select
                value={preferences.language}
                label="语言"
                onChange={(event) =>
                  setPreferences((prev) => ({ ...prev, language: event.target.value as 'zh' | 'en' }))
                }
              >
                <MenuItem value="zh">中文</MenuItem>
                <MenuItem value="en">英文</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            功能设置
          </Typography>
          <Stack spacing={1}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={preferences.notificationsEnabled}
                  onChange={(event) =>
                    setPreferences((prev) => ({ ...prev, notificationsEnabled: event.target.checked }))
                  }
                />
              }
              label="启用通知提醒"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={preferences.autoCompleteOnReminder}
                  onChange={(event) =>
                    setPreferences((prev) => ({ ...prev, autoCompleteOnReminder: event.target.checked }))
                  }
                />
              }
              label="提醒时自动完成"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={preferences.forgetCurveEnabled}
                  onChange={(event) =>
                    setPreferences((prev) => ({ ...prev, forgetCurveEnabled: event.target.checked }))
                  }
                />
              }
              label="启用遗忘曲线复习"
            />
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            数据管理
          </Typography>
          <Stack spacing={1}>
            <Button variant="outlined" fullWidth>
              导出数据
            </Button>
            <Button variant="outlined" fullWidth>
              导入数据
            </Button>
            <Button variant="outlined" color="error" fullWidth>
              清空所有数据
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} fullWidth size="large">
        保存设置
      </Button>
    </Box>
  )
}
