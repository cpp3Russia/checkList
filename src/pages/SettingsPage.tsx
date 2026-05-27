import { useState } from 'react'
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Alert
} from '@mui/material'
import { Save as SaveIcon } from '@mui/icons-material'

export function SettingsPage() {
  const [preferences, setPreferences] = useState({
    theme: 'light' as 'light' | 'dark',
    language: 'zh' as 'zh' | 'en',
    notificationsEnabled: true,
    autoCompleteOnReminder: false,
    forgetCurveEnabled: true
  })

  const [saved, setSaved] = useState(false)

  const handleThemeChange = (e: any) => {
    setPreferences(prev => ({
      ...prev,
      theme: e.target.value
    }))
    setSaved(false)
  }

  const handleLanguageChange = (e: any) => {
    setPreferences(prev => ({
      ...prev,
      language: e.target.value
    }))
    setSaved(false)
  }

  const handleNotificationsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPreferences(prev => ({
      ...prev,
      notificationsEnabled: e.target.checked
    }))
    setSaved(false)
  }

  const handleAutoCompleteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPreferences(prev => ({
      ...prev,
      autoCompleteOnReminder: e.target.checked
    }))
    setSaved(false)
  }

  const handleForgetCurveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPreferences(prev => ({
      ...prev,
      forgetCurveEnabled: e.target.checked
    }))
    setSaved(false)
  }

  const handleSave = async () => {
    try {
      // 保存设置到本地存储或后端
      localStorage.setItem('userPreferences', JSON.stringify(preferences))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error('保存设置失败:', err)
    }
  }

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      {/* 页面标题 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
          设置
        </Typography>
        <Typography variant="body2" color="text.secondary">
          配置应用的个性化设置
        </Typography>
      </Box>

      {/* 保存成功提示 */}
      {saved && (
        <Alert severity="success" sx={{ mb: 2 }}>
          设置已保存
        </Alert>
      )}

      {/* 外观设置 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            外观设置
          </Typography>

          <Stack spacing={2}>
            {/* 主题 */}
            <FormControl fullWidth>
              <InputLabel>主题</InputLabel>
              <Select
                value={preferences.theme}
                label="主题"
                onChange={handleThemeChange}
              >
                <MenuItem value="light">浅色</MenuItem>
                <MenuItem value="dark">深色</MenuItem>
              </Select>
            </FormControl>

            {/* 语言 */}
            <FormControl fullWidth>
              <InputLabel>语言</InputLabel>
              <Select
                value={preferences.language}
                label="语言"
                onChange={handleLanguageChange}
              >
                <MenuItem value="zh">中文</MenuItem>
                <MenuItem value="en">English</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </CardContent>
      </Card>

      {/* 功能设置 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            功能设置
          </Typography>

          <Stack spacing={1}>
            {/* 通知开关 */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={preferences.notificationsEnabled}
                  onChange={handleNotificationsChange}
                />
              }
              label="启用通知提醒"
            />

            {/* 自动完成开关 */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={preferences.autoCompleteOnReminder}
                  onChange={handleAutoCompleteChange}
                />
              }
              label="提醒时自动标记为已完成"
            />

            {/* 遗忘曲线开关 */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={preferences.forgetCurveEnabled}
                  onChange={handleForgetCurveChange}
                />
              }
              label="启用遗忘曲线复习"
            />
          </Stack>
        </CardContent>
      </Card>

      {/* 数据管理 */}
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

      {/* 关于 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            关于应用
          </Typography>

          <Stack spacing={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary">应用版本</Typography>
              <Typography>1.0.0</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary">更新日期</Typography>
              <Typography>2026-05-25</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary">构建信息</Typography>
              <Typography>React 18 + Vite</Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* 保存按钮 */}
      <Button
        variant="contained"
        startIcon={<SaveIcon />}
        onClick={handleSave}
        fullWidth
        size="large"
      >
        保存设置
      </Button>
    </Container>
  )
}
