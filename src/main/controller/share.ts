import { pub } from '../class/public'
import { logger } from '../lib/utils'
import path from 'path'

const SHARE_URL = 'https://share.aingdesk.com'

/**
 * share controller 类，处理与对话分享相关的各种操作
 * @class
 */
class ShareController {
  /**
   * 获取指定分享配置文件的完整路径
   * @param {string} shareId - 分享ID
   * @returns {string} - 分享配置文件的完整路径
   */
  private getShareConfigFilePath(shareId: string): string {
    return path.resolve(pub.get_data_path(), 'share', shareId, 'config.json')
  }

  /**
   * 获取分享上下文目录的完整路径
   * @param {string} shareId - 分享ID
   * @returns {string} - 分享上下文目录的完整路径
   */
  private getShareContextPath(shareId: string): string {
    return path.resolve(pub.get_data_path(), 'share', shareId, 'context')
  }

  /**
   * 读取指定路径的文件内容并解析为 JSON 对象
   * @param {string} filePath - 文件的完整路径
   * @returns {object|null} - 解析后的 JSON 对象，如果文件不存在或解析失败则返回 null
   */
  private readJsonFile(filePath: string): object | null {
    try {
      if (!pub.is_file(filePath)) {
        return null
      }
      const fileContent = pub.read_file(filePath)
      return JSON.parse(fileContent)
    } catch (error) {
      logger.error(`读取并解析 JSON 文件 ${filePath} 时出错:`, error)
      return null
    }
  }

  /**
   * 将数据保存为 JSON 文件到指定路径
   * @param {string} filePath - 文件的完整路径
   * @param {object} data - 要保存的数据
   */
  private saveJsonFile(filePath: string, data: object): void {
    try {
      pub.write_file(filePath, JSON.stringify(data))
    } catch (error) {
      logger.error(`保存 JSON 文件 ${filePath} 时出错:`, error)
    }
  }

  /**
   * 获取指定分享配置
   * @param {string} shareId - 分享ID
   * @returns {object|null} - 分享配置对象，如果不存在则返回 null
   */
  read_share_config(shareId: string): object | null {
    const shareFilePath = this.getShareConfigFilePath(shareId)
    return this.readJsonFile(shareFilePath)
  }

  /**
   * 获取分享列表
   * @returns {Promise<any>} - 包含分享列表的成功响应对象
   */
  async get_share_list() {
    const sharePath = path.resolve(pub.get_data_path(), 'share')
    const shareIdList = pub.readdir(sharePath)
    const shareList: any[] = []
    const shareIdPrefix = pub.C('shareIdPrefix') || 'none'

    for (const shareIdPath of shareIdList) {
      const shareId = path.basename(shareIdPath)
      const shareConfig: any = this.read_share_config(shareId)
      shareConfig.url = `${SHARE_URL}/${shareIdPrefix}/${shareId}`
      if (shareConfig) {
        // 异步获取分享的聊天历史记录
        let historys = await this.get_share_chat_history({ share_id: shareId })
        shareConfig['chats'] = historys.message
        if (!shareConfig.rag_list) {
          shareConfig.rag_list = []
        }
        if (!shareConfig.supplierName) {
          shareConfig.supplierName = 'ollama'
        }
        shareList.push(shareConfig)
      }
    }

    // 排序，按创建时间倒序
    shareList.sort((a, b) => b.create_time - a.create_time)

    return pub.return_success(pub.lang('分享列表获取成功'), shareList)
  }

  /**
   * 删除指定分享
   * @param {object} args - 包含分享ID的对象
   * @param {string} args.share_id - 分享ID
   * @returns {Promise<any>} - 表示删除成功的响应对象
   */
  async remove_share(args: { share_id: string }): Promise<any> {
    const sharePath = path.resolve(pub.get_data_path(), 'share', args.share_id)
    if (pub.file_exists(sharePath)) {
      try {
        // 删除分享目录
        pub.rmdir(sharePath)
      } catch (error) {
        logger.error(`删除分享 ${args.share_id} 时出错:`, error)
      }
    }
    return pub.return_success(pub.lang('删除成功'))
  }

  /**
   * 创建分享
   * @param {object} args - 创建分享所需的参数对象
   * @param {string} [args.supplierName] - 供应商名称
   * @param {string} args.model - 模型名称
   * @param {string} args.parameters - 模型参数
   * @param {string} args.title - 分享标题
   * @param {string} [args.password] - 分享密码（可选）
   * @param {string} [args.rag_list] - 分享权限列表（可选）
   * @param {string} [args.agent_name] - 代理名称（可选）
   * @returns {Promise<any>} - 表示创建成功的响应对象
   */
  async create_share(args: {
    supplierName?: string
    model: string
    parameters: string
    title: string
    password?: string
    rag_list?: string
    agent_name?: string
    mcp_servers?: string[]
  }): Promise<any> {
    const shareId = pub.uuid()
    const sharePath = path.resolve(pub.get_data_path(), 'share', shareId)

    try {
      // 创建分享目录
      pub.mkdir(sharePath)
    } catch (error) {
      logger.error(`创建分享目录 ${sharePath} 时出错:`, error)
      return pub.return_error(pub.lang('创建分享目录失败'), null)
    }

    let supplierName = args.supplierName || 'ollama'
    let rag_list = args.rag_list ? JSON.parse(args.rag_list) : ''
    let agent_name = args.agent_name || ''

    const shareConfig = {
      supplierName: supplierName,
      rag_list: rag_list,
      share_id: shareId,
      model: args.model,
      parameters: args.parameters,
      title: args.title,
      agent_name: agent_name,
      password: args.password,
      mcp_servers: args.mcp_servers || [],
      create_time: pub.time(),
    }

    const shareConfigPath = this.getShareConfigFilePath(shareId)
    this.saveJsonFile(shareConfigPath, shareConfig)

    let shareIdPrefix = pub.C('shareIdPrefix') || 'none'
    let url = `${SHARE_URL}/${shareIdPrefix}/${shareId}`

    return pub.return_success(pub.lang('创建成功'), { url: url, password: args.password })
  }

  /**
   * 修改分享
   * @param {object} args - 修改分享所需的参数对象
   * @param {string} args.share_id - 分享ID
   * @param {string} args.model - 模型名称
   * @param {string} args.parameters - 模型参数
   * @param {string} args.title - 分享标题
   * @param {string} [args.password] - 分享密码（可选）
   * @param {string} [args.rag_list] - 分享权限列表（可选）
   * @param {string} [args.supplierName] - 供应商名称（可选）
   * @param {string} [args.agent_name] - 代理名称（可选）
   * @returns {Promise<any>} - 表示修改成功的响应对象，如果分享不存在则返回错误响应
   */
  async modify_share(args: {
    share_id: string
    supplierName?: string
    model: string
    parameters: string
    title: string
    password?: string
    rag_list?: string
    agent_name?: string
    mcp_servers?: string[]
  }): Promise<any> {
    const sharePath = path.resolve(pub.get_data_path(), 'share', args.share_id)
    if (!pub.file_exists(sharePath)) {
      return pub.return_error(pub.lang('分享不存在'), null)
    }

    let supplierName = args.supplierName || 'ollama'
    let rag_list = args.rag_list ? JSON.parse(args.rag_list) : ''
    let agent_name = args.agent_name || ''

    const shareConfigPath = this.getShareConfigFilePath(args.share_id)

    // 修改分享配置文件
    let shareConfig = this.read_share_config(args.share_id)
    if (!shareConfig) {
      return pub.return_error(pub.lang('获取分享配置失败'), null)
    }

    shareConfig['supplierName'] = supplierName
    shareConfig['rag_list'] = rag_list
    shareConfig['model'] = args.model
    shareConfig['parameters'] = args.parameters
    shareConfig['title'] = args.title
    shareConfig['password'] = args.password
    shareConfig['agent_name'] = agent_name
    shareConfig['mcp_servers'] = args.mcp_servers || []

    this.saveJsonFile(shareConfigPath, shareConfig)

    return pub.return_success(pub.lang('修改成功'))
  }

  /**
   * 获取分享对话历史
   * @param {object} args - 包含分享ID的对象
   * @param {string} args.share_id - 分享ID
   * @returns {Promise<any>} - 包含分享聊天历史记录的成功响应对象
   */
  async get_share_chat_history(args: { share_id: string }): Promise<any> {
    const historyPath = this.getShareContextPath(args.share_id)
    const historyList = pub.readdir(historyPath)
    const historyData: object[] = []

    for (const contextId of historyList) {
      // 获取对话配置
      const contextPath = path.resolve(historyPath, contextId)
      const contextConfigFile = path.resolve(contextPath, 'config.json')
      const contextConfig = this.readJsonFile(contextConfigFile)

      if (contextConfig) {
        // 获取对话历史
        const chatHistoryFile = path.resolve(contextPath, 'history.json')
        const chatHistory = this.readJsonFile(chatHistoryFile)
        contextConfig['history'] = chatHistory || []
        historyData.push(contextConfig)
      }
    }

    return pub.return_success('获取成功', historyData)
  }

  /**
   * 获取分享服务状态
   * @param {object} args - 参数对象
   * @param {string} args.status - 分享服务状态 true/false
   * @returns {Promise<any>} - 包含分享服务状态的成功响应对象
   */
  async set_share_service_status(args: { status: string }): Promise<any> {
    let status = args.status
    pub.C('shareServiceStatus', status == 'true')
    return pub.return_success('设置成功')
  }
}

/**
 * 重写 ShareController 类的 toString 方法，方便调试和日志输出
 * @returns {string} - 类的字符串表示
 */
ShareController.toString = () => '[class ShareController]'

export default ShareController
