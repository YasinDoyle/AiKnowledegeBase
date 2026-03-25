import { pub } from '../class/public'
import { OllamaService } from '../service/ollama'
import * as os from 'os'
import { logger } from '../lib/utils'
const { execSync } = require('child_process')
const iconv = require('iconv-lite')

/**
 * manager controller 类，负责管理模型和系统配置信息
 * @class
 */
class ManagerController {
  /**
   * 获取模型管理器信息
   * @returns {Promise<any>} - 包含模型管理器信息的成功响应
   */
  async get_model_manager(): Promise<any> {
    // 创建 OllamaService 实例
    const ollamaService = new OllamaService()
    // 获取 Ollama 版本信息
    const version = await ollamaService.version()
    if (version) {
      // 检查服务是否启动
      if (!(await ollamaService.is_running())) {
        logger.warn(pub.lang('Ollama 服务未启动，正在尝试启动...'))
        if (!(await ollamaService.start())) {
          logger.warn(pub.lang('Ollama 服务启动失败'))
        }
      }
    }

    // 构建模型管理器信息对象
    const modelManager = {
      manager_name: 'ollama',
      version,
      models: await ollamaService.model_list(),
      status: version.length > 0,
      ollama_host: pub.get_ollama_host(),
    }
    // 返回成功响应
    return pub.return_success(pub.lang('模型管理器信息获取成功'), modelManager)
  }

  /**
   * 安装模型
   * @param {Object} args - 安装模型所需的参数
   * @param {string} args.model - 模型名称
   * @param {string} args.parameters - 模型参数
   * @returns {Promise<any>} - 包含安装结果的成功响应
   */
  async install_model(args: { model: string; parameters: string }): Promise<any> {
    const { model, parameters } = args
    const ollamaService = new OllamaService()
    // 调用 OllamaService 的 install_model 方法安装模型
    const res = await ollamaService.install_model(model, parameters)
    return pub.return_success(pub.lang('安装成功'), res)
  }

  /**
   * 获取模型安装进度
   * @param {Object} args - 获取安装进度所需的参数
   * @param {string} args.model - 模型名称
   * @param {string} args.parameters - 模型参数
   * @returns {Promise<any>} - 包含安装进度信息的成功响应
   */
  async get_model_install_progress(args: { model: string; parameters: string }): Promise<any> {
    const { model, parameters } = args
    const ollamaService = new OllamaService()
    // 调用 OllamaService 的 get_model_install_progress 方法获取安装进度
    const res = await ollamaService.get_model_install_progress(model, parameters)
    return pub.return_success(pub.lang('获取安装进度成功'), res)
  }

  /**
   * 删除模型
   * @param {Object} args - 删除模型所需的参数
   * @param {string} args.model - 模型名称
   * @param {string} args.parameters - 模型参数
   * @returns {Promise<any>} - 包含删除结果的成功响应
   */
  async remove_model(args: any): Promise<any> {
    const { model, parameters } = args
    const ollamaService = new OllamaService()
    // 调用 OllamaService 的 remove_model 方法删除模型
    const res = await ollamaService.remove_model(model, parameters)
    return pub.return_success(pub.lang('删除成功'), res)
  }

  /**
   * 安装模型管理器
   * @param {Object} args - 安装模型管理器所需的参数
   * @param {string} args.manager_name - 模型管理器名称
   * @returns {Promise<any>} - 包含安装状态的响应
   */
  async install_model_manager(args: { manager_name: string; models_path?: string }): Promise<any> {
    const { manager_name, models_path } = args
    // 检查是否支持该模型管理器
    if (manager_name !== 'ollama') {
      return pub.return_error(pub.lang('不支持的管理器'), '')
    }
    const ollamaService = new OllamaService()

    if (models_path && models_path.length > 0) {
      if (!pub.file_exists(models_path)) {
        return pub.return_error(pub.lang('指定模型存储路径不存在'), '')
      }
      ollamaService.set_ollama_model_save_path(models_path)
    }

    // 调用 OllamaService 的 install_ollama 方法安装 Ollama
    const res = await ollamaService.install_ollama()

    return pub.return_success(pub.lang('正在安装,请稍后...'), res)
  }

  /**
   * 获取模型管理器安装进度
   * @param {Object} args - 获取安装进度所需的参数
   * @param {string} args.manager_name - 模型管理器名称
   * @returns {Promise<any>} - 包含安装进度信息的成功响应
   */
  async get_model_manager_install_progress(args: { manager_name: string }): Promise<any> {
    const { manager_name } = args
    // 检查是否支持该模型管理器
    if (manager_name !== 'ollama') {
      return pub.return_error(pub.lang('不支持的管理器'), '')
    }
    const ollamaService = new OllamaService()
    // 调用 OllamaService 的 get_ollama_install_progress 方法获取安装进度
    const res = await ollamaService.get_ollama_install_progress()
    return pub.return_success(pub.lang('获取安装进度成功'), res)
  }

  /**
   * 获取电脑配置信息
   * @returns {Promise<any>} - 包含电脑配置信息的成功响应
   */
  async get_configuration_info(): Promise<any> {
    // 初始化配置信息对象
    const configurationInfo = {
      cpu_model: '',
      cpu_cores: 0,
      cpu_clock: '',
      memory_size: 0,
      free_memory_size: 0,
      gpu_model: '',
      gpu_type: '',
      is_cuda: false,
      gpu_memory: 0,
      gpu_free_memory_size: 0,
      os_type: '',
      os_name: '',
      os_version: '',
      recommend: '',
    }

    try {
      // 获取 CPU 信息
      const cpus = os.cpus()
      if (cpus.length > 0) {
        configurationInfo.cpu_model = cpus[0].model
        configurationInfo.cpu_cores = cpus.length
        configurationInfo.cpu_clock = `${cpus[0].speed / 1000}GHz`
      }

      // 获取内存信息
      configurationInfo.memory_size = os.totalmem()
      configurationInfo.free_memory_size = os.freemem()

      // 获取操作系统信息
      configurationInfo.os_type = os.type()
      if (configurationInfo.os_type === 'Windows_NT') {
        configurationInfo.os_type = 'Windows'
        try {
          const buf = execSync('wmic os get Caption /value')
          const winRelease = iconv.decode(buf, 'gbk').toString()
          const match = winRelease.match(/Caption=(.*)/)
          if (match) {
            configurationInfo.os_name = match[1].trim()
          }
          const winVersionOutput = execSync('wmic os get Version /value').toString()
          const versionMatch = winVersionOutput.match(/Version=(.*)/)
          if (versionMatch) {
            configurationInfo.os_version = versionMatch[1].trim()
          }
        } catch (error) {
          logger.error(pub.lang('获取 Windows 系统信息时出错:'), error)
        }
      } else if (configurationInfo.os_type === 'Linux') {
        try {
          const lsbRelease = pub.exec_shell('lsb_release -d')
          const match = lsbRelease.match(/Description:\t(.*)/)
          if (match) {
            configurationInfo.os_name = match[1].trim()
          }
          const osRelease = pub.exec_shell('cat /etc/os-release')
          const versionMatch = osRelease.match(/VERSION_ID="(.*)"/)
          if (versionMatch) {
            configurationInfo.os_version = versionMatch[1].trim()
          }
        } catch (error) {
          logger.error(pub.lang('获取 Linux 系统信息时出错:'), error)
        }
      } else if (configurationInfo.os_type === 'Darwin') {
        configurationInfo.os_type = 'MacOS'
        try {
          const sw_vers = pub.exec_shell('sw_vers')
          const nameMatch = sw_vers.match(/ProductName:\t(.*)/)
          if (nameMatch) {
            configurationInfo.os_name = nameMatch[1].trim()
          }
          const versionMatch = sw_vers.match(/ProductVersion:\t(.*)/)
          if (versionMatch) {
            configurationInfo.os_version = versionMatch[1].trim()
          }
        } catch (error) {
          logger.error(pub.lang('获取 MacOS 系统信息时出错:'), error)
        }
      }

      // 获取 GPU 信息
      try {
        if (['Windows', 'Linux'].includes(configurationInfo.os_type)) {
          // 检查是否存在 nvidia-smi 命令
          const nvidiaSmiExists = this.checkNvidiaSmiExists(configurationInfo.os_type)
          if (nvidiaSmiExists) {
            const nvidiaSmiOutput = pub.exec_shell(
              'nvidia-smi --query-gpu=name,memory.total,memory.free --format=csv,noheader,nounits',
            )
            const gpuInfo = nvidiaSmiOutput.split('\n')[0].split(',')
            configurationInfo.gpu_model = gpuInfo[0].trim()
            configurationInfo.gpu_type = 'Nvidia'
            configurationInfo.is_cuda = true
            configurationInfo.gpu_memory = parseInt(gpuInfo[1].trim())
            configurationInfo.gpu_free_memory_size = parseInt(gpuInfo[2].trim())
          } else {
            if (configurationInfo.os_type === 'Linux') {
              // 尝试使用 lshw 命令获取 GPU 信息
              const lshwOutput = pub.exec_shell('lshw -C display')
              const gpuMatch = lshwOutput.match(
                /description: (.*)\n.*product: (.*)\n.*vendor: (.*)\n.*memory: (.*)/s,
              )
              if (gpuMatch) {
                configurationInfo.gpu_model = gpuMatch[2].trim()
                if (gpuMatch[3].includes('NVIDIA')) {
                  configurationInfo.gpu_type = 'Nvidia'
                } else if (gpuMatch[3].includes('AMD')) {
                  configurationInfo.gpu_type = 'AMD'
                } else if (gpuMatch[3].includes('Intel')) {
                  configurationInfo.gpu_type = 'Intel'
                }
                const memoryStr = gpuMatch[4].trim()
                if (memoryStr.includes('GB')) {
                  configurationInfo.gpu_memory = parseFloat(memoryStr.replace('GB', '')) * 1024
                } else if (memoryStr.includes('MB')) {
                  configurationInfo.gpu_memory = parseFloat(memoryStr.replace('MB', ''))
                }
              }
            } else if (configurationInfo.os_type === 'Windows') {
              // 尝试使用 wmic 命令获取 GPU 信息
              const wmicOutput = pub.exec_shell(
                'wmic path win32_VideoController get Name,AdapterRAM',
              )
              const gpuMatch = wmicOutput.match(/Name\s+(.*)\s+AdapterRAM\s+(.*)/)
              if (gpuMatch) {
                configurationInfo.gpu_model = gpuMatch[1].trim()
                if (configurationInfo.gpu_model.includes('NVIDIA')) {
                  configurationInfo.gpu_type = 'Nvidia'
                } else if (configurationInfo.gpu_model.includes('AMD')) {
                  configurationInfo.gpu_type = 'AMD'
                } else if (configurationInfo.gpu_model.includes('Intel')) {
                  configurationInfo.gpu_type = 'Intel'
                }
                const adapterRAM = parseInt(gpuMatch[2].trim())
                if (!isNaN(adapterRAM)) {
                  configurationInfo.gpu_memory = adapterRAM / (1024 * 1024)
                }
              }
            }
          }
        } else if (configurationInfo.os_type === 'MacOS') {
          const systemProfilerOutput = pub.exec_shell('system_profiler SPDisplaysDataType')
          const gpuMatch = systemProfilerOutput.match(
            /Chipset Model: (.*)\n.*VRAM \(Total\): (.*)/s,
          )
          if (gpuMatch) {
            configurationInfo.gpu_model = gpuMatch[1].trim()
            if (configurationInfo.gpu_model.includes('AMD')) {
              configurationInfo.gpu_type = 'AMD'
            } else if (configurationInfo.gpu_model.includes('Intel')) {
              configurationInfo.gpu_type = 'Intel'
            }
            const vramStr = gpuMatch[2].trim()
            if (vramStr.includes('GB')) {
              configurationInfo.gpu_memory = parseFloat(vramStr.replace('GB', '')) * 1024
            } else if (vramStr.includes('MB')) {
              configurationInfo.gpu_memory = parseFloat(vramStr.replace('MB', ''))
            }
          }
        }
      } catch (error) {
        logger.error(pub.lang('获取 GPU 信息时出错:'), error)
      }

      configurationInfo.gpu_model +=
        ' - ' + pub.bytesChange(configurationInfo.gpu_memory * 1024 * 1024)

      // 模型选择建议
      if (
        configurationInfo.cpu_cores >= 8 &&
        configurationInfo.memory_size >= 16 * 1024 * 1024 * 1024 &&
        configurationInfo.is_cuda &&
        configurationInfo.gpu_memory >= 15 * 1024
      ) {
        configurationInfo.recommend = pub.lang(
          '根据您的硬件配置，可以流畅运行大部分中大规模的模型，如：32b、27b、24b、14b、7b 等',
        )
      } else if (
        configurationInfo.cpu_cores >= 16 &&
        configurationInfo.memory_size >= 32 * 1024 * 1024 * 1024
      ) {
        configurationInfo.recommend = pub.lang(
          '您的硬件配置适合选择中等规模的模型，如: 7b、14b、16b 等',
        )
      } else {
        configurationInfo.recommend = pub.lang(
          '由于硬件资源有限，建议选择轻量级的模型，如: 1b、2b 等',
        )
      }
    } catch (error) {
      logger.error(pub.lang('获取配置信息时出现未知错误:'), error)
      return pub.return_error(pub.lang('获取配置信息时出现未知错误'), '')
    }
    return pub.return_success(pub.lang('获取配置信息成功'), configurationInfo)
  }

  /**
   * 检查 nvidia-smi 命令是否存在
   * @param {string} osType - 操作系统类型
   * @returns {boolean} - 如果 nvidia-smi 命令存在返回 true，否则返回 false
   */
  checkNvidiaSmiExists(osType: string): boolean {
    if (osType === 'Linux') {
      const whichOutput = pub.exec_shell('which nvidia-smi')
      return whichOutput.length > 0
    } else if (osType === 'Windows') {
      const whereOutput = pub.exec_shell('where nvidia-smi')
      return whereOutput.length > 0
    }
    return false
  }

  /**
   * 获取磁盘信息
   * @returns {Promise<object[]>} - 包含磁盘信息的数组
   */
  async get_disk_list(): Promise<object[]> {
    const diskList: object[] = []
    if (pub.is_windows()) {
      try {
        const output = execSync('wmic logicaldisk get caption,size,freespace').toString()
        const lines = output.split('\n').filter((line) => line.trim() !== '')
        lines.shift() // 移除标题行
        lines.forEach((line) => {
          const parts = line.trim().split(/\s+/)
          if (parts.length >= 2) {
            const mountpoint = parts[0]
            const free = parseInt(parts[1], 10)
            const total = parseInt(parts[2], 10)
            const used = total - free
            const progress = total > 0 ? Math.round((used / total) * 100) : 0
            const diskInfo = {
              mountpoint,
              total,
              used,
              free,
              progress,
            }
            diskList.push(diskInfo)
          }
        })
      } catch (error) {
        logger.error(pub.lang('获取 Windows 磁盘信息时出错:'), error)
      }
    } else if (pub.is_linux()) {
      try {
        const output = execSync('df -P -B1').toString()
        const lines = output.split('\n').filter((line) => line.trim() !== '')
        lines.shift() // 移除标题行
        lines.forEach((line) => {
          const parts = line.trim().split(/\s+/)
          if (parts.length >= 5) {
            const mountpoint = parts[5]
            const total = parseInt(parts[1], 10)
            const used = parseInt(parts[2], 10)
            const free = parseInt(parts[3], 10)
            const progress = parseInt(parts[4].replace('%', ''), 10)
            const diskInfo = {
              mountpoint,
              total,
              used,
              free,
              progress,
            }
            diskList.push(diskInfo)
          }
        })
      } catch (error) {
        logger.error(pub.lang('获取 Linux 磁盘信息时出错:'), error)
      }
    } else if (pub.is_mac()) {
      try {
        const output = execSync('df -P -B1').toString()
        const lines = output.split('\n').filter((line) => line.trim() !== '')
        lines.shift() // 移除标题行
        lines.forEach((line) => {
          const parts = line.trim().split(/\s+/)
          if (parts.length >= 5) {
            const mountpoint = parts[8]
            const total = parseInt(parts[1], 10)
            const used = parseInt(parts[2], 10)
            const free = parseInt(parts[3], 10)
            const progress = parseInt(parts[4].replace('%', ''), 10)
            const diskInfo = {
              mountpoint,
              total,
              used,
              free,
              progress,
            }
            diskList.push(diskInfo)
          }
        })
      } catch (error) {
        logger.error(pub.lang('获取 macOS 磁盘信息时出错:'), error)
      }
    }
    return diskList
  }

  /**
   * 修改 Ollama 模型保存路径
   * @param {Object} args - 修改保存路径所需的参数
   * @param {string} args.save_path - 新的模型保存路径
   * @returns {Promise<any>} - 包含修改结果的成功响应
   */
  async set_ollama_model_save_path(args: { save_path: string }): Promise<any> {
    const { save_path } = args
    const ollamaService = new OllamaService()
    // 调用 OllamaService 的 set_ollama_model_save_path 方法修改保存路径
    const res = ollamaService.set_ollama_model_save_path(save_path)
    return pub.return_success(pub.lang('修改成功'), res)
  }

  /**
   * 断开重连模型下载任务
   */
  async reconnect_model_download() {
    const ollamaService = new OllamaService()
    // 调用 OllamaService 的 reconnect_model_download 方法重连模型下载任务
    const res = ollamaService.reconnect_model_download()
    return pub.return_success(pub.lang('将为您重新下载，并断点续传。'), res)
  }

  /**
   * 设置ollama连接地址
   * @param {Object} args - 设置ollama连接地址所需的参数
   * @param {string} args.ollama_host - ollama连接地址
   * @returns {Promise<any>} - 包含修改结果的成功响应
   */
  async set_ollama_host(args: { ollama_host: string }): Promise<any> {
    const { ollama_host } = args
    const ollamaService = new OllamaService()
    // 调用 OllamaService 的 set_ollama_api 方法修改连接地址
    const res = await ollamaService.set_ollama_host(ollama_host)
    if (res) {
      return pub.return_success(pub.lang('设置成功'), res)
    } else {
      return pub.return_error(pub.lang('指定接口地址连接失败'), 'connect error:' + ollama_host)
    }
  }
}

/**
 * 重写 ManagerController 类的 toString 方法，方便调试和日志输出
 * @returns {string} - 类的字符串表示
 */
ManagerController.toString = (): string => '[class ManagerController]'

export default ManagerController
