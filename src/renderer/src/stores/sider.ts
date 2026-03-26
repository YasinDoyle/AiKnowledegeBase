import { create } from 'zustand'
import type { ChatItemInfo } from '@/types'

interface SiderState {
  siderWidth: number
  isFold: boolean
  chatList: ChatItemInfo[]
  currentContextId: string
  chatRemoveConfirm: boolean
  chatModifyConfirm: boolean
  contextIdForDel: string
  contextIdForModify: string
  newChatTitle: string
  currentChatTitle: string
  chatClearConfirm: boolean

  setSiderWidth: (w: number) => void
  setIsFold: (f: boolean) => void
  setChatList: (list: ChatItemInfo[]) => void
  setCurrentContextId: (id: string) => void
  setChatRemoveConfirm: (v: boolean) => void
  setChatModifyConfirm: (v: boolean) => void
  setContextIdForDel: (id: string) => void
  setContextIdForModify: (id: string) => void
  setNewChatTitle: (t: string) => void
  setCurrentChatTitle: (t: string) => void
  setChatClearConfirm: (v: boolean) => void
}

const useSiderStore = create<SiderState>((set) => ({
  siderWidth: 220,
  isFold: false,
  chatList: [],
  currentContextId: '',
  chatRemoveConfirm: false,
  chatModifyConfirm: false,
  contextIdForDel: '',
  contextIdForModify: '',
  newChatTitle: '',
  currentChatTitle: '',
  chatClearConfirm: false,

  setSiderWidth: (w) => set({ siderWidth: w }),
  setIsFold: (f) => set({ isFold: f }),
  setChatList: (list) => set({ chatList: list }),
  setCurrentContextId: (id) => set({ currentContextId: id }),
  setChatRemoveConfirm: (v) => set({ chatRemoveConfirm: v }),
  setChatModifyConfirm: (v) => set({ chatModifyConfirm: v }),
  setContextIdForDel: (id) => set({ contextIdForDel: id }),
  setContextIdForModify: (id) => set({ contextIdForModify: id }),
  setNewChatTitle: (t) => set({ newChatTitle: t }),
  setCurrentChatTitle: (t) => set({ currentChatTitle: t }),
  setChatClearConfirm: (v) => set({ chatClearConfirm: v }),
}))

export default useSiderStore
