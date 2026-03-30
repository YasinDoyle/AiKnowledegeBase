import { pub } from '../class/public'
import * as path from 'path'
import { logger } from '../lib/utils'
import { dialog } from 'electron'

/**
 * index controller 类，用于处理主进程的语言相关逻辑
 * @class
 */
class IndexController {
  async get_version(): Promise<any> {
    return pub.return_success(pub.lang('获取成功'), { version: pub.version() })
  }

  /**
   * 获取当前语言和支持的语言列表
   * @returns {Promise<Object>} 包含语言列表和当前语言的对象，封装在成功响应中返回
   */
  async get_languages(): Promise<any> {
    try {
      // 构建 settings.json 文件的完整路径
      const settingsFilePath = path.resolve(pub.get_language_path(), 'settings.json')
      // 读取文件内容
      let fileContent = pub.read_file(settingsFilePath)

      // 如果文件内容为空，设置默认的语言列表内容
      if (!fileContent) {
        fileContent = `[
                    {
                        "name": "zh",
                        "google": "zh-cn",
                        "title": "简体中文",
                        "cn": "简体中文"
                    },
                    {
                        "name": "en",
                        "google": "en",
                        "title": "English",
                        "cn": "英语"
                    }
                ]`
      }

      // 获取当前语言
      const currentLanguage = pub.get_language()
      // 解析文件内容为 JSON 格式
      const languages = JSON.parse(fileContent)

      const data = {
        languages,
        current: currentLanguage,
      }
      // 返回成功响应
      return pub.return_success(pub.lang('获取成功'), data)
    } catch (error) {
      // 记录错误日志
      logger.error(pub.lang('获取语言列表时出错:'), error)
      // 返回错误响应
      return pub.return_error(pub.lang('获取失败'), error)
    }
  }

  /**
   * 设置当前语言
   * @param {Object} args - 参数对象
   * @param {string} args.language - 要设置的语言
   * @returns {Promise<Object>} 封装了设置成功信息的响应对象
   */
  async set_language(args: { language: string }): Promise<any> {
    try {
      const { language } = args
      // 设置语言配置
      pub.C('language', language)
      // 记录日志
      logger.info(pub.lang('设置语言为: {}', language))

      // 定义需要清除的缓存键数组
      const cacheKeysToDelete = ['language', 'languages', 'lang_data', 'client_lang']
      // 循环清除缓存
      cacheKeysToDelete.forEach((key) => pub.cache_del(key))

      // 返回成功响应
      return pub.return_success(pub.lang('设置成功'), null)
    } catch (error) {
      // 记录错误日志
      logger.error(pub.lang('设置语言时出错:'), error)
      // 返回错误响应
      return pub.return_error(pub.lang('设置失败'), error)
    }
  }

  /**
   * 获取客户端语言包
   * @returns {Promise<Object>} 包含客户端语言包内容的对象，封装在成功响应中返回
   */
  async get_client_language(): Promise<any> {
    try {
      return this.getLanguagePack('client')
    } catch (error) {
      // 记录错误日志
      logger.error(pub.lang('获取客户端语言包时出错:'), error)
      // 返回错误响应
      return pub.return_error(pub.lang('获取客户端语言包失败'), error)
    }
  }

  /**
   * 获取服务端语言包
   * @returns {Promise<Object>} 包含服务端语言包内容的对象，封装在成功响应中返回
   */
  async get_server_language(): Promise<any> {
    try {
      return this.getLanguagePack('server')
    } catch (error) {
      // 记录错误日志
      logger.error(pub.lang('获取服务端语言包时出错:'), error)
      // 返回错误响应
      return pub.return_error(pub.lang('获取服务端语言包失败'), error)
    }
  }

  /**
   * 通用的获取语言包方法
   * @param {string} type - 语言包类型，如 'client' 或 'server'
   * @returns {Promise<Object>} 包含指定类型语言包内容的对象，封装在成功响应中返回
   */
  private async getLanguagePack(type: string): Promise<any> {
    // 获取当前语言
    const currentLanguage = pub.get_language()
    // 构建当前语言对应的语言包文件路径
    const languageFilePath = path.resolve(
      pub.get_language_path(),
      `${currentLanguage}/${type}.json`,
    )

    // 检查文件是否存在，如果不存在则使用默认的中文语言包路径
    const filePath = pub.is_file(languageFilePath)
      ? languageFilePath
      : path.resolve(pub.get_language_path(), `zh/${type}.json`)
    // 读取文件内容
    let fileContent = pub.read_file(filePath)

    // 如果文件内容为空，设置为空对象
    if (!fileContent) {
      fileContent = '{}'
    }

    // 解析文件内容为 JSON 格式
    const languagePack = JSON.parse(fileContent)
    // 返回成功响应
    return pub.return_success(languagePack, null)
  }

  /**
   * 选择目录
   * @param args - 参数
   * @param event - 事件
   */
  async select_folder(args: {}, event): Promise<any> {
    // 通过electron选择目录
    let result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: pub.lang('选择目录'),
      message: pub.lang('请选择一个目录'),
    })

    // 如果有选择目录
    if (!result.canceled) {
      // 返回成功响应
      return pub.return_success(pub.lang('选择成功'), {
        folder: result.filePaths[0],
      })
    }

    return pub.return_error(pub.lang('未选择目录'))
  }

  /**
   * 接收前端错误日志，并写入到日志文件
   * @param args
   * @returns
   */
  async write_logs(args: { logs: string }): Promise<any> {
    const { logs } = args
    // 记录日志
    logger.error(logs)
    return pub.return_success(pub.lang('写入成功'))
  }

  /**
   * 获取数据保存路径
   * @returns {Promise<any>} 返回成功响应，包含数据保存路径
   */
  async get_data_save_path(): Promise<any> {
    let savePathConfigFile = path.resolve(pub.get_system_data_path(), 'save_path.json')
    if (!pub.file_exists(savePathConfigFile)) {
      let currentPath = pub.get_data_path()
      let config = {
        oldPath: '',
        currentPath: currentPath,
        isMove: false, // 是否要移动数据到新路径
        isMoveSuccess: false, // 是否移动成功
        isClearOldPath: false, // 是否已清除旧数据
        dataSize: 0, // 数据大小
        copyStatus: {
          status: 0, // 0:未开始,1:正在复制,2:复制完成,-1:复制失败
          speed: 0, // 复制速度
          total: 0, // 总大小
          current: 0, // 已复制大小
          percent: 0, // 复制进度
          startTime: 0, // 复制开始时间
          endTime: 0, // 复制结束时间
          fileTotal: 0, // 复制文件总数
          fileCurrent: 0, // 复制文件当前数量
          message: '', // 复制信息
          error: '', // 复制错误信息
        },
      }
      pub.write_json(savePathConfigFile, config)
    }

    let savePathConfig = pub.read_json(savePathConfigFile)

    // 返回成功响应
    return pub.return_success(pub.lang('获取成功'), savePathConfig)
  }

  /**
   * 设置数据保存路径
   * @param args - 参数对象
   * @returns {Promise<any>} 返回成功响应，包含设置结果
   */
  async set_data_save_path(args: { newPath: string }): Promise<any> {
    if (global.isOptimizeAllTable) {
      return pub.return_error(pub.lang('当前正在执行向量数据优化操作，请等待几分钟后再试'))
    }
    if (global.isCopyDataPath) {
      return pub.return_error(pub.lang('正在复制数据，请稍后再试'))
    }
    let { newPath } = args
    if (!newPath) {
      return pub.return_error(pub.lang('请选择目录'))
    }

    if (!pub.file_exists(newPath)) {
      return pub.return_error(pub.lang('指定的目录不存在'))
    }

    // 检查指定目录是否为空目录
    let files = pub.readdir(newPath)
    if (files.length > 0) {
      return pub.return_error(pub.lang('指定的目录不是空目录'))
    }

    let savePathConfigFile = path.resolve(pub.get_system_data_path(), 'save_path.json')
    if (!pub.file_exists(savePathConfigFile)) {
      return pub.return_error(pub.lang('配置文件不存在，请先调用获取数据保存路径接口'))
    }
    let savePathConfig = pub.read_json(savePathConfigFile)

    // 设置新的数据保存路径
    savePathConfig.oldPath = savePathConfig.currentPath
    savePathConfig.currentPath = newPath
    savePathConfig.isMove = true
    savePathConfig.isMoveSuccess = false

    savePathConfig.copyStatus.status = 0
    savePathConfig.copyStatus.speed = 0
    savePathConfig.copyStatus.total = 0
    savePathConfig.copyStatus.current = 0
    savePathConfig.copyStatus.percent = 0
    savePathConfig.copyStatus.startTime = 0
    savePathConfig.copyStatus.endTime = 0
    savePathConfig.copyStatus.fileTotal = 0
    savePathConfig.copyStatus.fileCurrent = 0
    savePathConfig.copyStatus.message = ''
    savePathConfig.copyStatus.error = ''

    pub.write_json(savePathConfigFile, savePathConfig)
    global.changePath = true
    // 返回成功响应
    return pub.return_success(pub.lang('设置成功,正在复制数据，请稍后查看进度'))
  }
}

/**
 * 重写 IndexController 类的 toString 方法，方便调试和日志输出
 * @returns {string} - 类的字符串表示
 */
IndexController.toString = (): string => '[class IndexController]'

// 导出 IndexController 类
export default IndexController
