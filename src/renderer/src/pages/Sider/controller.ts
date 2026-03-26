import { ipcInvoke } from '@/api'
import { message } from '@/utils/message'
import i18n from '@/i18n'
import useSiderStore from '@/stores/sider'
import useHeaderStore from '@/stores/header'
import useThirdPartyApiStore from '@/stores/thirdPartyApi'
import useChatToolsStore from '@/stores/chatTools'
import useKnowledgeStore from '@/stores/knowledge'
import useAgentStore from '@/stores/agent'
import useChatContentStore from '@/stores/chatContent'
import type { ChatInfo, ChatItemInfo } from '@/types'

const t = i18n.t.bind(i18n)

/**
 * 获取对话列表
 */

export async function getChatList() {
  const sider = useSiderStore.getState()
  const header = useHeaderStore.getState()
  const thirdParty = useThirdPartyApiStore.getState()
  const chatTools = useChatToolsStore.getState()
  const knowledge = useKnowledgeStore.getState()
  const agent = useAgentStore.getState()

  try {
    const res = await ipcInvoke('chat:get_chat_list')
    const list: ChatItemInfo[] = res.message
    sider.setChatList(list)

    if (list.length && sider.currentContextId === sider.contextIdForDel) {
      const first = list[0]
      sider.setCurrentContextId(first.context_id)

      // 智能体判断
      if (first.agent_info) {
        sider.setCurrentChatTitle(first.agent_info.agent_title)
        agent.setCurrentChatAgent(first.agent_info)
      } else {
        sider.setCurrentChatTitle(first.title)
      }

      // 模型判断
      if (first.supplierName === 'ollama') {
        header.setCurrentModel(first.model + ':' + first.parameters)
      } else {
        header.setCurrentModel(first.model)
      }
      thirdParty.setCurrentSupplierName(first.supplierName!)
      chatTools.setNetActive(!!first.search_type)
      knowledge.setActiveKnowledgeForChat(first.rag_list || [])

      getChatInfo(first.context_id)
    }
  } catch (error) {
    console.error(error)
  }
}

/**
 * 创建新对话：重置前端状态
 */

export function createNewComu() {
  const sider = useSiderStore.getState()
  const chatContent = useChatContentStore.getState()
  const agent = useAgentStore.getState()
  const knowledge = useKnowledgeStore.getState()
  const chatTools = useChatToolsStore.getState()

  sider.setCurrentContextId('')
  sider.setCurrentChatTitle(t('新对话'))
  chatContent.setChatHistory(new Map())
  knowledge.setActiveKnowledgeForChat([])
  chatTools.setNetActive(false)
  knowledge.setActiveKnowledge(null)
  knowledge.setActiveKnowledgeDto(null)

  // 如果是智能体对话
  if (agent.chatForAgent && agent.currentAgent) {
    sider.setCurrentChatTitle(agent.currentAgent.agent_name)
  }

  knowledgeIsClose()
}

/**
 * 创建新对话：发起 IPC 请求
 */
export async function createChat() {
  const header = useHeaderStore.getState()
  const sider = useSiderStore.getState()
  const chatTools = useChatToolsStore.getState()
  const agent = useAgentStore.getState()

  const [model, parameters] = header.currentModel.split(':')

  try {
    const res = await ipcInvoke('chat:create_chat', {
      model,
      parameters,
      title: chatTools.questionContent,
      agent_name: agent.currentAgent?.agent_name,
    })
    sider.setCurrentContextId(res.message.context_id)
    await getChatList()
    agent.setChatForAgent(false)
    agent.setCurrentAgent(null)
  } catch (error) {
    console.error(error)
  }
}

/**
 * 获取对话详情
 */
export async function getChatInfo(context_id: string) {
  const chatContent = useChatContentStore.getState()
  try {
    const res = await ipcInvoke('chat:get_chat_info', { context_id })
    if (res.code === 200) {
      chatContent.setChatHistory(generateObject(res.message))
    }
  } catch (error) {
    console.error(error)
  }
}

/**
 * 拼接对话记录
 */
function generateObject(arr: any): ChatInfo {
  const result: ChatInfo = new Map()
  for (let i = 0; i < arr.length; i += 2) {
    const key = {
      content: arr[i].content,
      files: arr[i].doc_files || [],
      images: arr[i].images || [],
    }
    let value: string | string[]
    if (Array.isArray(arr[i + 1]?.content)) {
      const contentArr: string[] = []
      for (let j = 0; j < arr[i + 1].content.length; j++) {
        contentArr.push(arr[i + 1].reasoning[j] + arr[i + 1].content[j])
      }
      value = contentArr
    } else {
      value = arr[i + 1] ? arr[i + 1].reasoning + arr[i + 1].content : t('模型异常，请重新生成')
    }
    result.set(key, {
      content: value,
      stat: arr[i + 1]?.stat,
      search_result: arr[i + 1]?.search_result,
      tools_result: arr[i + 1]?.tools_result,
      id: arr[i + 1]?.id,
    })
  }
  return result
}

/**
 * 删除对话
 */
export async function removeChat(context_id: string) {
  const sider = useSiderStore.getState()
  try {
    const res = await ipcInvoke('chat:remove_chat', { context_id })
    if (res.code === 200) {
      message.success(t('对话删除成功'))
      getChatList()
      sider.setChatRemoveConfirm(false)
    } else {
      message.error(`${t('对话删除失败：')}${res.error_msg}`)
    }
  } catch (error) {
    console.error(error)
  }
}

/**
 * 修改对话标题
 */
export async function modifyChatTitle(params: { context_id: string; title: string }) {
  const sider = useSiderStore.getState()
  try {
    const res = await ipcInvoke('chat:modify_chat_title', params)
    if (res.code === 200) {
      message.success(t('对话标题修改成功'))
      getChatList()
      sider.setChatModifyConfirm(false)
    } else {
      message.error(`${t('对话标题修改失败:')}${res.error_msg}`)
    }
  } catch (error) {
    console.error(error)
  }
}

/**
 * 选择已有对话
 */
export async function handleChoose(chat: ChatItemInfo) {
  const sider = useSiderStore.getState()
  const agent = useAgentStore.getState()
  const chatContent = useChatContentStore.getState()
  const header = useHeaderStore.getState()
  const thirdParty = useThirdPartyApiStore.getState()
  const knowledge = useKnowledgeStore.getState()
  const chatTools = useChatToolsStore.getState()

  if (chat.agent_info) {
    agent.setCurrentChatAgent(chat.agent_info)
  } else {
    agent.setCurrentChatAgent(null)
  }

  chatContent.setUserScrollSelf(false)
  sider.setCurrentContextId(chat.context_id)
  sider.setCurrentChatTitle(chat.title)

  if (chat.supplierName === 'ollama') {
    header.setCurrentModel(`${chat.model}:${chat.parameters}`)
  } else {
    header.setCurrentModel(chat.model)
  }
  thirdParty.setCurrentSupplierName(chat.supplierName!)
  header.setCurrentModelDto({
    model: chat.model,
    parameters: chat.parameters,
    supplierName: chat.supplierName!,
  })

  getChatInfo(chat.context_id)
  knowledge.setActiveKnowledgeForChat(chat.rag_list || [])
  chatTools.setNetActive(!!chat.search_type)
}

/**
 * 对话操作（删除/修改标题）
 */
export function doChatOperateSelect(val: string, context_id: string) {
  const sider = useSiderStore.getState()
  if (val === 'delChat') {
    sider.setContextIdForDel(context_id)
    sider.setChatRemoveConfirm(true)
  } else if (val === 'modifyTitle') {
    sider.setContextIdForModify(context_id)
    sider.setNewChatTitle('')
    sider.setChatModifyConfirm(true)
  }
}

/**
 * 新建对话
 */
export function makeNewChat() {
  const agent = useAgentStore.getState()
  agent.setCurrentChatAgent(null)
  createNewComu()
}

/**
 * 折叠侧边栏
 */
export function doFold() {
  const sider = useSiderStore.getState()
  sider.setSiderWidth(0)
  sider.setIsFold(true)
}

/**
 * 知识库操作
 */
export function dealPopOperation(val: string, knowledge: any) {
  // Phase 5 实现，占位
  console.log('dealPopOperation', val, knowledge)
}

/**
 * 打开第三方模型弹窗
 */
export function openThirdPartyModel() {
  const tp = useThirdPartyApiStore.getState()
  tp.setThirdPartyApiShow(true)
}

/**
 * 关闭知识库侧栏
 */
export function knowledgeIsClose() {
  const knowledge = useKnowledgeStore.getState()
  knowledge.setKnowledgeSiderWidth(0)
  knowledge.setActiveKnowledge(null)
}

/**
 * 清空对话 — 打开确认弹窗
 */
export function cleanAllChats() {
  const sider = useSiderStore.getState()
  sider.setChatClearConfirm(true)
}

/**
 * 取消清空对话
 */
export function cancelCleanAllChats() {
  const sider = useSiderStore.getState()
  sider.setChatClearConfirm(false)
}

/**
 * 确定清空对话
 */
export async function confirmCleanAllChats() {
  const chatContent = useChatContentStore.getState()
  const sider = useSiderStore.getState()

  const allContextId = sider.chatList.map((item) => item.context_id).join(',')
  await ipcInvoke('chat:remove_chat', { context_id: allContextId })
  message.success(t('删除成功'))
  getChatList()
  chatContent.setChatHistory(new Map())
  cancelCleanAllChats()
}
