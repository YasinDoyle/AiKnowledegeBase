import fs from 'fs'
import tls from 'tls'
import { pub } from '../class/public'
import path from 'path'
import { logger } from '../lib/utils'
import { shareChatService } from './share_chat'
import { ChatContext, ChatHistory } from './chat'
import ChatController from '../controller/chat'
import { getPromptForWeb } from '../search_engines/search'
import { Rag } from '../rag/rag'
import { ModelService, GetSupplierModels, getModelContextLength } from '../service/model'
import { ToChatService } from './tochat'
// 常量定义
const CLOUD_SERVER_HOST = 'share.aingdesk.com'
const CLOUD_SERVER_PORT = 9999
const HEADER_SIZE = 4

// 存储需要中断的对话 ID
let ContextStatusMap = new Map<string, boolean>()

class ShareService {
  // 获取对话列表
  getShareChatList(shareId: string) {
    const chatPath = path.resolve(pub.get_data_path(), 'share', shareId, 'context')
    const chatList = pub.readdir(chatPath)
    const chatHistoryList: object[] = []

    for (const contextId of chatList) {
      const chatFilePath = path.resolve(chatPath, contextId)
      const chatConfigFile = path.resolve(chatFilePath, 'config.json')
      const chatConfigBody = pub.read_file(chatConfigFile)
      if (chatConfigBody) {
        try {
          chatHistoryList.push(JSON.parse(chatConfigBody))
        } catch (error) {
          logger.error(`Failed to parse chat config file: ${chatConfigFile}`, error)
        }
      }
    }

    // 按照创建时间倒序排序
    chatHistoryList.sort((a: any, b: any) => b.create_time - a.create_time)

    return pub.return_success('获取成功', chatHistoryList)
  }

  // 获取指定对话信息
  getShareChatInfo(shareId: string, contextId: string) {
    const chatPath = path.resolve(pub.get_data_path(), 'share', shareId, 'context', contextId)
    const chatConfigFile = path.resolve(chatPath, 'config.json')
    const chatConfigBody = pub.read_file(chatConfigFile)
    const chatInfo = chatConfigBody ? JSON.parse(chatConfigBody) : null
    if (!chatInfo) {
      return pub.return_error(pub.lang('获取失败'), null)
    }

    const chatHistoryFile = path.resolve(chatPath, 'history.json')
    const chatHistoryBody = pub.read_file(chatHistoryFile)
    if (chatHistoryBody) {
      try {
        chatInfo.history = JSON.parse(chatHistoryBody)
        return pub.return_success(pub.lang('获取成功'), chatInfo)
      } catch (error) {
        logger.error(`Failed to parse chat history file: ${chatHistoryFile}`, error)
        return pub.return_error(pub.lang('获取失败'), null)
      }
    }
    return pub.return_error(pub.lang('获取失败'), null)
  }

  // 创建新对话
  createChat(shareId: string, title: string) {
    const shareInfo = this.getShareInfo(shareId)
    if (!shareInfo) {
      return pub.return_error(pub.lang('分享 ID 不存在'), null)
    }

    const contextId = pub.uuid()
    const chatPath = path.resolve(pub.get_data_path(), 'share', shareId, 'context', contextId)
    if (!pub.file_exists(chatPath)) {
      pub.mkdir(chatPath)
    }

    const chatConfig = {
      title,
      shareId,
      contextId,
      model: shareInfo.model,
      parameters: shareInfo.parameters,
      agent_name: shareInfo.agent_name,
      create_time: pub.time(),
      update_time: pub.time(),
    }

    const chatConfigFile = path.resolve(chatPath, 'config.json')
    pub.write_file(chatConfigFile, JSON.stringify(chatConfig))
    return pub.return_success('创建成功', { shareId, contextId })
  }

  // 删除对话
  removeChat(shareId: string, contextId: string) {
    const chatPath = path.resolve(pub.get_data_path(), 'share', shareId, 'context', contextId)
    if (pub.file_exists(chatPath)) {
      pub.rmdir(chatPath)
    }
    return pub.return_success(pub.lang('删除成功'))
  }

  // 中断对话
  abortChat(contextId: string) {
    return pub.return_error(pub.lang('暂不支持远程中断'), null)
    // ContextStatusMap.set(contextId, false);
    // return pub.return_success(pub.lang('中断成功'));
  }

  // 聊天
  async chat(
    conn: tls.TLSSocket,
    data: {
      supplierName?: string
      modelStr: string
      content: string
      shareInfo: any
      contextId: string
      search?: string
      regenerate_id?: string
      images?: string[]
      doc_files?: string[]
      rag_list?: string[]
      agent_name?: string
      mcp_servers?: string[]
    },
    msgId: number,
  ) {
    let {
      supplierName,
      modelStr,
      content,
      shareInfo,
      contextId,
      search,
      regenerate_id,
      doc_files,
      images,
      rag_list,
      agent_name,
      mcp_servers,
    } = data
    const shareId = shareInfo.share_id
    supplierName = supplierName || 'ollama'
    doc_files = doc_files || []
    images = images || []
    rag_list = rag_list || []
    agent_name = agent_name || ''
    const isOllama = supplierName === 'ollama'

    // 构建用户的聊天上下文
    const chatContext: ChatContext = {
      role: 'user',
      content,
      images: [],
      doc_files: [],
      tool_calls: '',
    }

    // 获取模型信息
    const chatController = new ChatController()
    const toChat = new ToChatService()
    let modelInfo = toChat.get_model_info(modelStr)
    if (modelInfo.contextLength === 0) {
      await chatController.get_model_list()
      modelInfo = toChat.get_model_info(modelStr)
    }
    modelInfo.contextLength = modelInfo.contextLength || 4096
    // 设置对话状态为正在生成
    ContextStatusMap.set(contextId, true)
    // 保存新的模型信息
    shareChatService.update_chat_model(
      shareId,
      contextId,
      shareInfo.model,
      shareInfo.parameters,
      supplierName,
    )

    // 获取对话历史
    let history = shareChatService.build_chat_history(
      shareId,
      contextId,
      chatContext,
      modelInfo.contextLength,
    )

    // 保存用户的聊天记录
    const chatHistory: ChatHistory = {
      id: '',
      compare_id: '',
      role: 'user',
      reasoning: '',
      stat: {},
      content,
      images: [],
      doc_files: [],
      tool_calls: '',
      created_at: '',
      create_time: pub.time(),
      tokens: 0,
      search_result: [],
      search_query: '',
      search_type: search,
    }

    // 初始化助手的聊天记录
    const resUUID = pub.uuid()
    const chatHistoryRes: ChatHistory = {
      id: resUUID,
      compare_id: '',
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
      search_query: '',
      search_type: search,
    }

    shareChatService.save_chat_history(
      shareId,
      contextId,
      chatHistory,
      chatHistoryRes,
      modelInfo.contextLength,
      regenerate_id,
    )
    chatHistoryRes.content = ''

    // 先使用知识库检索
    if (rag_list) {
      // 保存RAG列表到会话配置
      shareChatService.update_chat_config(shareId, contextId, 'rag_list', rag_list)

      if (rag_list.length > 0) {
        let { userPrompt, systemPrompt, searchResultList, query } =
          await new Rag().searchAndSuggest(
            supplierName,
            modelStr,
            content,
            history[history.length - 1].doc_files,
            agent_name,
            [],
            rag_list,
          )
        chatHistoryRes.search_query = query
        chatHistoryRes.search_type = '[RAG]:' + rag_list.join(',')
        chatHistoryRes.search_result = searchResultList

        if (systemPrompt) {
          // 将系统提示词插入到对话历史的第一条
          history.unshift({
            role: 'system',
            content: systemPrompt,
          })
        }

        if (userPrompt) {
          // 将用户提示词替换历史的最后一条
          history[history.length - 1].content = userPrompt
        }

        // 知识库有召回结果的情况下，不再进行联网搜索
        if (searchResultList.length > 0) {
          search = ''
        }
      }
    }

    if (search) {
      // 获取上一次的对话历史
      let lastHistory = ''
      if (history.length > 2) {
        lastHistory += pub.lang('问题: ') + history[history.length - 3].content + '\n'
        lastHistory += pub.lang('回答:') + history[history.length - 2].content + '\n'
      }

      let { userPrompt, systemPrompt, searchResultList, query } = await getPromptForWeb(
        content,
        modelStr,
        lastHistory,
        history[history.length - 1].doc_files,
        agent_name,
        [],
        search,
      ) //getPromptForWeb(content,modelStr,lastHistory,search,doc_files,"");
      chatHistoryRes.search_query = query
      chatHistoryRes.search_type = search
      chatHistoryRes.search_result = searchResultList

      if (systemPrompt) {
        // 将系统提示词插入到对话历史的第一条
        history.unshift({
          role: 'system',
          content: systemPrompt,
        })
      }

      if (userPrompt) {
        // 将用户提示词替换历史的最后一条
        history[history.length - 1].content = userPrompt
      }
    }

    try {
      let letHistory = history[history.length - 1]

      // 嵌入system提示
      //             if(letHistory.content === content) {
      //                 let systemPrompt = `# 以下是日期和地区信息，你可以根据需要选择其中的内容。
      // ## ${pub.lang('当前日期和时间为')}: ${pub.getCurrentDateTime()}
      // ## ${pub.lang('用户所在地区为')}: ${pub.getUserLocation()}`
      //                 history.unshift({
      //                     role: 'system',
      //                     content: systemPrompt
      //                 });
      //             }

      // 嵌入文档
      if (letHistory.content === content && letHistory.doc_files.length > 0) {
        // 将文档内容合并到用户输入
        letHistory.content = `## ${pub.lang('以下是用户上传的文档内容，每个文档内容都是[用户文档 X begin]...[用户文档 X end]格式的，你可以根据需要选择其中的内容。')}
{doc_files}
## ${pub.lang('用户输入的内容')}:{user_content}`

        const doc_files_str = letHistory.doc_files
          .map(
            (doc_file, idx) =>
              `[${pub.lang('用户文档')} ${idx + 1} begin]
${pub.lang('内容')}: ${doc_file}
[${pub.lang('用户文档')} ${idx} end]`,
          )
          .join('\n')

        letHistory.content = letHistory.content.replace('{doc_files}', doc_files_str)
        letHistory.content = letHistory.content.replace('{user_content}', content)
      }

      if (letHistory.tool_calls !== undefined) {
        // 删除工具调用
        delete letHistory.tool_calls
      }

      if (letHistory.doc_files !== undefined) {
        // 删除文档
        delete letHistory.doc_files
      }

      if (!isOllama) {
        // 非Ollama模型，图片处理
        if (letHistory.images && letHistory.images.length > 0) {
          let content: any[] = []
          content.push({ type: 'text', text: letHistory.content })
          for (let image of letHistory.images) {
            content.push({ type: 'image_url', image_url: { url: image } })
          }
        }

        if (letHistory.images) delete letHistory.images
      } else {
        // Ollama模型，删除data:image/jpeg;base64,
        if (letHistory.images && letHistory.images.length > 0) {
          let images: string[] = []
          for (let image of letHistory.images) {
            images.push(image.split(',')[1])
          }
          letHistory.images = images
        }
      }

      // 发送消息到大模型
      const requestOption: any = {
        model: modelStr,
        messages: history,
        stream: true,
      }

      if (isOllama) {
        let modelArr = modelStr.split(':')
        let parameters = modelArr[1]

        // 计算上下文长度
        let contextLength = 0
        for (const message of history) {
          contextLength += message.content.length
        }
        let max_ctx = 4096
        let min_ctx = 2048
        if (parameters && parameters === '1.5b') max_ctx = 8192
        let num_ctx = Math.max(min_ctx, Math.min(max_ctx, contextLength / 2))
        // num_ctx 为min_ctx的倍数
        num_ctx = Math.ceil(num_ctx / min_ctx) * min_ctx
        requestOption.options = {
          num_ctx: num_ctx,
        }
      }

      if (modelStr.indexOf('deepseek') !== -1) {
        if (isOllama) {
          requestOption.options.temperature = 0.6
        } else {
          requestOption.temperature = 0.6
        }
      }

      let res: any
      if (isOllama) {
        const ollama = pub.init_ollama()
        res = await ollama.chat(requestOption)
      } else {
        const modelService = new ModelService(supplierName)
        try {
          res = await modelService.chat(requestOption)
        } catch (error) {
          logger.error(pub.lang('调用模型接口时出错:'), error)
          return pub.return_error(pub.lang('调用模型接口时出错'), error)
        }
      }

      // 处理大模型的流式响应
      let resTimeMs = 0 // 开始响应时间(毫秒)
      let isThinking = false // 是否正在推理
      let isThinkingEnd = false // 是否推理结束
      for await (const chunk of res) {
        if (!isOllama) resTimeMs = new Date().getTime()
        if (
          (isOllama && chunk.done) ||
          (!isOllama &&
            (chunk.choices[0].finish_reason === 'stop' ||
              chunk.choices[0].finish_reason === 'normal'))
        ) {
          // 计算统计信息
          let resInfo = {}
          if (isOllama) {
            resInfo = {
              model: chunk.model,
              created_at: chunk.created_at.toString(),
              total_duration: chunk.total_duration / 1000000000,
              load_duration: chunk.load_duration / 1000000,
              prompt_eval_count: chunk.prompt_eval_count,
              prompt_eval_duration: chunk.prompt_eval_duration / 1000000,
              eval_count: chunk.eval_count,
              eval_duration: chunk.eval_duration / 1000000000,
            }
          } else {
            let nowTime = pub.time()
            resInfo = {
              model: modelStr,
              created_at: chunk.created, // 对话开始时间
              total_duration: nowTime - chunk.created, // 总时长
              load_duration: 0,
              prompt_eval_count: chunk.usage?.prompt_tokens || 0,
              prompt_eval_duration: chunk.created * 1000 - resTimeMs,
              eval_count: chunk.usage?.completion_tokens || 0,
              eval_duration: nowTime - resTimeMs / 1000,
            }

            // console.log("chunk:",chunk);
          }
          chatHistoryRes.created_at = chunk.created_at ? chunk.created_at.toString() : chunk.created
          chatHistoryRes.create_time = chunk.created ? chunk.created : pub.time()
          chatHistoryRes.stat = resInfo

          shareChatService.set_chat_history(shareId, contextId, resUUID, chatHistoryRes)
          if (isOllama) {
            this.sendToServer(conn, { done: true, content: chunk.message.content }, msgId)
          } else {
            this.sendToServer(
              conn,
              { done: true, content: chunk.choices[0]?.delta?.content || '' },
              msgId,
            )
          }

          break
        }
        if (isOllama) {
          this.sendToServer(conn, { done: false, content: chunk.message.content || '' }, msgId)
          chatHistoryRes.content += chunk.message.content
        } else {
          if (chunk.choices[0]?.delta?.reasoning_content) {
            let reasoningContent = chunk.choices[0]?.delta?.reasoning_content || ''
            if (!isThinking) {
              isThinking = true
              if (reasoningContent.indexOf('<think>') === -1) {
                this.sendToServer(conn, { done: false, content: '\n<think>\n' }, msgId)
                chatHistoryRes.content += '\n<think>\n'
              }
            }
            this.sendToServer(conn, { done: false, content: reasoningContent }, msgId)
            chatHistoryRes.content += reasoningContent
            if (reasoningContent.indexOf('</think>') !== -1) {
              isThinkingEnd = true
            }
          } else {
            if (isThinking) {
              isThinking = false
              if (!isThinkingEnd) {
                this.sendToServer(conn, { done: false, content: '\n</think>\n' }, msgId)
                chatHistoryRes.content += '\n</think>\n'
                isThinkingEnd = true
              }
            }
            this.sendToServer(
              conn,
              { done: false, content: chunk.choices[0]?.delta?.content || '' },
              msgId,
            )
            chatHistoryRes.content += chunk.choices[0]?.delta?.content || ''
          }
        }

        // 检查是否中断生成
        if (!ContextStatusMap.get(contextId)) {
          // console.log('中断请求');
          // 中断请求
          if (isOllama) res.abort()
          // 结束流
          const endContent = pub.lang('\n\n---\n**内容不完整:** 用户手动停止生成')
          chatHistoryRes.content += endContent
          this.sendToServer(conn, { done: true, content: endContent }, msgId)
          shareChatService.set_chat_history(shareId, contextId, resUUID, chatHistoryRes)
          break
        }
      }
    } catch (error) {
      logger.error('Error while chatting with Ollama:', error)
      this.sendToServer(conn, pub.return_error(pub.lang('聊天出错'), null), msgId)
    }
  }

  // 判断分享 ID 是否存在
  existsShareId(shareId: string) {
    return pub.file_exists(path.resolve(pub.get_data_path(), 'share', shareId))
  }

  // 获取分享配置
  getShareInfo(shareId: string) {
    if (!this.existsShareId(shareId)) {
      return null
    }

    const sharePath = path.resolve(pub.get_data_path(), 'share', shareId)
    const shareConfigPath = path.resolve(sharePath, 'config.json')
    const shareConfig = pub.read_file(shareConfigPath)
    if (!shareConfig) {
      return null
    }

    try {
      return typeof shareConfig === 'string' ? JSON.parse(shareConfig) : shareConfig
    } catch (error) {
      logger.error(`Failed to parse share config file: ${shareConfigPath}`, error)
      return null
    }
  }

  // 生成唯一的分享 ID 前缀
  generateUniquePrefix() {
    return pub.C('shareIdPrefix') || 'none'
  }

  // 发送数据到云服务器
  sendToServer(conn: tls.TLSSocket, data: any, msgId: number) {
    let dataStr = data
    if (typeof data == 'object') {
      // 添加消息 ID
      data.msgId = msgId
      dataStr = JSON.stringify(data)
    }

    // 构建头部
    const header = Buffer.alloc(HEADER_SIZE)
    const bodyBuffer = Buffer.from(dataStr)
    header.writeInt32BE(bodyBuffer.length)

    // 先发送头部
    conn.write(header)

    // 分包发送，每个包 4096 字节
    const packageSize = 4096
    const packageCount = Math.ceil(bodyBuffer.length / packageSize)
    for (let i = 0; i < packageCount; i++) {
      const start = i * packageSize
      const end = Math.min(start + packageSize, bodyBuffer.length)
      const packageData = bodyBuffer.slice(start, end)
      conn.write(packageData)
    }
  }

  // 处理接收到的数据
  handleReceivedData(conn, data) {
    try {
      const shareData = JSON.parse(data.toString('utf8'))
      if (!shareData.msgId) {
        return this.sendToServer(conn, pub.return_error('Unknown msgId', 'Unknown msgId'), 0)
      }
      if (!shareData) {
        return this.sendToServer(
          conn,
          pub.return_error('args error', 'args error'),
          shareData.msgId,
        )
      }
      if (!shareData.action) {
        return this.sendToServer(
          conn,
          pub.return_error('Unknown action', 'Unknown action'),
          shareData.msgId,
        )
      }
      if (shareData.action === 'set_share_id_prefix') {
        pub.C('shareIdPrefix', shareData.shareIdPrefix)
        return
      }
      if (!this.existsShareId(shareData.shareId)) {
        return this.sendToServer(
          conn,
          pub.return_error('Unknown shareId', 'Unknown shareId'),
          shareData.msgId,
        )
      }

      const shareInfo = this.getShareInfo(shareData.shareId)
      shareInfo.supplierName = shareInfo.supplierName || 'ollama'
      switch (shareData.action) {
        case 'chat':
          const args = {
            supplierName: shareInfo.supplierName,
            modelStr:
              shareInfo.supplierName == 'ollama'
                ? `${shareInfo.model}:${shareInfo.parameters}`
                : shareInfo.model,
            content: shareData.content,
            shareInfo,
            contextId: shareData.contextId,
            search: shareData.search,
            regenerate_id: shareData.regenerate_id,
            doc_files: shareData.doc_files || [],
            images: shareData.images || [],
            rag_list: shareInfo.rag_list || [],
            mcp_servers: shareInfo.mcp_servers || [],
          }
          this.chat(conn, args, shareData.msgId)
          break
        case 'get_share_chat_list':
          const chatList = this.getShareChatList(shareData.shareId)
          this.sendToServer(conn, chatList, shareData.msgId)
          break
        case 'get_share_chat_info':
          if (!shareData.contextId) {
            return this.sendToServer(
              conn,
              pub.return_error('Unknown contextId', 'Unknown contextId'),
              shareData.msgId,
            )
          }
          const chatInfo = this.getShareChatInfo(shareData.shareId, shareData.contextId)
          this.sendToServer(conn, chatInfo, shareData.msgId)
          break
        case 'create_chat':
          if (!shareData.title) {
            return this.sendToServer(
              conn,
              pub.return_error('Unknown title', 'Unknown title'),
              shareData.msgId,
            )
          }
          const chatRes = this.createChat(shareData.shareId, shareData.title)
          this.sendToServer(conn, chatRes, shareData.msgId)
          break
        case 'remove_chat':
          if (!shareData.contextId) {
            return this.sendToServer(
              conn,
              pub.return_error('Unknown contextId', 'Unknown contextId'),
              shareData.msgId,
            )
          }
          const removeRes = this.removeChat(shareData.shareId, shareData.contextId)
          this.sendToServer(conn, removeRes, shareData.msgId)
          break
        case 'stop_generate':
          if (!shareData.contextId) {
            return this.sendToServer(
              conn,
              pub.return_error('Unknown contextId', 'Unknown contextId'),
              shareData.msgId,
            )
          }
          const abortRes = this.abortChat(shareData.contextId)
          this.sendToServer(conn, abortRes, shareData.msgId)
          break
        case 'modify_chat_title':
          if (!shareData.title) {
            return this.sendToServer(
              conn,
              pub.return_error('Unknown title', 'Unknown title'),
              shareData.msgId,
            )
          }
          if (!shareData.contextId) {
            return this.sendToServer(
              conn,
              pub.return_error('Unknown contextId', 'Unknown contextId'),
              shareData.msgId,
            )
          }
          shareChatService.update_chat_title(
            shareData.shareId,
            shareData.contextId,
            shareData.title,
          )
          this.sendToServer(conn, pub.return_success(pub.lang('修改成功')), shareData.msgId)
          break
        case 'get_last_chat_history':
          if (!shareData.contextId) {
            return this.sendToServer(
              conn,
              pub.return_error('Unknown contextId', 'Unknown contextId'),
              shareData.msgId,
            )
          }
          const lastChatHistory = shareChatService.get_last_chat_history(
            shareData.shareId,
            shareData.contextId,
          )
          this.sendToServer(
            conn,
            pub.return_success(pub.lang('获取成功'), lastChatHistory),
            shareData.msgId,
          )
          break
        default:
          this.sendToServer(conn, pub.return_error('Unknown action', null), shareData.msgId)
          break
      }
    } catch (error) {
      logger.error('Error while handling received data:', error)
      this.sendToServer(conn, pub.return_error('Data parse error', 'Data parse error'), 0)
    }
  }

  // 接收数据
  receiveData(conn) {
    let buffer = Buffer.alloc(0)
    let bodySize: any = null
    conn.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk])

      while (true) {
        if (bodySize === null) {
          // 检查是否接收到完整的头部
          if (buffer.length >= 4) {
            bodySize = buffer.readUInt32BE(0)
            buffer = buffer.slice(4)
          } else {
            break
          }
        }

        if (bodySize !== null && buffer.length >= bodySize) {
          // 接收到完整的数据体
          const body = buffer.slice(0, bodySize)
          buffer = buffer.slice(bodySize)
          this.handleReceivedData(conn, body)
          bodySize = null
        } else {
          break
        }
      }
    })
  }

  // 连接到云服务器
  connectToCloudServer(shareIdPrefix) {
    global.connectToCloudServer = false

    if (pub.C('shareServiceStatus') === false) {
      return null
    }

    // 检查 share 目录是否存在
    const sharePath = path.resolve(pub.get_data_path(), 'share')
    if (!pub.file_exists(sharePath)) {
      return null
    }

    // 检查是否有可用的分享
    const shareList = pub.readdir(sharePath)
    if (!shareList || shareList.length === 0) {
      return null
    }

    const certFile = path.resolve(pub.get_resource_path(), 'cert/server.crt')
    const options = {
      host: CLOUD_SERVER_HOST,
      port: CLOUD_SERVER_PORT,
      ca: fs.readFileSync(certFile),
      rejectUnauthorized: false,
      // timeout: 5000 // 5 秒超时
    }

    const socket = tls.connect(options, () => {
      logger.info('Connected to cloud server')
      // 发送分享 ID 前缀
      this.sendToServer(socket, shareIdPrefix, 0)
    })

    socket.on('timeout', () => {
      logger.error('Connection timed out')
      socket.destroy()
    })

    if (socket) global.connectToCloudServer = true

    // 接收数据
    this.receiveData(socket)

    // 监听连接关闭事件
    socket.on('end', () => {
      logger.info('Disconnected from cloud server')
    })

    // 监听错误事件
    socket.on('error', (error) => {
      logger.error('Socket error:', error)
    })

    // 监听关闭事件
    socket.on('close', (hadError) => {
      if (hadError) {
        logger.error('Socket closed with error')
      } else {
        logger.info('Socket closed normally')
      }
    })

    return socket
  }

  // 开始重连
  startReconnect(socket, shareIdPrefix) {
    // 每隔 5 秒检查一次连接状态
    setInterval(() => {
      if (!socket || socket.destroyed) {
        socket = this.connectToCloudServer(shareIdPrefix)
      }
    }, 5000)
  }
}

/**
 * 重写 ShareService 类的 toString 方法，方便调试和日志输出
 * @returns {string} - 类的字符串表示
 */
ShareService.prototype.toString = () => '[class ShareService]'

/**
 * 导出 ShareService 类的单例实例
 */
export const shareService = new ShareService()
