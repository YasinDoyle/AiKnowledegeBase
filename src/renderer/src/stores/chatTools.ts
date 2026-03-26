import { create } from 'zustand'

interface ChatToolsState {
  questionContent: string
  netActive: boolean
  mcpListChoosed: string[]

  setQuestionContent: (v: string) => void
  setNetActive: (v: boolean) => void
}

const useChatToolsStore = create<ChatToolsState>((set) => ({
  questionContent: '',
  netActive: false,
  mcpListChoosed: [],

  setQuestionContent: (v) => set({ questionContent: v }),
  setNetActive: (v) => set({ netActive: v }),
}))

export default useChatToolsStore
