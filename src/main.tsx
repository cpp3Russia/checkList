import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { storageService } from './services/storageService'
import '@/assets/styles/index.scss'

// 初始化存储服务
storageService.init().catch(err => {
  console.error('Failed to initialize storage service:', err)
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
