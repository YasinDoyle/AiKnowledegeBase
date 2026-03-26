import { create } from 'zustand'
import type { AgentItemDto } from '@/types'

interface AgentState {
  agentShow: boolean
  agentList: AgentItemDto[]
  chatForAgent: boolean
  currentAgent: AgentItemDto | null
  currentChatAgent: AgentItemDto | null

  setAgentShow: (v: boolean) => void
  setChatForAgent: (v: boolean) => void
  setCurrentAgent: (a: AgentItemDto | null) => void
  setCurrentChatAgent: (a: AgentItemDto | null) => void
}

const useAgentStore = create<AgentState>((set) => ({
  agentShow: false,
  agentList: [],
  chatForAgent: false,
  currentAgent: null,
  currentChatAgent: null,

  setAgentShow: (v) => set({ agentShow: v }),
  setChatForAgent: (v) => set({ chatForAgent: v }),
  setCurrentAgent: (a) => set({ currentAgent: a }),
  setCurrentChatAgent: (a) => set({ currentChatAgent: a }),
}))

export default useAgentStore
