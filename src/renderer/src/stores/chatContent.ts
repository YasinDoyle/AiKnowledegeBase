import { create } from 'zustand'
import type { ChatInfo } from '@/types'

interface ChatContentState {
  chatHistory: ChatInfo
  userScrollSelf: boolean
  scrollTop: number
  isInChat: boolean
  guideActive: boolean
  currentTalkingChatId: string

  setChatHistory: (h: ChatInfo) => void
  setUserScrollSelf: (v: boolean) => void
  setIsInChat: (v: boolean) => void
  setGuideActive: (v: boolean) => void
}

const useChatContentStore = create<ChatContentState>((set) => ({
  chatHistory: new Map(),
  userScrollSelf: false,
  scrollTop: 0,
  isInChat: false,
  guideActive: true,
  currentTalkingChatId: '',

  setChatHistory: (h) => set({ chatHistory: h }),
  setUserScrollSelf: (v) => set({ userScrollSelf: v }),
  setIsInChat: (v) => set({ isInChat: v }),
  setGuideActive: (v) => set({ guideActive: v }),
}))

export default useChatContentStore
