import { ipcInvoke, ipcOn, ipcOff } from '@/api'
import { message } from '@/utils/message'
import { eventBus } from '@/utils/tools'
import i18n from '@/i18n'
import useSiderStore from '@/stores/sider'
import useChatContentStore from '@/stores/chatContent'
import useKnowledgeStore from '@/stores/knowledge'
import useChatToolsStore from '@/stores/chatTools'
import useHeaderStore from '@/stores/header'
import useSoftSettingsStore from '@/stores/softSettings'
import useThirdPartyApiStore from '@/stores/thirdPartyApi'
import { createChat, getChatInfo } from '@/pages/Sider/controller'
import type { MultipeQuestionDto, MultipleModelListDto } from '@/types'

const t = i18n.t.bind(i18n)

/**
 * 发送对话到模型
 */
type ChatParams = {
  user_content: string
  doc_files?: string
  images?: string
  regenerate_id?: string
  chatKey?: MultipeQuestionDto
  [key: string]: any
}

export async function sendChat(params: ChatParams, multiModelList?: MultipleModelListDto[]) {
  const header = useHeaderStore.getState()
  const sider = useSiderStore.getState()
  const softSettings = useSoftSettingsStore.getState()
  const chatContent = useChatContentStore.getState()
  const knowledge = useKnowledgeStore.getState()
  const chatTools = useChatToolsStore.getState()
  const thirdParty = useThirdPartyApiStore.getState()

  // ollama 模型名处理
  let model: string, parameters: string
  if (multiModelList) {
    for (const mp of multiModelList) {
      if (mp.supplierName === 'ollama') {
        ;[mp.model, mp.parameters] = mp.model.split(':')
      }
    }
  } else {
    if (thirdParty.currentSupplierName === 'ollama') {
      ;[model, parameters] = header.currentModel.split(':')
    } else {
      model = header.currentModel
      parameters = ''
    }
  }

  try {
    if (!sider.currentContextId) {
      await createChat()
    }

    chatContent.setCurrentTalkingChatId(sider.currentContextId)

    // 查找对应的 chatKey：优先使用调用方直接传入的引用，否则按 content 匹配最后一个
    let currentChat: MultipeQuestionDto | null = params.chatKey ?? null
    if (!currentChat) {
      for (const [key] of useChatContentStore.getState().chatHistory) {
        if (key.content === params.user_content) {
          currentChat = key
        }
      }
    }

    // 累积文本（单模型：string，多模型：string[]）
    let accumulated = multiModelList ? new Array(multiModelList.length).fill('') : ''

    // 监听主进程推送的流式 chunk
    const onChunk = (_event: any, data: { context_id: string; text: string | null }) => {
      if (data.context_id !== sider.currentContextId || !currentChat) return
      if (data.text === null) return // 流结束标记

      if (!multiModelList) {
        // 单模型：累积文本
        accumulated = (accumulated as string) + data.text
        const newHistory = new Map(useChatContentStore.getState().chatHistory)
        const currentEntry = newHistory.get(currentChat)
        newHistory.set(currentChat, {
          ...currentEntry,
          content: accumulated as string,
          stat: { model: header.currentModel },
          id: '',
        })
        useChatContentStore.getState().setChatHistory(newHistory)
      }
      // 多模型场景由各自的 IPC 调用处理
    }
    ipcOn('chat:chunk', onChunk)

    // chatKey 仅前端使用，不传给后端
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { chatKey: _chatKey, ...ipcParams } = params
    const commonParams = {
      context_id: sider.currentContextId,
      search: chatTools.netActive ? softSettings.targetNet : '',
      rag_list: JSON.stringify(knowledge.activeKnowledgeForChat),
      temp_chat: String(chatTools.tempChat),
      mcp_servers: chatTools.mcpListChoosed,
      ...ipcParams,
    }

    if (!multiModelList) {
      // 单模型
      await ipcInvoke('chat:chat', {
        model: model!,
        parameters: parameters!,
        supplierName: thirdParty.currentSupplierName,
        ...commonParams,
      })
    } else {
      // 多模型：并发请求，每个模型独立累积
      const chatPromises = multiModelList.map((mp, i) => {
        return new Promise<void>((resolve) => {
          // 每个模型用独立的 chunk 监听通过 context_id 区分
          // 注意：多模型共享同一 context_id，用 compare_id 区分
          const onMultiChunk = (_event: any, data: { context_id: string; text: string | null }) => {
            if (data.context_id !== sider.currentContextId || !currentChat) return
            if (data.text === null) {
              ipcOff('chat:chunk', onMultiChunk)
              resolve()
              return
            }
            ;(accumulated as string[])[i] += data.text
            const newHistory = new Map(useChatContentStore.getState().chatHistory)
            const chat = { ...newHistory.get(currentChat)! }
            const contentArr = [...(chat.content as string[])]
            contentArr[i] = (accumulated as string[])[i]
            chat.content = contentArr
            const statArr = [...(chat.stat as any[])]
            statArr[i] = { model: mp.model }
            chat.stat = statArr
            chat.id = ''
            newHistory.set(currentChat, chat)
            useChatContentStore.getState().setChatHistory(newHistory)
          }
          ipcOn('chat:chunk', onMultiChunk)
          ipcInvoke('chat:chat', {
            model: mp.model,
            parameters: mp.parameters,
            supplierName: mp.supplierName,
            compare_id: chatTools.compareId,
            ...commonParams,
          })
        })
      })
      await Promise.all(chatPromises)
    }

    ipcOff('chat:chunk', onChunk)

    // 请求结束 — 获取最后一条对话并更新 stat
    const lastChat = await ipcInvoke('chat:get_last_chat_history', {
      context_id: sider.currentContextId,
    })
    if (currentChat) {
      const newHistory = new Map(useChatContentStore.getState().chatHistory)
      const entry = newHistory.get(currentChat)
      if (entry) {
        Object.assign(entry.stat as object, lastChat.message.stat)
        entry.search_result = lastChat.message.search_result
        entry.id = lastChat.message.id
        newHistory.set(currentChat, { ...entry })
        useChatContentStore.getState().setChatHistory(newHistory)
      }
    }

    eventBus.$emit('answerRendered')
    chatContent.setIsInChat(false)
  } catch (err) {
    console.error('sendChat error', err)
    chatContent.setIsInChat(false)
  }
}

/**
 * 终止生成
 */
export async function stopGenerate() {
  const sider = useSiderStore.getState()
  const chatContent = useChatContentStore.getState()
  try {
    const res = await ipcInvoke('chat:stop_generate', {
      context_id: sider.currentContextId,
    })
    if (res.code === 200) {
      message.success(t('对话已停止'))
    }
    chatContent.setIsInChat(false)
    await ipcInvoke('chat:get_last_chat_history', { context_id: sider.currentContextId })
    await getChatInfo(sider.currentContextId)
  } catch (err) {
    console.error('stopGenerate error', err)
  }
}

// 文件类型限制
export const fileLimit = [
  'docx',
  'doc',
  'xlsx',
  'xls',
  'csv',
  'pptx',
  'ppt',
  'pdf',
  'html',
  'htm',
  'md',
  'markdown',
  'txt',
  'log',
]
export const imageLimit = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']
export const acceptFileType = [...fileLimit, ...imageLimit].map((e) => `.${e}`).join(',')

/**
 * 检查文件大小
 */
export function checkFileSize(file: File): boolean {
  const cache = useChatToolsStore.getState().questionFilesCache
  const total = cache.reduce((sum, f) => sum + f.size, 0)
  if (total + file.size > 20 * 1024 * 1024) {
    message.warning(t('附件总大小不能超过20MB'))
    return false
  }
  return true
}

/**
 * 文件选择回调
 */
export function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
  const chatTools = useChatToolsStore.getState()
  const file = e.target.files?.[0]
  if (!file) return

  if (!checkFileSize(file)) {
    e.target.value = ''
    return
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  if (fileLimit.includes(ext)) {
    chatTools.setQuestionFileList([...chatTools.questionFileList, file.name])
    chatTools.setQuestionFiles([...chatTools.questionFiles, (file as any).path || file.name])
    chatTools.setQuestionFilesCache([...chatTools.questionFilesCache, file])
  } else if (imageLimit.includes(ext)) {
    chatTools.setQuestionImageList([...chatTools.questionImageList, file.name])
    chatTools.setQuestionImages([...chatTools.questionImages, (file as any).path || file.name])
    chatTools.setQuestionFilesCache([...chatTools.questionFilesCache, file])
  }
  e.target.value = ''
}

/**
 * 删除上传文件
 */
export function removeFile(index: number) {
  const chatTools = useChatToolsStore.getState()
  const files = [...chatTools.questionFileList]
  const paths = [...chatTools.questionFiles]
  const removed = files.splice(index, 1)[0]
  paths.splice(index, 1)
  chatTools.setQuestionFileList(files)
  chatTools.setQuestionFiles(paths)
  chatTools.setQuestionFilesCache(chatTools.questionFilesCache.filter((f) => f.name !== removed))
}

/**
 * 删除上传图片
 */
export function removeImage(index: number) {
  const chatTools = useChatToolsStore.getState()
  const names = [...chatTools.questionImageList]
  const images = [...chatTools.questionImages]
  const removed = names.splice(index, 1)[0]
  images.splice(index, 1)
  chatTools.setQuestionImageList(names)
  chatTools.setQuestionImages(images)
  chatTools.setQuestionFilesCache(chatTools.questionFilesCache.filter((f) => f.name !== removed))
}

/**
 * 发送对话
 */
export function sendChatToModel() {
  const chatContent = useChatContentStore.getState()
  const chatTools = useChatToolsStore.getState()
  const header = useHeaderStore.getState()
  const thirdParty = useThirdPartyApiStore.getState()

  if (!chatTools.questionContent.trim()) return
  if (!header.currentModel) {
    message.warning(t('请选择对应模型'))
    return
  }

  chatContent.setIsInChat(true)
  chatContent.setUserScrollSelf(false)

  const formatQuestion = chatTools.questionContent.replace(/\n/g, '<br>')
  const chatKey: MultipeQuestionDto = {
    content: formatQuestion,
    files: chatTools.questionFiles,
    images: chatTools.questionImages,
  }

  // 滚动到底部
  setTimeout(() => eventBus.$emit('doScroll'), 0)

  const newHistory = new Map(chatContent.chatHistory)

  if (header.multipleModelList.length === 0) {
    // 单模型
    newHistory.set(chatKey, {
      content: '',
      stat: { model: header.currentModel },
      search_result: [],
    })
    chatContent.setChatHistory(newHistory)
    sendChat({
      user_content: formatQuestion,
      images: chatTools.questionImages.join(','),
      doc_files: chatTools.questionFiles.join(','),
      chatKey,
    })
  } else {
    // 多模型
    const modelParams: MultipleModelListDto[] = [
      ...header.multipleModelList,
      { model: header.currentModel, supplierName: thirdParty.currentSupplierName },
    ]
    newHistory.set(chatKey, { content: [], stat: [], search_result: [] })
    for (let i = 0; i < modelParams.length; i++) {
      const chat = newHistory.get(chatKey)!
      const contentArr = [...(chat.content as string[])]
      contentArr[i] = ''
      chat.content = contentArr
      const statArr = [...((chat.stat as any[]) || [])]
      statArr[i] = { model: modelParams[i].model }
      chat.stat = statArr
    }
    chatContent.setChatHistory(newHistory)
    sendChat(
      {
        user_content: formatQuestion,
        images: chatTools.questionImages.join(','),
        doc_files: chatTools.questionFiles.join(','),
        chatKey,
      },
      modelParams,
    )
  }

  // 清空输入
  chatTools.setQuestionContent('')
  chatTools.setQuestionFiles([])
  chatTools.setQuestionImages([])
  chatTools.setQuestionFileList([])
  chatTools.setQuestionImageList([])
  chatTools.setQuestionFilesCache([])
}

/**
 * 键盘发送 (Enter)
 */
export function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
  const chatContent = useChatContentStore.getState()
  if (chatContent.isInChat) return
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendChatToModel()
  }
}

/**
 * 联网搜索开关
 */
export function toggleSearchEngine() {
  const chatTools = useChatToolsStore.getState()
  chatTools.setNetActive(!chatTools.netActive)
}

/**
 * 临时对话开关
 */
export function toggleTempChat() {
  const chatTools = useChatToolsStore.getState()
  chatTools.setTempChat(!chatTools.tempChat)
}

/**
 * 获取 MCP 列表
 */
export async function getMcpServerListForChat() {
  const chatTools = useChatToolsStore.getState()
  try {
    const res = await ipcInvoke('mcp:get_mcp_server_list')
    chatTools.setMcpListForChat(res.message || [])
  } catch (err) {
    console.error('getMcpServerListForChat error', err)
  }
}

/**
 * 选择/取消 MCP 服务
 */
export function chooseMcpServerForChat(mcpName: string) {
  const chatTools = useChatToolsStore.getState()
  if (chatTools.mcpListChoosed.includes(mcpName)) {
    chatTools.setMcpListChoosed(chatTools.mcpListChoosed.filter((n) => n !== mcpName))
  } else {
    chatTools.setMcpListChoosed([...chatTools.mcpListChoosed, mcpName])
  }
}
