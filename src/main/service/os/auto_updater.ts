import { app as electronApp } from 'electron'
import { autoUpdater } from 'electron-updater'
import { logger, getMainWindow } from '../../lib/utils'
import { pub } from '../../class/public'

/**
 * AutoUpdaterService class for automatic updates
 */
class AutoUpdaterService {
  private config: {
    windows: boolean
    macOS: boolean
    linux: boolean
    options: any
    force: boolean
  }
  constructor() {
    this.config = {
      windows: true,
      macOS: true,
      linux: true,
      options: {
        provider: 'generic',
        url: 'https://aingdesk.bt.cn/',
      },
      force: true,
    }
  }

  create() {
    logger.info('[autoUpdater] load')
    const cfg = this.config
    if (
      (process.platform === 'win32' && cfg.windows) ||
      (process.platform === 'darwin' && cfg.macOS) ||
      (process.platform === 'linux' && cfg.linux)
    ) {
      // continue
    } else {
      return
    }

    // 是否检查更新
    if (cfg.force) {
      this.checkUpdate()
    }

    const status = {
      error: -1,
      available: 1,
      noAvailable: 2,
      downloading: 3,
      downloaded: 4,
    }

    const version = electronApp.getVersion()
    logger.info('[autoUpdater] current version: ', version)

    // 设置下载服务器地址
    let server = cfg.options.url
    let lastChar = server.substring(server.length - 1)
    server = lastChar === '/' ? server : server + '/'
    logger.info('[autoUpdater] server: ', server)
    cfg.options.url = server

    // 强制执行开发更新
    autoUpdater.forceDevUpdateConfig = true

    // 是否后台自动下载
    autoUpdater.autoDownload = cfg.force ? true : false

    try {
      autoUpdater.setFeedURL(cfg.options)
    } catch (error) {
      logger.error('[autoUpdater] setFeedURL error : ', error)
    }

    autoUpdater.on('checking-for-update', () => {
      this.sendStatusToWindow(pub.lang('正在检查更新...'))
    })
    autoUpdater.on('update-available', (info: any) => {
      this.sendStatusToWindow(info)
    })
    autoUpdater.on('update-not-available', (info: any) => {
      this.sendStatusToWindow(info)
    })
    autoUpdater.on('error', (err: any) => {
      let info = {
        status: status.error,
        desc: err,
      }
      this.sendStatusToWindow(info)
    })
    autoUpdater.on('download-progress', (progressObj: any) => {
      let percentNumber = progressObj.percent
      let totalSize = this.bytesChange(progressObj.total)
      let transferredSize = this.bytesChange(progressObj.transferred)
      let text = pub.lang('已下载 ') + percentNumber + '%'
      text = text + ' (' + transferredSize + '/' + totalSize + ')'

      let info = {
        status: status.downloading,
        desc: text,
        percentNumber: percentNumber,
        totalSize: totalSize,
        transferredSize: transferredSize,
      }
      logger.info('[addon:autoUpdater] progress: ', text)
      this.sendStatusToWindow(info)
    })
    autoUpdater.on('update-downloaded', (info: any) => {
      this.sendStatusToWindow(info)
      // setCloseAndQuit — 用原生 app.quit() 替代
      autoUpdater.quitAndInstall()
    })
  }

  /**
   * 检查更新
   */
  checkUpdate() {
    autoUpdater.checkForUpdates()
  }

  /**
   * 下载更新
   */
  download() {
    autoUpdater.downloadUpdate()
  }

  /**
   * 向前端发消息
   */
  sendStatusToWindow(content: any = {}): void {
    const textJson = JSON.stringify(content)
    const channel = 'custom/app/updater'
    const win = getMainWindow()
    logger.info('[addon:autoUpdater] sendStatusToWindow: ', textJson)
    win.webContents.send(channel, textJson)
  }
  /**
   * 单位转换
   */
  bytesChange(limit: number) {
    let size = ''
    if (limit < 0.1 * 1024) {
      size = limit.toFixed(2) + 'B'
    } else if (limit < 0.1 * 1024 * 1024) {
      size = (limit / 1024).toFixed(2) + 'KB'
    } else if (limit < 0.1 * 1024 * 1024 * 1024) {
      size = (limit / (1024 * 1024)).toFixed(2) + 'MB'
    } else {
      size = (limit / (1024 * 1024 * 1024)).toFixed(2) + 'GB'
    }

    let sizeStr = size + ''
    let index = sizeStr.indexOf('.')
    let dou = sizeStr.substring(index + 1, index + 3)
    if (dou == '00') {
      return sizeStr.substring(0, index) + sizeStr.substring(index + 3, index + 5)
    }

    return size
  }
}
AutoUpdaterService.toString = () => '[class AutoUpdaterService]'
const autoUpdaterService = new AutoUpdaterService()

export { AutoUpdaterService, autoUpdaterService }
