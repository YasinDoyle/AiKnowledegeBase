import { create } from 'zustand'
import type { AgentItemDto } from '@/types'

interface CreateAgentFormData {
  agent_name: string
  agent_title: string
  prompt: string
  icon: string
}

interface AgentState {
  agentShow: boolean
  agentList: AgentItemDto[]
  chatForAgent: boolean
  currentAgent: AgentItemDto | null
  currentChatAgent: AgentItemDto | null
  createAgentShow: boolean
  createAgentFormData: CreateAgentFormData
  isEditAgent: boolean
  agentForDel: AgentItemDto | null
  delAgentShow: boolean

  setAgentShow: (v: boolean) => void
  setAgentList: (l: AgentItemDto[]) => void
  setChatForAgent: (v: boolean) => void
  setCurrentAgent: (a: AgentItemDto | null) => void
  setCurrentChatAgent: (a: AgentItemDto | null) => void
  setCreateAgentShow: (v: boolean) => void
  setCreateAgentFormData: (d: Partial<CreateAgentFormData>) => void
  resetCreateAgentFormData: () => void
  setIsEditAgent: (v: boolean) => void
  setAgentForDel: (a: AgentItemDto | null) => void
  setDelAgentShow: (v: boolean) => void
}

const defaultFormData: CreateAgentFormData = {
  agent_name: '',
  agent_title: '',
  prompt: '',
  icon: '🤖',
}

const useAgentStore = create<AgentState>((set) => ({
  agentShow: false,
  agentList: [],
  chatForAgent: false,
  currentAgent: null,
  currentChatAgent: null,
  createAgentShow: false,
  createAgentFormData: { ...defaultFormData },
  isEditAgent: false,
  agentForDel: null,
  delAgentShow: false,

  setAgentShow: (v) => set({ agentShow: v }),
  setAgentList: (l) => set({ agentList: l }),
  setChatForAgent: (v) => set({ chatForAgent: v }),
  setCurrentAgent: (a) => set({ currentAgent: a }),
  setCurrentChatAgent: (a) => set({ currentChatAgent: a }),
  setCreateAgentShow: (v) => set({ createAgentShow: v }),
  setCreateAgentFormData: (d) =>
    set((s) => ({ createAgentFormData: { ...s.createAgentFormData, ...d } })),
  resetCreateAgentFormData: () => set({ createAgentFormData: { ...defaultFormData } }),
  setIsEditAgent: (v) => set({ isEditAgent: v }),
  setAgentForDel: (a) => set({ agentForDel: a }),
  setDelAgentShow: (v) => set({ delAgentShow: v }),
}))

export default useAgentStore
