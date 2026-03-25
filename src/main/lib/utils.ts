import { app, BrowserWindow } from 'electron'
import path from 'node:path'

// ============ Logger ============
export const logger = {
  info: (...args: any[]) => console.log('[INFO]', ...args),
  warn: (...args: any[]) => console.warn('[WARN]', ...args),
  error: (...args: any[]) => console.error('[ERROR]', ...args),
  debug: (...args: any[]) => console.debug('[DEBUG]', ...args),
}

// ============ 路径工具 ============

/** 应用根目录（开发时是项目根，生产时是 app.asar 所在目录） */
export function getRootDir(): string {
  return app.isPackaged ? path.dirname(app.getPath('exe')) : path.join(__dirname, '..')
}

/** 应用基础目录（用户数据目录） */
export function getBaseDir(): string {
  return app.getPath('userData')
}

/** extraResources 目录 */
export function getExtraResourcesDir(): string {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'extraResources')
    : path.join(getRootDir(), 'build', 'extraResources')
}

/** 应用版本 */
export function appVersion(): string {
  return app.getVersion()
}

// ============ 窗口工具 ============

export function getMainWindow(): BrowserWindow {
  const wins = BrowserWindow.getAllWindows()
  if (wins.length === 0) {
    throw new Error('No main window found')
  }
  return wins[0]
}

// ============ 环境判断 ============
export function isProd(): boolean {
  return app.isPackaged
}

export function isDev(): boolean {
  return !app.isPackaged
}

// ============ 配置工具 ============

/** 应用配置类型（替代 ee-core/config 的 AppConfig） */
export type AppConfig = Record<string, any>

/** 读取配置（替代 ee-core getConfig） */
export function getConfig(): AppConfig {
  // TODO: 读取真正的配置文件，目前返回空对象占位
  return {}
}

/** 判断协议是否为 file:// */
export function isFileProtocol(protocol: string): boolean {
  return protocol === 'file://' || protocol === 'file:'
}

// ============ 关闭行为管理 ============
let _closeAndQuit = false

export function getCloseAndQuit(): boolean {
  return _closeAndQuit
}

export function setCloseAndQuit(val: boolean): void {
  _closeAndQuit = val
}
