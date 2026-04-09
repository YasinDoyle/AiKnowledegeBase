import type { WebContents } from 'electron'
import { logger } from '../lib/utils'
import { pub } from '../class/public'
import * as path from 'path'
import { agentService } from './agent'
import { getModelContextLength, setModelUsedTotal } from '../service/model'
import { getPromptForWeb } from '../search_engines/search'
import { Rag } from '../rag/rag'
import { ChatContext, ChatHistory, ChatService, ModelInfo } from './chat'
import { createChatAdapter, MCPChatAdapter, OllamaChatAdapter } from './chat_adapter'

/**
 * 存储所有模型信息的数组
 * @type {ModelInfo[]}
 */
export let ModelListInfo: ModelInfo[] = []
/**
 * 存储对话上下文状态的映射，键为对话ID，值为是否继续生成的布尔值
 * @type {Map<string, boolean>}
 */
export const ContextStatusMap = new Map<string, boolean>()
export const clearModelListInfo = () => {
  ModelListInfo = []
}

// 提取获取模型信息的函数
const getModelInfo = (model: string): ModelInfo => {
  const foundInfo = ModelListInfo.find((info) => info.model === model)
  return (
    foundInfo || {
      title: model,
      supplierName: 'ollama',
      model,
      size: 0,
      contextLength: getModelContextLength(model),
    }
  )
}

// 提取判断是否为视觉模型的函数
const checkIsVisionModel = async (supplierName: string, model: string): Promise<boolean> => {
  const modelLower = model.toLocaleLowerCase()
  if (modelLower.indexOf('vision') !== -1) {
    return true
  }
  if (supplierName !== 'ollama') {
    if (modelLower.indexOf('-vl') !== -1) return true
    return false
  }
  try {
    const modelListFile = path.resolve(pub.get_resource_path(), 'ollama_model.json')
    if (!pub.file_exists(modelListFile)) {
      logger.warn('模型列表文件不存在:', modelListFile)
      return false
    }
    const modelList = pub.read_json(modelListFile)
    if (!Array.isArray(modelList)) {
      logger.warn('模型列表格式不正确')
      return false
    }
    return modelList.some((modelInfo) => {
      return (
        (modelInfo.name === model || modelInfo.full_name === model) &&
        modelInfo.capability &&
        Array.isArray(modelInfo.capability) &&
        modelInfo.capability.includes('vision')
      )
    })
  } catch (error) {
    logger.error('检查模型视觉能力时出错:', error)
    return false
  }
}

// 提取保存对话内容的函数
const saveChatHistory = async (uuid: string, resUUID: string, chatHistoryRes: ChatHistory) => {
  const key = '\n</think>\n'
  if (chatHistoryRes.content.indexOf(key) !== -1) {
    const spArr = chatHistoryRes.content.split(key)
    chatHistoryRes.reasoning = spArr[0] + key
    chatHistoryRes.content = spArr[1]
  }
  const chatService = new ChatService()
  await chatService.set_chat_history(uuid, resUUID, chatHistoryRes)
}

// 提取处理RAG的函数
const handleRag = async (
  args: any,
  chatService: ChatService,
  history: any[],
  chatHistoryRes: ChatHistory,
  contextInfo: any,
  supplierName: string,
  modelStr: string,
  user_content: string,
  rag_results: any[],
) => {
  if (args.rag_list) {
    const ragList = JSON.parse(args.rag_list)
    await chatService.update_chat_config(args.context_id, 'rag_list', ragList)
    if (ragList.length > 0) {
      const { userPrompt, systemPrompt, searchResultList, query } =
        await new Rag().searchAndSuggest(
          supplierName,
          modelStr,
          user_content,
          history[history.length - 1].doc_files,
          contextInfo.agent_name,
          rag_results,
          ragList,
        )
      chatHistoryRes.search_query = query
      chatHistoryRes.search_type = '[RAG]:' + ragList.join(',')
      chatHistoryRes.search_result = searchResultList
      if (searchResultList.length > 0 && systemPrompt) {
        history.unshift({
          role: 'system',
          content: systemPrompt,
        })
      }
      if (userPrompt) {
        history[history.length - 1].content = userPrompt
      }
      if (searchResultList.length > 0) {
        args.search = ''
      }
    }
  }
  return args.search
}

// 提取处理搜索的函数
const handleSearch = async (
  args: any,
  _chatService: ChatService,
  history: any[],
  chatHistoryRes: ChatHistory,
  contextInfo: any,
  _supplierName: string,
  modelStr: string,
  user_content: string,
  search_results: any[],
) => {
  if (args.search) {
    let lastHistory = ''
    if (history.length > 2) {
      lastHistory += pub.lang('问题: ') + history[history.length - 3].content + '\n'
      lastHistory += pub.lang('回答: ') + history[history.length - 2].content + '\n'
    }
    const { userPrompt, systemPrompt, searchResultList, query } = await getPromptForWeb(
      user_content,
      modelStr,
      lastHistory,
      history[history.length - 1].doc_files,
      contextInfo.agent_name,
      search_results,
      args.search,
    )
    chatHistoryRes.search_query = query
    chatHistoryRes.search_type = args.search
    chatHistoryRes.search_result = searchResultList
    if (systemPrompt && searchResultList.length > 0) {
      history.unshift({
        role: 'system',
        content: systemPrompt,
      })
    }
    if (userPrompt) {
      history[history.length - 1].content = userPrompt
    }
  }
}

// 提取处理文档的函数
const handleDocuments = (letHistory: ChatHistory, modelName: string, user_content: string) => {
  if (letHistory.content === user_content && letHistory.doc_files.length > 0) {
    if (modelName.toLocaleLowerCase().indexOf('qwen') === -1) {
      const doc_files_str = letHistory.doc_files
        .map((doc_file: string, idx: number) => {
          if (!doc_file) return ''
          return `[${pub.lang('用户文档')} ${idx + 1} begin]
            ${pub.lang('内容')}: ${doc_file}
            [${pub.lang('用户文档')} ${idx} end]`
        })
        .join('\n')
      letHistory.content = `## ${pub.lang('以下是用户上传的文档内容，每个文档内容都是[用户文档 X begin]...[用户文档 X end]格式的，你可以根据需要选择其中的内容。')}
<doc_files>
${doc_files_str}
</doc_files>
## ${pub.lang('用户输入的内容')}:
${user_content}`
    } else {
      const doc_files_str = letHistory.doc_files
        .map((doc_file: string, idx: number) => {
          if (!doc_file) return ''
          return `${pub.lang('用户文档')} ${idx + 1} begin
${doc_file}
${pub.lang('用户文档')} ${idx + 1} end
`
        })
        .join('\n')
      letHistory.content += '\n\n' + doc_files_str
    }
  }
}

// 提取处理图片的函数
const handleImages = (letHistory: ChatHistory, isVision: boolean) => {
  if (!isVision && letHistory.images.length > 0) {
    const ocrContent = letHistory.images
      .map((image: string, idx: number) => {
        if (!image) return ''
        return `${pub.lang('图片')} ${idx + 1} ${pub.lang('OCR解析结果')} begin
${image}
${pub.lang('图片')} ${idx + 1} ${pub.lang('OCR解析结果')} end
`
      })
      .join('\n')
    letHistory.content += '\n\n' + ocrContent
  }
}

export class ToChatService {
  /**
   * 获取指定模型的信息
   * @param {string} model - 模型名称
   * @returns {ModelInfo} - 模型信息对象
   */
  get_model_info(model: string): ModelInfo {
    return getModelInfo(model)
  }

  /**
   * 判断是否为视觉模型
   * @param {string} supplierName - 供应商名称
   * @param {string} model - 模型名称
   * @returns {Promise<boolean>} - 是否为视觉模型
   */
  async isVisionModel(supplierName: string, model: string): Promise<boolean> {
    return checkIsVisionModel(supplierName, model)
  }

  /**
   * 保存对话内容
   * @param {string} uuid - 对话的唯一标识符
   * @param {string} resUUID - 对话的唯一标识符
   * @param {ChatHistory} chatHistoryRes - 对话历史记录
   */
  async set_chat_history(uuid: string, resUUID: string, chatHistoryRes: ChatHistory) {
    await saveChatHistory(uuid, resUUID, chatHistoryRes)
  }

  /**
   * 确保消息格式正确
   * @param {any} messages - 消息内容
   * @returns
   */
  formatMessage(messages: any[]): any[] {
    // 确保system消息在最前面，且不重复，若有多个system消息，则只保留第一个，其它的删除
    const systemMessages = messages.filter((msg: any) => msg.role === 'system')
    if (systemMessages.length > 0) {
      messages = messages.filter((msg: any) => msg.role !== 'system')
      messages.unshift(systemMessages[0])
    }
    // 确保system在第一位，且user消息和assistant交替出现
    const userMessages = messages.filter((msg: any) => msg.role === 'user')
    const assistantMessages = messages.filter((msg: any) => msg.role === 'assistant')
    const systemMessage = messages.filter((msg: any) => msg.role === 'system')[0]
    messages = []
    if (systemMessage) {
      messages.push(systemMessage)
    }
    let i = 0
    while (i < userMessages.length || i < assistantMessages.length) {
      if (i < userMessages.length) {
        messages.push(userMessages[i])
      }
      if (i < assistantMessages.length) {
        messages.push(assistantMessages[i])
      }
      i++
    }
    return messages
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
   * @param {any} event - 事件对象，用于处理HTTP响应
   * @returns {Promise<any>} - 可读流，用于流式响应对话结果
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
  ): Promise<any> {
    const {
      context_id: uuid,
      model: modelName,
      user_content,
      images,
      doc_files,
      temp_chat,
      rag_results,
      search_results,
      compare_id,
      mcp_servers,
    } = args
    let { supplierName, parameters, search, regenerate_id } = args
    if (!supplierName) {
      supplierName = 'ollama'
    }
    const isTempChat = temp_chat === 'true'
    const isOllama = supplierName === 'ollama'

    // 1. 创建适配器，统一处理 Ollama / 第三方 / MCP 差异
    const adapter = createChatAdapter(supplierName, mcp_servers)
    const modelStr = adapter.buildModelStr(modelName, parameters)
    if (!isOllama) {
      parameters = supplierName
    }

    const images_list = images ? images.split(',') : []
    const doc_files_list = doc_files ? doc_files.split(',') : []
    setModelUsedTotal(supplierName, modelStr)
    const chatService = new ChatService()
    const contextInfo = await chatService.read_chat(uuid)
    const chatContext: ChatContext = {
      role: 'user',
      content: user_content,
      images: images_list,
      doc_files: doc_files_list,
      tool_calls: '',
    }
    ContextStatusMap.set(uuid, true)
    let modelInfo: ModelInfo = {
      title: modelName,
      supplierName: supplierName,
      model: modelName,
      size: 0,
      contextLength: getModelContextLength(modelName),
    }
    if (isOllama) {
      modelInfo = this.get_model_info(modelStr)
      if (modelInfo.contextLength === 0) {
        modelInfo.contextLength = getModelContextLength(modelName)
      }
    }

    if (compare_id && regenerate_id) {
      regenerate_id = ''
    }

    await chatService.update_chat_model(
      uuid,
      modelName,
      parameters as string,
      supplierName as string,
    )
    const isVision = await this.isVisionModel(supplierName, modelName)
    let history = await chatService.build_chat_history(
      uuid,
      chatContext,
      modelInfo.contextLength,
      isTempChat,
      isVision,
    )
    const chatHistory: ChatHistory = {
      id: '',
      compare_id: compare_id,
      role: 'user',
      reasoning: '',
      stat: {},
      content: user_content,
      images: images_list,
      doc_files: doc_files_list,
      tool_calls: '',
      created_at: '',
      create_time: pub.time(),
      tokens: 0,
      search_result: [],
      search_type: search,
      search_query: '',
      tools_result: [],
    }
    const resUUID = pub.uuid()
    const chatHistoryRes: ChatHistory = {
      id: resUUID,
      compare_id: compare_id,
      role: 'assistant',
      reasoning: '',
      stat: {
        model: modelStr,
        created_at: '',
        total_duration: 0,
        load_duration: 0,
        prompt_eval_count: 0,
        prompt_eval_duration: 0,
        eval_count: 0,
        eval_duration: 0,
      },
      content: '',
      images: [],
      doc_files: [],
      tool_calls: '',
      created_at: '',
      create_time: pub.time(),
      tokens: 0,
      search_result: [],
      search_type: search,
      search_query: '',
      tools_result: [],
    }
    await chatService.save_chat_history(
      uuid,
      chatHistory,
      chatHistoryRes,
      modelInfo.contextLength,
      regenerate_id,
    )
    await chatService.update_chat_config(uuid, 'search_type', search)

    // 2. 内容增强：RAG / 搜索 / Agent / 文档 / 图片
    const isSystemPrompt = false
    search = await handleRag(
      args,
      chatService,
      history,
      chatHistoryRes,
      contextInfo,
      supplierName,
      modelStr,
      user_content,
      rag_results,
    )
    await handleSearch(
      args,
      chatService,
      history,
      chatHistoryRes,
      contextInfo,
      supplierName,
      modelStr,
      user_content,
      search_results || [],
    )
    const letHistory = history[history.length - 1]
    if (!isSystemPrompt && history[0].role !== 'system' && letHistory.content === user_content) {
      if (contextInfo.agent_name) {
        const agentConfig = agentService.get_agent_config(contextInfo.agent_name)
        if (agentConfig && agentConfig.prompt) {
          history.unshift({
            role: 'system',
            content: agentConfig.prompt,
          })
        }
      }
    }
    handleDocuments(letHistory, modelName, user_content)
    handleImages(letHistory, isVision)
    if (letHistory.tool_calls !== undefined) {
      delete letHistory.tool_calls
    }
    if (letHistory.doc_files !== undefined) {
      delete letHistory.doc_files
    }

    // 3. 视觉图片格式化（由适配器统一处理）
    if (isVision) {
      adapter.formatVisionImages(letHistory)
    }
    if (letHistory.images && letHistory.images.length === 0) {
      delete letHistory.images
    }
    if (!isVision && letHistory.images) {
      delete letHistory.images
    }

    history = this.formatMessage(history)

    // 4. 构建请求参数（由适配器追加各自特有的选项）
    let requestOption: any = {
      model: modelStr,
      messages: history,
      stream: true,
    }
    requestOption = adapter.buildRequestOptions(requestOption, parameters, modelName)

    // 5. 向渲染进程推送流式数据
    const sendChunk = (text: string | null) => {
      if (webContents && !webContents.isDestroyed()) {
        webContents.send('chat:chunk', { context_id: uuid, text })
      }
    }
    const PushOther = async (msg: string) => {
      if (msg) {
        sendChunk(msg)
        if (msg.indexOf('<mcptool>') !== -1) {
          chatHistoryRes.tools_result?.push(msg)
        }
      }
    }

    // 6. 流式响应回调（通过适配器消除 isOllama 分支）
    let res: any
    chatHistoryRes.content = ''
    let resTimeMs = 0
    let isThinking = false
    let isThinkingEnd = false
    const ResEvent = async (chunk: Record<string, unknown>) => {
      if (!(adapter instanceof OllamaChatAdapter)) resTimeMs = new Date().getTime()
      if ((chunk.choices as unknown[])?.length === 0) {
        return
      }
      // 结束帧处理
      if (adapter.isEndChunk(chunk)) {
        const resInfo = adapter.buildResponseInfo(chunk, modelStr, resTimeMs)
        chatHistoryRes.created_at = String(adapter.getCreatedAt(chunk))
        chatHistoryRes.create_time = adapter.getCreateTime(chunk)
        chatHistoryRes.stat = resInfo
        const endContent = adapter.getEndContent(chunk)
        if (endContent) {
          chatHistoryRes.content += endContent
          sendChunk(endContent)
        }
        sendChunk(null)
        await this.set_chat_history(uuid, resUUID, chatHistoryRes)
        return false
      }
      // 正文 delta 处理
      const reasoningDelta = adapter.getReasoningDelta(chunk)
      if (reasoningDelta !== null) {
        // 深度思考内容（reasoning_content）
        if (!isThinking) {
          isThinking = true
          if (reasoningDelta.indexOf('<think>') === -1) {
            sendChunk('\n<think>\n')
            chatHistoryRes.content += '\n<think>\n'
          }
        }
        sendChunk(reasoningDelta)
        chatHistoryRes.content += reasoningDelta
        if (reasoningDelta.indexOf('</think>') !== -1) {
          isThinkingEnd = true
        }
      } else {
        if (isThinking) {
          isThinking = false
          if (!isThinkingEnd) {
            sendChunk('\n</think>\n')
            chatHistoryRes.content += '\n</think>\n'
            isThinkingEnd = true
          }
        }
        const contentDelta = adapter.getContentDelta(chunk)
        sendChunk(contentDelta)
        chatHistoryRes.content += contentDelta
      }
      // 用户手动停止
      if (!ContextStatusMap.get(uuid)) {
        adapter.abort(res)
        const endContent = pub.lang('\n\n---\n**内容不完整:** 用户手动停止生成')
        chatHistoryRes.content += endContent
        sendChunk(endContent)
        sendChunk(null)
        await this.set_chat_history(uuid, resUUID, chatHistoryRes)
        return false
      }
      return true
    }

    // 7. 发起请求
    if (adapter instanceof MCPChatAdapter) {
      try {
        await adapter.sendMCPRequest(supplierName, modelStr, history, ResEvent, PushOther)
      } catch (error: unknown) {
        return pub.lang('出错了: {}', (error as Error).message)
      }
    } else {
      try {
        res = await adapter.sendRequest(requestOption, supplierName)
      } catch (error: unknown) {
        const err = error as any
        if (err.error && err.error.message) {
          return pub.lang('调用模型接口时出错了: {}', err.error.message)
        }
        return pub.lang('调用模型接口时出错了: {}', (error as Error).message)
      }
      await (async () => {
        for await (const chunk of res) {
          await ResEvent(chunk)
        }
      })()
    }
  }
}
