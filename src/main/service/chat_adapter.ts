import { logger } from '../lib/utils'
import { pub } from '../class/public'
import { ModelService } from '../service/model'
import { MCPClient } from './mcp_client'

/**
 * 聊天适配器接口 —— 统一 Ollama / 第三方模型 / MCP 的差异
 */
export interface ChatAdapter {
  /** 构建 modelStr（用于持久化和展示） */
  buildModelStr(modelName: string, parameters?: string): string
  /** 处理视觉模型的图片格式 */
  formatVisionImages(lastHistory: any): void
  /** 在基础 requestOption 上追加适配器特有的选项 */
  buildRequestOptions(baseOption: any, parameters?: string, modelName?: string): any
  /** 判断 chunk 是否为结束帧 */
  isEndChunk(chunk: any): boolean
  /** 从 chunk 提取正文 delta 文本 */
  getContentDelta(chunk: any): string
  /** 从 chunk 提取 reasoning delta 文本（DeepSeek 等深度思考模型） */
  getReasoningDelta(chunk: any): string | null
  /** 构建统计信息 */
  buildResponseInfo(chunk: any, modelStr: string, resTimeMs: number): Record<string, any>
  /** 从结束帧提取最后一段文本（部分 API 会在 stop 帧携带最后内容） */
  getEndContent(chunk: any): string
  /** 获取创建时间 */
  getCreatedAt(chunk: any): string | number
  /** 获取创建时间戳 */
  getCreateTime(chunk: any): number
  /** 发起请求，返回可异步迭代的流 */
  sendRequest(requestOption: any, supplierName: string): Promise<AsyncIterable<any>>
  /** 中止请求 */
  abort(res: any): void
}

// ─── Ollama 适配器 ──────────────────────────────────────────

export class OllamaChatAdapter implements ChatAdapter {
  buildModelStr(modelName: string, parameters?: string): string {
    return `${modelName}:${parameters}`
  }

  formatVisionImages(lastHistory: any): void {
    if (lastHistory.images && lastHistory.images.length > 0) {
      const images: string[] = []
      for (const image of lastHistory.images) {
        const imgArr = image.split(',')
        if (imgArr.length > 1) {
          images.push(imgArr[1])
        }
      }
      lastHistory.images = images
    }
  }

  buildRequestOptions(baseOption: any, parameters?: string): any {
    const history = baseOption.messages
    let contextLength = 0
    for (const message of history) {
      contextLength += message.content.length
    }
    let max_ctx = 4096
    const min_ctx = 2048
    const parametersNumber = Number(parameters?.replace('b', '')) || 4
    if (parametersNumber && parametersNumber <= 4) max_ctx = 8192
    let num_ctx = Math.max(min_ctx, Math.min(max_ctx, contextLength / 2))
    num_ctx = Math.ceil(num_ctx / min_ctx) * min_ctx
    baseOption.options = { num_ctx }

    if (baseOption.model.indexOf('deepseek') !== -1) {
      baseOption.options.temperature = 0.6
    }
    return baseOption
  }

  isEndChunk(chunk: any): boolean {
    return !!chunk.done
  }

  getContentDelta(chunk: any): string {
    return chunk.message?.content || ''
  }

  getReasoningDelta(_chunk: any): string | null {
    return null
  }

  buildResponseInfo(chunk: any): Record<string, any> {
    return {
      model: chunk.model,
      created_at: chunk.created_at.toString(),
      total_duration: chunk.total_duration / 1000000000,
      load_duration: chunk.load_duration / 1000000,
      prompt_eval_count: chunk.prompt_eval_count,
      prompt_eval_duration: chunk.prompt_eval_duration / 1000000,
      eval_count: chunk.eval_count,
      eval_duration: chunk.eval_duration / 1000000000,
    }
  }

  getEndContent(_chunk: any): string {
    return ''
  }

  getCreatedAt(chunk: any): string {
    return chunk.created_at ? chunk.created_at.toString() : ''
  }

  getCreateTime(_chunk: any): number {
    return pub.time()
  }

  async sendRequest(requestOption: any): Promise<AsyncIterable<any>> {
    const ollama = pub.init_ollama()
    return await ollama.chat(requestOption)
  }

  abort(res: any): void {
    try {
      res?.abort()
    } catch (error: any) {
      logger.error('Ollama abort error:', error.message)
    }
  }
}

// ─── 第三方 OpenAI 兼容适配器 ────────────────────────────────

const formatDate = (timestamp: number) => {
  if (typeof timestamp !== 'number') return timestamp
  return new Date(timestamp * 1000).toISOString()
}

export class OpenAIChatAdapter implements ChatAdapter {
  buildModelStr(modelName: string): string {
    return modelName
  }

  formatVisionImages(lastHistory: any): void {
    if (lastHistory.images && lastHistory.images.length > 0) {
      const content: any[] = []
      content.push({ type: 'text', text: lastHistory.content })
      for (const image of lastHistory.images) {
        content.push({ type: 'image_url', image_url: { url: image } })
      }
      lastHistory.content = content
    }
    if (lastHistory.images) delete lastHistory.images
  }

  buildRequestOptions(baseOption: any, _parameters?: string, modelName?: string): any {
    if (modelName && modelName.indexOf('deepseek') !== -1) {
      baseOption.temperature = 0.6
    }
    return baseOption
  }

  isEndChunk(chunk: any): boolean {
    return (
      chunk.choices?.[0]?.finish_reason === 'stop' || chunk.choices?.[0]?.finish_reason === 'normal'
    )
  }

  getContentDelta(chunk: any): string {
    return chunk.choices?.[0]?.delta?.content || ''
  }

  getReasoningDelta(chunk: any): string | null {
    return chunk.choices?.[0]?.delta?.reasoning_content ?? null
  }

  buildResponseInfo(chunk: any, modelStr: string, resTimeMs: number): Record<string, any> {
    const nowTime = pub.time()
    return {
      model: modelStr,
      created_at: formatDate(chunk.created),
      total_duration: nowTime - chunk.created,
      load_duration: 0,
      prompt_eval_count: chunk.usage?.prompt_tokens || 0,
      prompt_eval_duration: chunk.created * 1000 - resTimeMs,
      eval_count: chunk.usage?.completion_tokens || 0,
      eval_duration: nowTime - resTimeMs / 1000,
    }
  }

  getEndContent(chunk: any): string {
    return chunk.choices?.[0]?.delta?.content || ''
  }

  getCreatedAt(chunk: any): string | number {
    return chunk.created_at ? chunk.created_at.toString() : chunk.created
  }

  getCreateTime(chunk: any): number {
    return chunk.created ? chunk.created : pub.time()
  }

  async sendRequest(requestOption: any, supplierName: string): Promise<AsyncIterable<any>> {
    const modelService = new ModelService(supplierName)
    return await modelService.chat(requestOption)
  }

  abort(_res: any): void {
    // OpenAI 兼容 API 不需要手动 abort，连接会自然关闭
  }
}

// ─── MCP 适配器 ──────────────────────────────────────────────

export class MCPChatAdapter extends OpenAIChatAdapter {
  private mcpServers: string[]

  constructor(mcpServers: string[]) {
    super()
    this.mcpServers = mcpServers
  }

  async sendMCPRequest(
    supplierName: string,
    modelStr: string,
    history: any[],
    resEvent: (chunk: any) => Promise<boolean | void>,
    pushOther: (msg: any) => Promise<void>,
  ): Promise<void> {
    const modelService = new ModelService(supplierName)
    if (!modelService.connect()) {
      throw new Error(pub.lang('模型连接失败:{}', modelService.error))
    }
    const openaiObj = modelService.client
    const mcpServers = await MCPClient.getActiveServers(this.mcpServers)
    const mcpClient = new MCPClient()
    await mcpClient.connectToServer(mcpServers)
    mcpClient.processQuery(openaiObj!, supplierName, modelStr, history, resEvent, pushOther)
  }
}

// ─── 工厂函数 ────────────────────────────────────────────────

export function createChatAdapter(supplierName: string, mcpServers?: string[]): ChatAdapter {
  if (mcpServers && mcpServers.length > 0) {
    return new MCPChatAdapter(mcpServers)
  }
  if (supplierName === 'ollama') {
    return new OllamaChatAdapter()
  }
  return new OpenAIChatAdapter()
}
