import { ipcInvoke } from '@/api'
import { message } from '@/utils/message'
import i18n from '@/i18n'
import useAgentStore from '@/stores/agent'
import useSiderStore from '@/stores/sider'
import type { AgentItemDto } from '@/types'

const t = i18n.t.bind(i18n)

/** 获取智能体列表 */
export async function getAgentList() {
  try {
    const res = await ipcInvoke('agent:get_agent_list')
    if (res.code === 200) {
      useAgentStore.getState().setAgentList(res.message)
    }
  } catch (err) {
    console.error('getAgentList', err)
  }
}

/** 创建/修改智能体 */
export async function createAgent() {
  const { createAgentFormData, isEditAgent } = useAgentStore.getState()
  if (!createAgentFormData.agent_title) {
    message.warning(t('请输入智能体名称'))
    return
  }
  if (!createAgentFormData.prompt) {
    message.warning(t('请输入智能体提示词'))
    return
  }
  try {
    const channel = isEditAgent ? 'agent:modify_agent' : 'agent:create_agent'
    const res = await ipcInvoke(channel, createAgentFormData)
    if (res.code === 200) {
      message.success(isEditAgent ? t('修改成功') : t('创建成功'))
      useAgentStore.getState().setCreateAgentShow(false)
      useAgentStore.getState().resetCreateAgentFormData()
      useAgentStore.getState().setIsEditAgent(false)
      await getAgentList()
    } else {
      message.error(res.msg || t('操作失败'))
    }
  } catch (err) {
    console.error('createAgent', err)
  }
}

/** 打开创建智能体弹窗 */
export function openCreateAgent() {
  const store = useAgentStore.getState()
  store.resetCreateAgentFormData()
  store.setIsEditAgent(false)
  store.setCreateAgentShow(true)
}

/** 打开编辑智能体弹窗 */
export function openEditAgent(agent: AgentItemDto) {
  const store = useAgentStore.getState()
  store.setCreateAgentFormData({
    agent_name: agent.agent_name,
    agent_title: agent.agent_title,
    prompt: agent.prompt,
    icon: agent.icon,
  })
  store.setIsEditAgent(true)
  store.setCreateAgentShow(true)
}

/** 关闭创建智能体弹窗 */
export function closeCreateAgent() {
  const store = useAgentStore.getState()
  store.setCreateAgentShow(false)
  store.resetCreateAgentFormData()
  store.setIsEditAgent(false)
}

/** 选择智能体用于对话 */
export function chooseAgentForChat(agent: AgentItemDto) {
  const agentStore = useAgentStore.getState()
  const siderStore = useSiderStore.getState()
  agentStore.setCurrentChatAgent(agent)
  agentStore.setChatForAgent(true)
  agentStore.setAgentShow(false)
  // 创建新对话
  siderStore.setIsNewChat(true)
}

/** 打开智能体面板 */
export function openAgent() {
  useAgentStore.getState().setAgentShow(true)
  getAgentList()
}

/** 关闭智能体面板 */
export function closeAgent() {
  useAgentStore.getState().setAgentShow(false)
}

/** 打开删除智能体确认 */
export function removeAgent(agent: AgentItemDto) {
  const store = useAgentStore.getState()
  store.setAgentForDel(agent)
  store.setDelAgentShow(true)
}

/** 取消删除 */
export function cancelDelAgent() {
  const store = useAgentStore.getState()
  store.setDelAgentShow(false)
  store.setAgentForDel(null)
}

/** 确认删除智能体 */
export async function confirmDelAgent() {
  const { agentForDel } = useAgentStore.getState()
  if (!agentForDel) return
  try {
    const res = await ipcInvoke('agent:remove_agent', { agent_name: agentForDel.agent_name })
    if (res.code === 200) {
      message.success(t('删除成功'))
      cancelDelAgent()
      await getAgentList()
    } else {
      message.error(res.msg || t('删除失败'))
    }
  } catch (err) {
    console.error('confirmDelAgent', err)
  }
}

/** 处理智能体操作下拉 */
export function handleAgentOperation(key: string, agent: AgentItemDto) {
  if (key === 'edit') {
    openEditAgent(agent)
  } else if (key === 'delete') {
    removeAgent(agent)
  }
}
