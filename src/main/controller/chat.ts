import type { WebContents } from 'electron'
import { ChatService, ModelInfo } from '../service/chat'
import { pub, ReturnMsg as Result } from '../class/public'
import { GetSupplierModels, getModelUsedTotalList } from '../service/model'
import { ollamaService } from '../service/ollama'
import {
  ContextStatusMap,
  ModelListInfo,
  ToChatService,
  clearModelListInfo,
} from '../service/tochat'

/**
 * chat controller 类，处理与聊天相关的各种操作
 * @class
 */
class ChatController {
  /**
   * 获取对话列表
   * @returns {Promise<any>} - 包含对话列表的成功响应
   */
  async get_chat_list(): Promise<Result> {
    const chatService = new ChatService()
    const chatList = chatService.get_chat_list()
    return pub.return_success(pub.lang('对话列表获取成功'), chatList)
  }

  /**
   * 创建新的对话
   * @param {Object} args - 创建对话所需的参数
   * @param {string} args.model - 模型名称
   * @param {string} args.parameters - 模型参数
   * @param {string} args.title - 对话标题
   * @param {string} args.supplierName - 供应商名称
   * @returns {Promise<any>} - 包含新对话信息的成功响应
   */
  async create_chat(args: {
    model: string
    parameters: string
    title: string
    supplierName?: string
    agent_name?: string
  }): Promise<Result> {
    const { model, parameters, title, supplierName, agent_name: rawAgent } = args
    const agent_name = rawAgent || ''
    // 创建新对话并获取相关数据
    const data = new ChatService().create_chat(
      model,
      parameters,
      title,
      supplierName as string,
      agent_name,
    )
    return pub.return_success(pub.lang('对话创建成功'), data)
  }

  /**
   * 获取常用模型TOP5
   * @param result
   * @returns
   */
  get_model_top5(result: Record<string, Array<ModelInfo & { total?: number }>>) {
    const commonModels: Array<ModelInfo & { total: number }> = []
    const modelsTotal = getModelUsedTotalList()
    for (const key of Object.keys(result)) {
      const modelList = result[key]
      for (const model of modelList) {
        const index = `${model.supplierName}/${model.model}`
        if (modelsTotal[index]) {
          model.total = modelsTotal[index]
          commonModels.push(model as ModelInfo & { total: number })
        }
      }
    }

    const sortedModels = commonModels.sort((a, b) => b.total - a.total).slice(0, 5)
    if (sortedModels.length > 0) {
      result['commonModelList'] = sortedModels
    }
    return result
  }

  /**
   * 获取模型列表
   * @returns {Promise<Result>} - 包含模型列表信息的成功响应
   */
  async get_model_list(): Promise<Result> {
    const ollamaModelList = await ollamaService.model_list()

    // 使用局部数组，避免并发调用共享 ModelListInfo 导致重复
    const ollamaModels: ModelInfo[] = []

    // 从 ollamaModelList 中提取已安装的非嵌入模型（无需再次调用 ollama.list()）
    for (const mod of ollamaModelList) {
      if (!mod.install) continue
      const name: string = mod.full_name || ''
      const nameLower = name.toLowerCase()
      // 过滤嵌入模型
      if (
        nameLower.includes('embed') ||
        nameLower.includes('bge-m3') ||
        nameLower.includes('all-minilm') ||
        nameLower.includes('multilingual') ||
        nameLower.includes('r1-1776')
      ) {
        continue
      }

      ollamaModels.push({
        title: 'Ollama/' + name,
        supplierName: 'ollama',
        model: name,
        size: mod.size || 0,
        contextLength: 0,
        capability: mod.capability?.length ? mod.capability : ['llm'],
      })
    }

    let result = await GetSupplierModels()
    result['ollama'] = ollamaModels

    // 同步更新 ModelListInfo 供 tochat 中 getModelInfo 使用
    clearModelListInfo()
    ollamaModels.forEach((m) => ModelListInfo.push(m))

    result = this.get_model_top5(result)

    // 将后端 ModelInfo 映射为前端 SupplierModelItem 格式
    const mapped: Record<string, Array<Record<string, unknown>>> = {}
    for (const [key, models] of Object.entries(result)) {
      mapped[key] = models.map((m) => ({
        modelName: m.model,
        supplierName: m.supplierName,
        title: m.title,
        capability: m.capability || [],
        status: true,
        ...(m.total != null ? { total: m.total } : {}),
      }))
    }

    return pub.return_success(pub.lang('大模型列表获取成功'), mapped)
  }

  /**
   * 开始对话
   * @param {Object} args - 对话所需的参数
   * @param {string} args.context_id - 对话的唯一标识符
   * @param {string} args.supplierName - 供应商名称
   * @param {string} args.model - 模型名称
   * @param {string} args.parameters - 模型参数
   * @param {string} args.user_content - 用户输入的内容
   * @param {string} args.search - 搜索类型
   * @param {string} args.rag_list - RAG列表
   * @param {string} args.regenerate_id - 重新生成的ID
   * @param {string} args.images - 图片列表
   * @param {string} args.doc_files - 文件列表
   * @param {string} args.temp_chat - 临时对话标志
   * @param {any} args.rag_results - RAG结果列表
   * @param {any} args.search_results - 搜索结果列表
   * @param {string} args.compare_id - 对比ID
   * @param {WebContents | null} webContents - 用于向渲染进程推送流式数据
   * @returns {Promise<any>} - 对话结果
   */
  async chat(
    args: {
      context_id: string
      supplierName?: string
      model: string
      parameters?: string
      user_content: string
      rag_results: any[]
      search_results?: any[]
      search?: string
      rag_list?: string
      regenerate_id?: string
      images?: string
      doc_files?: string
      temp_chat?: string
      compare_id?: string
      mcp_servers?: string[]
    },
    webContents: WebContents | null,
  ): Promise<Result> {
    const toChatService = new ToChatService()
    return await toChatService.chat(args, webContents)
  }

  /**
   * 获取指定对话信息
   * @param {Object} args - 获取对话信息所需的参数
   * @param {string} args.context_id - 对话的唯一标识符
   * @returns {Promise<any>} - 包含对话信息的成功响应
   */
  async get_chat_info(args: { context_id: string }): Promise<Result> {
    const { context_id: uuid } = args
    const chatService = new ChatService()
    const data = chatService.get_chat_history(uuid)
    return pub.return_success(pub.lang('对话信息获取成功'), data)
  }

  /**
   * 删除指定对话
   * @param {Object} args - 删除对话所需的参数
   * @param {string} args.context_id - 对话的唯一标识符,多个用逗号分隔
   * @returns {Promise<any>} - 删除成功的响应
   */
  async remove_chat(args: { context_id: string }): Promise<Result> {
    const { context_id } = args
    const chatService = new ChatService()
    const uuids = context_id.split(',')
    for (const uuid of uuids) {
      chatService.delete_chat(uuid)
      // 删除对话状态
      if (ContextStatusMap.has(uuid)) {
        ContextStatusMap.delete(uuid)
      }
    }
    // 返回成功响应
    return pub.return_success(pub.lang('对话删除成功'), null)
  }

  /**
   * 修改对话标题
   * @param {Object} args - 修改对话标题所需的参数
   * @param {string} args.context_id - 对话的唯一标识符
   * @param {string} args.title - 新的对话标题
   * @returns {Promise<any>} - 修改结果的响应
   */
  async modify_chat_title(args: { context_id: string; title: string }): Promise<Result> {
    const { context_id: uuid, title } = args
    const chatService = new ChatService()
    // 更新对话标题
    if (chatService.update_chat_title(uuid, title)) {
      return pub.return_success(pub.lang('标题修改成功'), null)
    } else {
      return pub.return_error(pub.lang('标题修改失败'), pub.lang('指定对话不可用'))
    }
  }

  /**
   * 删除指定对话历史
   * @param {Object} args - 删除对话历史所需的参数
   * @param {string} args.context_id - 对话的唯一标识符
   * @param {string} args.id - 要删除的历史记录的唯一标识符
   * @returns {Promise<any>} - 删除成功的响应
   */
  async delete_chat_history(args: { context_id: string; id: string }): Promise<Result> {
    const { context_id: uuid, id: history_id } = args
    const chatService = new ChatService()
    // 删除对话历史记录
    chatService.delete_chat_history(uuid, history_id)
    // 返回成功响应
    return pub.return_success(pub.lang('对话历史删除成功'), null)
  }

  /**
   * 中断生成
   * @param {Object} args - 中断生成所需的参数
   * @param {string} args.context_id - 对话的唯一标识符
   * @returns {Promise<any>} - 中断成功的响应
   */
  async stop_generate(args: { context_id: string }): Promise<Result> {
    const { context_id: uuid } = args
    // 设置对话状态为中断
    ContextStatusMap.set(uuid, false)
    // 返回成功响应
    return pub.return_success(pub.lang('已阻止大模型继续生成内容'), null)
  }

  /**
   * 获取指定对话的最后一条历史记录
   * @param {Object} args - 获取最后一条历史记录所需的参数
   * @param {string} args.context_id - 对话的唯一标识符
   * @returns {Promise<any>} - 包含最后一条历史记录的成功响应
   */
  async get_last_chat_history(args: { context_id: string }): Promise<Result> {
    const { context_id: uuid } = args
    const chatService = new ChatService()
    // 获取最后一条历史记录
    const data = chatService.get_last_chat_history(uuid)
    // 返回成功响应
    return pub.return_success(pub.lang('最后一条历史对话记录获取成功'), data)
  }
}

/**
 * 重写 ChatController 类的 toString 方法，方便调试和日志输出
 * @returns {string} - 类的字符串表示
 */
ChatController.toString = () => '[class ChatController]'

export default ChatController
