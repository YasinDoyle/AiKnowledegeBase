import { logger } from '../lib/utils'
import { pub } from '../class/public'
import * as path from 'path'
import { ChatContext, ChatHistory } from './chat'

/**
 * 聊天服务类，提供与聊天对话相关的各种操作
 */
export class ShareChatService {
  /**
   * 获取对话的上下文路径
   * @param {string} shareId - 分享ID
   * @param {string} contextId - 对话的唯一标识符
   * @returns {string} - 上下文路径
   */
  private getContextPath(shareId: string, contextId: string): string {
    return pub.get_share_context_path(shareId, contextId)
  }

  /**
   * 读取指定路径的 JSON 文件并解析为对象
   * @param {string} filePath - 文件的完整路径
   * @returns {any} - 解析后的 JSON 对象，如果文件不存在或解析失败则返回空数组
   */
  private readJsonFile(filePath: string): any {
    try {
      if (!pub.file_exists(filePath)) {
        return []
      }
      const fileContent = pub.read_file(filePath)
      if (fileContent.length === 0) {
        return []
      }
      return JSON.parse(fileContent)
    } catch (error) {
      logger.error(`解析 JSON 文件 ${filePath} 时出错:`, error)
      return []
    }
  }

  /**
   * 将数据保存为 JSON 文件到指定路径
   * @param {string} filePath - 文件的完整路径
   * @param {any} data - 要保存的数据
   */
  private saveJsonFile(filePath: string, data: any): void {
    try {
      pub.write_file(filePath, JSON.stringify(data))
    } catch (error) {
      logger.error(`保存 JSON 文件 ${filePath} 时出错:`, error)
    }
  }

  /**
   * 根据 UUID 获取对话配置文件的完整路径
   * @param {string} shareId - 分享ID
   * @param {string} contextId - 对话的唯一标识符
   * @returns {string} - 配置文件的完整路径
   */
  private getConfigFilePath(shareId: string, contextId: string): string {
    const contextPath = this.getContextPath(shareId, contextId)
    return path.resolve(contextPath, 'config.json')
  }

  /**
   * 获取对话历史记录文件的完整路径
   * @param {string} shareId - 分享ID
   * @param {string} contextId - 对话的唯一标识符
   * @returns {string} - 历史记录文件的完整路径
   */
  private getHistoryFilePath(shareId: string, contextId: string): string {
    const contextPath = this.getContextPath(shareId, contextId)
    return path.resolve(contextPath, 'history.json')
  }

  // 获取分享配置
  get_share_info(shareId: string) {
    const sharePath = this.getContextPath(shareId, '')
    const shareConfigPath = path.resolve(sharePath, 'config.json')
    const shareConfig = this.readJsonFile(shareConfigPath)
    return shareConfig.length > 0 ? shareConfig : null
  }

  /**
   * 创建一个新的聊天对话
   * @param {string} shareId - 分享ID
   * @param {string} [title=""] - 对话的标题，默认为空字符串
   * @returns {object} - 包含对话配置信息的对象
   */
  create_chat(shareId: string, title: string = ''): object {
    const shareInfo = this.get_share_info(shareId)
    logger.info('create_chat', { shareId, title })
    const contextId = pub.uuid()
    const trimmedTitle = title.length > 18 ? title.substring(0, 18) : title

    const contextConfig = {
      model: shareInfo?.model,
      title: trimmedTitle,
      parameters: shareInfo?.parameters,
      contextPath: this.getContextPath(shareId, contextId),
      context_id: contextId,
      create_time: pub.time(),
    }
    this.saveJsonFile(this.getConfigFilePath(shareId, contextId), contextConfig)
    return contextConfig
  }

  /**
   * 更新指定对话的模型信息
   * @param {string} shareId - 分享ID
   * @param {string} contextId - 对话的唯一标识符
   * @param {string} model - 新的模型名称
   * @param {string} parameters - 新的模型参数
   * @param {string} supplierName - 供应商名称
   * @returns {boolean} - 如果更新成功返回 true，否则返回 false
   */
  update_chat_model(
    shareId: string,
    contextId: string,
    model: string,
    parameters: string,
    supplierName: string,
  ): boolean {
    const contextConfigObj = this.readJsonFile(this.getConfigFilePath(shareId, contextId))
    if (Object.keys(contextConfigObj).length === 0) {
      return false
    }
    contextConfigObj.model = model
    contextConfigObj.parameters = parameters
    contextConfigObj.supplierName = supplierName
    this.saveJsonFile(this.getConfigFilePath(shareId, contextId), contextConfigObj)
    return true
  }

  /**
   * 更新指定对话的配置项
   * @param {string} shareId - 对话的唯一标识符
   * @param {string} key - 配置项的键
   * @param {any} value - 配置项的值
   * @returns {boolean} - 如果更新成功返回 true，否则返回 false
   */
  update_chat_config(shareId: string, contextId: string, key: string, value: any): boolean {
    const contextConfigObj = this.readJsonFile(this.getConfigFilePath(shareId, contextId))
    if (Object.keys(contextConfigObj).length === 0) {
      return false
    }
    contextConfigObj[key] = value
    this.saveJsonFile(this.getConfigFilePath(shareId, contextId), contextConfigObj)
    return true
  }

  /**
   * 读取指定对话的配置信息
   * @param {string} shareId - 分享ID
   * @param {string} contextId - 对话的唯一标识符
   * @returns {any} - 对话的配置信息对象，如果不存在则返回空数组
   */
  read_chat(shareId: string, contextId: string): any {
    return this.readJsonFile(this.getConfigFilePath(shareId, contextId))
  }

  /**
   * 保存指定对话的配置信息
   * @param {string} shareId - 分享ID
   * @param {string} contextId - 对话的唯一标识符
   * @param {object} chatConfig - 要保存的对话配置信息对象
   */
  save_chat(shareId: string, contextId: string, chatConfig: object): void {
    this.saveJsonFile(this.getConfigFilePath(shareId, contextId), chatConfig)
  }

  /**
   * 读取指定对话的历史记录
   * @param {string} shareId - 分享ID
   * @param {string} contextId - 对话的唯一标识符
   * @returns {any[]} - 对话的历史记录数组，如果不存在则返回空数组
   */
  read_history(shareId: string, contextId: string): any[] {
    return this.readJsonFile(this.getHistoryFilePath(shareId, contextId))
  }

  /**
   * 保存指定对话的历史记录
   * @param {string} shareId - 分享ID
   * @param {string} contextId - 对话的唯一标识符
   * @param {any[]} history - 要保存的历史记录数组
   */
  save_history(shareId: string, contextId: string, history: any[]): void {
    this.saveJsonFile(this.getHistoryFilePath(shareId, contextId), history)
  }

  /**
   * 获取所有对话的列表，并按创建时间降序排序
   * @param {string} shareId - 分享ID
   * @returns {object[]} - 包含所有对话配置信息的数组
   */
  get_chat_list(shareId: string): object[] {
    const contextPath = this.getContextPath(shareId, '')
    const contextDirList = pub.readdir(contextPath)
    const contextList: object[] = []

    for (const dir of contextDirList) {
      const configFilePath = path.resolve(dir, 'config.json')
      const contextConfigObj = this.readJsonFile(configFilePath)
      if (Object.keys(contextConfigObj).length === 0) {
        continue
      }
      if (contextConfigObj.create_time === undefined) {
        const stat = pub.stat(configFilePath)
        contextConfigObj.create_time = stat ? Math.floor(stat.birthtime.getTime() / 1000) : 0
      }
      contextList.push(contextConfigObj)
    }

    contextList.sort((a: any, b: any) => b.create_time - a.create_time)
    return contextList
  }

  /**
   * 获取指定对话的历史记录
   * @param {string} shareId - 分享ID
   * @param {string} contextId - 对话的唯一标识符
   * @returns {object[]} - 对话的历史记录数组
   */
  get_chat_history(shareId: string, contextId: string): object[] {
    return this.read_history(shareId, contextId)
  }

  /**
   * 构造传递给模型的历史对话记录，根据上下文长度进行截断
   * @param {string} shareId - 分享ID
   * @param {string} contextId - 对话的唯一标识符
   * @param {ChatContext} chatContext - 当前的聊天上下文
   * @param {number} contextLength - 上下文的最大长度
   * @returns {object[]} - 构造后的历史对话记录数组
   */
  build_chat_history(
    shareId: string,
    contextId: string,
    chatContext: ChatContext,
    contextLength: number,
  ): any[] {
    let contextList = this.read_history(shareId, contextId)
    let totalTokens = chatContext.content.length
    for (const item of contextList) {
      totalTokens += item.content.length
    }
    const historyMaxContextLength = Math.round(contextLength * 0.5)

    while (totalTokens > historyMaxContextLength && contextList.length > 0) {
      const firstHistory = contextList.shift()
      if (firstHistory) {
        totalTokens -= firstHistory.content.length
      }
    }

    const historyList = contextList.map((item) => ({ role: item.role, content: item.content }))
    historyList.push(chatContext)
    return historyList
  }

  /**
   * 保存对话的历史记录，并根据上下文长度进行截断
   * @param {string} shareId - 分享ID
   * @param {string} contextId - 对话的唯一标识符
   * @param {ChatHistory} history - 要保存的聊天历史记录
   * @param {ChatHistory} historyRes - 聊天历史记录响应
   * @param {number} contextLength - 上下文的最大长度
   */
  save_chat_history(
    shareId: string,
    contextId: string,
    history: ChatHistory,
    historyRes: ChatHistory,
    contextLength: number,
    regenerate_id: string | any,
  ): void {
    history.id = pub.uuid()
    history.tokens = history.content ? history.content.length : 0
    let historyList = this.read_history(shareId, contextId)
    let totalTokens = history.tokens
    const historyMaxContextLength = Math.round(contextLength * 0.5)

    historyRes.content = pub.lang('意外中断')
    if (regenerate_id) {
      let index = historyList.findIndex((item) => item.id == regenerate_id)
      if (index > -1) {
        // 移除指定ID之后的所有历史记录
        historyList = historyList.slice(0, index)
      }
    } else {
      // 添加新的提问记录到列表中
      historyList.push(history)
    }

    historyList.push(historyRes)

    while (totalTokens > historyMaxContextLength && historyList.length > 0) {
      const firstHistory = historyList.shift()
      if (firstHistory) {
        totalTokens -= firstHistory.tokens
      }
    }

    this.save_history(shareId, contextId, historyList)
  }

  /**
   * 修正对话的历史记录
   * @param shareId <string> 分享ID
   * @param contextId <string> 对话的唯一标识符
   * @param id <string> 要修正的历史记录的唯一标识符
   * @param history <ChatHistory> 修正后的聊天历史记录
   */
  set_chat_history(shareId: string, contextId: string, id: string, history: ChatHistory): void {
    const key = '\n</think>\n'
    if (history.content.indexOf(key) !== -1) {
      const spArr = history.content.split(key)
      history.reasoning = spArr[0] + key
      history.content = spArr[1]
    }

    let historyList = this.read_history(shareId, contextId)
    let index = historyList.findIndex((item) => item.id == id)
    historyList[index] = history
    this.save_history(shareId, contextId, historyList)
  }

  /**
   * 删除指定对话及其相关文件
   * @param {string} shareId - 分享ID
   * @param {string} contextId - 对话的唯一标识符
   */
  delete_chat(shareId: string, contextId: string): void {
    const contextPath = this.getContextPath(shareId, contextId)
    try {
      pub.rmdir(contextPath)
    } catch (error) {
      logger.error(`删除对话 ${contextId} 时出错:`, error)
    }
  }

  /**
   * 更新指定对话的标题
   * @param {string} shareId - 分享ID
   * @param {string} contextId - 对话的唯一标识符
   * @param {string} title - 新的对话标题
   * @returns {boolean} - 如果更新成功返回 true，否则返回 false
   */
  update_chat_title(shareId: string, contextId: string, title: string): boolean {
    const contextConfigObj = this.read_chat(shareId, contextId)
    if (Object.keys(contextConfigObj).length === 0) {
      return false
    }
    contextConfigObj.title = title
    this.save_chat(shareId, contextId, contextConfigObj)
    return true
  }

  /**
   * 删除指定对话中的某条历史记录
   * @param {string} shareId - 分享ID
   * @param {string} contextId - 对话的唯一标识符
   * @param {string} id - 要删除的历史记录的唯一标识符
   */
  delete_chat_history(shareId: string, contextId: string, id: string): void {
    const historyList = this.read_history(shareId, contextId)
    const newHistoryList = historyList.filter((item) => item.id !== id)
    this.save_history(shareId, contextId, newHistoryList)
  }

  /**
   * 获取指定对话的最后一条历史记录
   * @param {string} shareId - 分享ID
   * @param {string} contextId - 对话的唯一标识符
   * @returns {object} - 最后一条历史记录对象，如果不存在则返回空对象
   */
  get_last_chat_history(shareId: string, contextId: string): object {
    const historyList = this.read_history(shareId, contextId)
    return historyList[historyList.length - 1] || {}
  }
}

/**
 * 重写 ShareChatService 类的 toString 方法，方便调试和日志输出
 * @returns {string} - 类的字符串表示
 */
ShareChatService.toString = () => '[class ShareChatService]'

/**
 * 导出 ShareChatService 类的单例实例
 */
export const shareChatService = new ShareChatService()
