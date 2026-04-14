import path from 'path'
import { pub } from '../class/public'
import { logger } from '../lib/utils'
import axios from 'axios'
import fs from 'fs'
import { ServerConfig, McpConfig } from './mcp_client'
import { getBunDownloadUrl, MCP_COMMON_SERVER_CONFIG_URL } from '../config/download_urls'

/** 环境安装下载进度 */
export interface EnvDownloadProgress {
  /** 'bun' | 'uv' */
  name: string
  total: number
  completed: number
  progress: number
  speed: number
  /** 0=未开始 1=下载中 2=解压中 3=完成 -1=失败 -2=已取消 */
  status: number
}

let envDownloadProgress: EnvDownloadProgress = {
  name: '',
  total: 0,
  completed: 0,
  progress: 0,
  speed: 0,
  status: 0,
}

/** 当前下载的 AbortController，用于中断下载 */
let currentDownloadAbort: AbortController | null = null

class McpService {
  /**
   * 获取MCP配置文件
   * @returns {McpConfig|null} - 返回MCP配置对象，如果文件不存在或解析失败则返回null
   */
  read_mcp_config(): McpConfig | null {
    const mcp_config_file = path.resolve(pub.get_data_path(), 'mcp-server.json')
    if (!pub.file_exists(mcp_config_file)) {
      let defaultConfig = {
        mcpServers: [],
      }
      pub.write_json(mcp_config_file, defaultConfig)
      logger.info(`MCP配置文件 ${mcp_config_file} 不存在，已创建默认配置文件`)
    }

    try {
      return pub.read_json(mcp_config_file)
    } catch (error) {
      logger.error(`读取 MCP 配置文件 ${mcp_config_file} 时出错:`, error)
      return null
    }
  }
  /**
   * 获取MCP服务器列表
   * @returns {ServerConfig[]} - 返回MCP服务器列表
   */
  get_mcp_servers(): ServerConfig[] {
    const mcpConfig = this.read_mcp_config()
    if (mcpConfig && mcpConfig.mcpServers) {
      return mcpConfig.mcpServers
    }
    return []
  }

  /**
   * 保存MCP配置文件
   * @param {McpConfig} mcpConfig - MCP配置对象
   */
  save_mcp_config(mcpServers: ServerConfig[]): void {
    const mcp_config_file = path.resolve(pub.get_data_path(), 'mcp-server.json')
    try {
      let mcpConfig = this.read_mcp_config()
      if (!mcpConfig) {
        mcpConfig = { mcpServers: [] }
      }
      mcpConfig.mcpServers = mcpServers
      pub.write_json(mcp_config_file, mcpConfig)
    } catch (error) {
      logger.error(`保存 MCP 配置文件 ${mcp_config_file} 时出错:`, error)
    }
  }

  /**
   * 获取常用的MCP服务器列表
   * @returns {Promise<any>} - 返回常用的MCP服务器列表
   */
  read_common_mcp_config() {
    const common_mcp_config_file = path.resolve(pub.get_data_path(), 'common-mcp-server.json')
    if (!pub.file_exists(common_mcp_config_file)) {
      return null
    }

    try {
      return pub.read_json(common_mcp_config_file)
    } catch (error) {
      logger.error(`读取常用 MCP 配置文件 ${common_mcp_config_file} 时出错:`, error)
      return null
    }
  }

  /**
   * 保存常用的MCP配置文件
   * @param {any} config - 常用MCP配置对象
   */
  save_common_mcp_config(config: any) {
    const common_mcp_config_file = path.resolve(pub.get_data_path(), 'common-mcp-server.json')
    try {
      pub.write_json(common_mcp_config_file, config)
    } catch (error) {
      logger.error(`保存常用 MCP 配置文件 ${common_mcp_config_file} 时出错:`, error)
    }
  }

  get_bin_path() {
    let binPath = path.resolve(pub.get_user_data_path(), 'bin')
    if (!pub.file_exists(binPath)) {
      pub.mkdir(binPath)
    }
    return binPath
  }

  get_bun_bin() {
    const binPath = this.get_bin_path()
    if (pub.is_windows()) {
      return path.resolve(binPath, 'bun.exe')
    }
    return path.resolve(binPath, 'bun')
  }

  get_uv_bin() {
    const binPath = this.get_bin_path()
    if (pub.is_windows()) {
      return path.resolve(binPath, 'uv.exe')
    }
    return path.resolve(binPath, 'uv')
  }

  /**
   * 获取当前操作系统的路径
   * @returns {string} - 返回当前操作系统的路径
   */
  get_os_path() {
    let os_path = 'win-'
    if (pub.is_mac()) {
      os_path = 'darwin-'
    } else if (pub.is_linux()) {
      os_path = 'linux-'
    }
    os_path += process.arch
    return os_path
  }

  async download_file(
    url: string,
    saveFile: string,
    onProgress?: (info: {
      total: number
      completed: number
      progress: number
      speed: number
    }) => void,
  ) {
    const abort = new AbortController()
    currentDownloadAbort = abort

    // 发起下载请求
    const headers: Record<string, string> = {
      'User-Agent': 'AiKnowledgeBase/' + pub.version(),
    }
    let downloadBytes = 0
    if (pub.file_exists(saveFile)) {
      const stats = pub.stat(saveFile)
      downloadBytes = stats?.size ?? 0
    }

    if (downloadBytes > 0) {
      headers['Range'] = `bytes=${downloadBytes}-`
    }
    try {
      const response = await axios({
        url: url,
        method: 'GET',
        headers: headers,
        responseType: 'stream',
        signal: abort.signal,
        maxRedirects: 5,
      })

      // 检查响应头中的Content-Length字段
      const contentLength = response.headers['content-length']
      // 检查是否已经下载完成
      if ((contentLength && downloadBytes >= parseInt(contentLength)) || response.status === 416) {
        logger.info(`文件 ${saveFile} 已经下载完成，跳过下载`)
        currentDownloadAbort = null
        return true
      }

      // 检查响应状态码
      if (response.status !== 200 && response.status !== 206) {
        logger.error(`下载文件失败，状态码: ${response.status}`)
        currentDownloadAbort = null
        return false
      }

      // content-length 是当次请求返回的数据长度（不含已下载部分）
      const totalBytes = contentLength ? parseInt(contentLength) + downloadBytes : 0
      let completedBytes = downloadBytes
      let lastSpeedTime = Date.now()
      let lastSpeedBytes = 0
      let lastSpeed = 0

      const writer = fs.createWriteStream(saveFile, { flags: 'a' })

      // 监听数据事件以跟踪进度
      response.data.on('data', (chunk: Buffer) => {
        completedBytes += chunk.length
        lastSpeedBytes += chunk.length

        // 每 0.5 秒更新一次速度
        const now = Date.now()
        const elapsed = (now - lastSpeedTime) / 1000
        if (elapsed >= 0.5) {
          lastSpeed = lastSpeedBytes / elapsed
          lastSpeedTime = now
          lastSpeedBytes = 0
        }

        // 始终回调进度（无论是否知道 total）
        if (onProgress) {
          onProgress({
            total: totalBytes,
            completed: completedBytes,
            progress: totalBytes > 0 ? Math.round((completedBytes / totalBytes) * 100) : 0,
            speed: lastSpeed,
          })
        }
      })

      response.data.pipe(writer)

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          currentDownloadAbort = null
          // 校验文件大小，防止 0 字节空文件
          const stat = pub.stat(saveFile)
          if (!stat || stat.size === 0) {
            logger.error(`下载文件为空: ${saveFile}`)
            pub.delete_file(saveFile)
            resolve(false)
          } else {
            resolve(true)
          }
        })
        writer.on('error', (error) => {
          currentDownloadAbort = null
          reject(error)
        })
      })
    } catch (e) {
      currentDownloadAbort = null
      if ((e as Error).name === 'CanceledError' || (e as Error).name === 'AbortError') {
        logger.info(`下载已取消: ${url}`)
        return 'cancelled'
      }
      if ((e as Error).message.indexOf('status code 416') !== -1) {
        logger.info(`文件 ${saveFile} 已经下载完成，跳过下载`)
        return true
      }
      logger.error(`下载文件失败: ${url}`, e)
      return false
    }
  }

  /**
   * 取消当前正在进行的下载
   */
  cancel_download() {
    if (currentDownloadAbort) {
      currentDownloadAbort.abort()
      currentDownloadAbort = null
      envDownloadProgress.status = -2
      return true
    }
    return false
  }

  /**
   * 安装 node.js环境（bun）
   */
  async install_npx() {
    const bunFile = this.get_bun_bin()
    if (pub.file_exists(bunFile)) {
      return pub.return_success(pub.lang('已安装'))
    }
    ;(global as any).bunInstall = true
    const binPath = this.get_bin_path()
    const os_path = this.get_os_path()

    const downloadUrl = getBunDownloadUrl(os_path)
    const bunzipFile = path.resolve(binPath, 'bun.zip')

    // 重置进度
    envDownloadProgress = { name: 'bun', total: 0, completed: 0, progress: 0, speed: 0, status: 1 }

    const downloaded = await this.download_file(downloadUrl, bunzipFile, (info) => {
      envDownloadProgress.total = info.total
      envDownloadProgress.completed = info.completed
      envDownloadProgress.progress = info.progress
      envDownloadProgress.speed = info.speed
      envDownloadProgress.status = 1
    })

    if (downloaded === 'cancelled') {
      envDownloadProgress.status = -2
      ;(global as any).bunInstall = false
      return pub.return_error(pub.lang('下载已取消'))
    }

    if (!downloaded) {
      envDownloadProgress.status = -1
      ;(global as any).bunInstall = false
      return pub.return_error(pub.lang('下载失败'))
    }

    // 解压缩
    envDownloadProgress.status = 2
    const unzip = await import('unzipper')
    const unzipStream = fs.createReadStream(bunzipFile).pipe(unzip.Extract({ path: binPath }))
    return new Promise((resolve, reject) => {
      unzipStream.on('close', () => {
        pub.delete_file(bunzipFile)

        // bun 的 zip 解压后文件在子目录中（如 bun-windows-x64/bun.exe）
        // 需要将可执行文件移动到 binPath 根目录
        if (!pub.file_exists(bunFile)) {
          const bunFileName = path.basename(bunFile) // bun.exe or bun
          // 在 binPath 下查找子目录中的 bun 可执行文件
          const entries = fs.readdirSync(binPath, { withFileTypes: true })
          for (const entry of entries) {
            if (entry.isDirectory() && entry.name.startsWith('bun')) {
              const nestedBun = path.resolve(binPath, entry.name, bunFileName)
              if (pub.file_exists(nestedBun)) {
                fs.renameSync(nestedBun, bunFile)
                // 清理空子目录
                try {
                  fs.rmSync(path.resolve(binPath, entry.name), { recursive: true })
                } catch { /* ignore */ }
                break
              }
            }
          }
        }

        if (pub.file_exists(bunFile)) {
          if (pub.is_linux() || pub.is_mac()) {
            fs.chmodSync(bunFile, 0o755)
          }
          envDownloadProgress.status = 3
          envDownloadProgress.progress = 100
          ;(global as any).bunInstall = false
          resolve(pub.return_success(pub.lang('安装成功')))
        } else {
          envDownloadProgress.status = -1
          ;(global as any).bunInstall = false
          reject(pub.return_error(pub.lang('安装失败')))
        }
      })
      unzipStream.on('error', (error: any) => {
        envDownloadProgress.status = -1
        ;(global as any).bunInstall = false
        reject(pub.return_error(pub.lang('安装失败'), error))
      })
    })
  }

  /**
   * 获取环境安装下载进度
   */
  get_env_install_progress(): EnvDownloadProgress {
    return { ...envDownloadProgress }
  }

  /**
   * 清除node.js环境变量
   * @returns {void}
   */
  clear_node_env() {
    const env = process.env
    const PATH_ARR = (env['PATH'] ?? '').split(';')
    const NEW_PATH_ARR = []
    for (const key in PATH_ARR) {
      if (PATH_ARR[key].indexOf('node') == -1 && PATH_ARR[key].indexOf('npm') == -1) {
        NEW_PATH_ARR.push(PATH_ARR[key])
      }
    }
    process.env['PATH'] = NEW_PATH_ARR.join(';')
  }

  /**
   * 保存 MCP 工具列表
   * @param name {string} - 工具名称
   * @param tools {any} - 工具列表
   * @returns
   */
  save_mcp_tools(name: string, tools: any) {
    const mcpToolsSavePath = path.resolve(pub.get_data_path(), 'mcp_tools')
    if (!pub.file_exists(mcpToolsSavePath)) {
      pub.mkdir(mcpToolsSavePath)
    }
    const mcpToolsFile = path.resolve(mcpToolsSavePath, `${name}.json`)
    try {
      pub.write_json(mcpToolsFile, tools)
    } catch (e) {
      logger.error(`保存 MCP 工具文件 ${mcpToolsFile} 时出错:`, e)
    }
  }

  /**
   * 读取 MCP 工具列表
   * @param name {string} - 工具名称
   * @returns
   */
  read_mcp_tools(name: string) {
    const mcpToolsSavePath = path.resolve(pub.get_data_path(), 'mcp_tools')
    if (!pub.file_exists(mcpToolsSavePath)) {
      return []
    }
    const mcpToolsFile = path.resolve(mcpToolsSavePath, `${name}.json`)
    if (!pub.file_exists(mcpToolsFile)) {
      return []
    }
    try {
      return pub.read_json(mcpToolsFile)
    } catch (e) {
      logger.error(`读取 MCP 工具文件 ${mcpToolsFile} 时出错:`, e)
      return []
    }
  }

  /**
   * 同步云端的 MCP 服务器配置
   * @returns {Promise<any>} - 返回同步结果
   */
  async sync_cloud_mcp() {
    const downloadUrl = MCP_COMMON_SERVER_CONFIG_URL
    const res = await pub.httpRequest(downloadUrl)

    if (res.statusCode !== 200) {
      return pub.return_error(pub.lang('获取失败'))
    }

    let commonMcpConfig = res.body
    if (typeof commonMcpConfig === 'string') {
      commonMcpConfig = JSON.parse(commonMcpConfig)
    }
    if (!commonMcpConfig.mcpServers) {
      return pub.return_error(pub.lang('配置文件格式错误'))
    }
    mcpService.save_common_mcp_config(commonMcpConfig)
    return pub.return_success(pub.lang('同步成功'))
  }
}

/**
 * 重写 McpService 类的 toString 方法，方便调试和日志输出
 * @returns {string} - 类的字符串表示
 */
McpService.toString = () => '[class McpService]'

/**
 * 导出 McpService 类的单例实例
 */
export const mcpService = new McpService()
