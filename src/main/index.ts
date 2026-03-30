import { app, BrowserWindow, shell } from 'electron'
import { fileURLToPath } from 'node:url'
import { registerIpcHandlers } from './ipc-register'
import { autoUpdaterService } from './service/os/auto_updater'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ============ 路径常量 ============
process.env.APP_ROOT = path.join(__dirname, '..') // 项目根目录
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

// ============ 窗口大小记忆 ============
// 对应原 lifecycle.ts 的 WindowSize
const windowSize: { size?: number[]; position?: number[] } = {}

let win: BrowserWindow | null = null

function createWindow() {
  win = new BrowserWindow({
    title: 'AiKnowledgeBase',
    width: 1440,
    height: 900,
    minWidth: 500,
    minHeight: 300,
    frame: true,
    show: false, // 先隐藏，ready-to-show 再显示，避免白屏
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true, // 安全：开启上下文隔离
      nodeIntegration: false, // 安全：renderer 不直接用 Node
    },
  })

  win.setMenu(null)
  win.once('ready-to-show', () => {
    win?.show()
    win?.focus()
  })

  win.on('resize', () => {
    if (!win || win.isFullScreen() || win.isMaximized() || win.isMinimized()) return
    windowSize.size = win.getSize()
    windowSize.position = win.getPosition()
  })

  // 拦截外部链接
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  // 拦截页面内导航
  win.webContents.on('will-navigate', (event, url) => {
    event.preventDefault()
    shell.openExternal(url)
  })

  // 加载页面
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// ============ 应用生命周期 ============

// 单实例锁
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })

  app.whenReady().then(() => {
    createWindow()
    registerIpcHandlers()
    // 生产环境启动自动更新
    if (app.isPackaged) {
      autoUpdaterService.create()
    }
  })
}

// macOS: 点 Dock 图标重建窗口
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// 退出前保存窗口大小
app.on('before-quit', () => {
  // TODO: 调用 pub.C('window', windowSize) 保存窗口位置
  console.log('[lifecycle] before-quit, window size:', windowSize)
})

// 非 macOS：所有窗口关闭时退出
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})
