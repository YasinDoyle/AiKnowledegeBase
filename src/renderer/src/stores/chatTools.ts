import { create } from 'zustand'
import type { McpServerListDto } from '@/types'

interface ChatToolsState {
  chatMask: { status: boolean; notice: string }
  questionContent: string
  questionFileList: string[]
  questionImageList: string[]
  questionFilesCache: File[]
  questionFiles: string[]
  questionImages: string[]
  tempChat: boolean
  netActive: boolean
  mcpListForChat: McpServerListDto[]
  mcpListChoosed: string[]
  compareId: string

  setChatMask: (v: { status: boolean; notice: string }) => void
  setQuestionContent: (v: string) => void
  setQuestionFileList: (v: string[]) => void
  setQuestionImageList: (v: string[]) => void
  setQuestionFilesCache: (v: File[]) => void
  setQuestionFiles: (v: string[]) => void
  setQuestionImages: (v: string[]) => void
  setTempChat: (v: boolean) => void
  setNetActive: (v: boolean) => void
  setMcpListForChat: (v: McpServerListDto[]) => void
  setMcpListChoosed: (v: string[]) => void
  setCompareId: (v: string) => void
}

const useChatToolsStore = create<ChatToolsState>((set) => ({
  chatMask: { status: false, notice: '' },
  questionContent: '',
  questionFileList: [],
  questionImageList: [],
  questionFilesCache: [],
  questionFiles: [],
  questionImages: [],
  tempChat: false,
  netActive: false,
  mcpListForChat: [],
  mcpListChoosed: [],
  compareId: '',

  setChatMask: (v) => set({ chatMask: v }),
  setQuestionContent: (v) => set({ questionContent: v }),
  setQuestionFileList: (v) => set({ questionFileList: v }),
  setQuestionImageList: (v) => set({ questionImageList: v }),
  setQuestionFilesCache: (v) => set({ questionFilesCache: v }),
  setQuestionFiles: (v) => set({ questionFiles: v }),
  setQuestionImages: (v) => set({ questionImages: v }),
  setTempChat: (v) => set({ tempChat: v }),
  setNetActive: (v) => set({ netActive: v }),
  setMcpListForChat: (v) => set({ mcpListForChat: v }),
  setMcpListChoosed: (v) => set({ mcpListChoosed: v }),
  setCompareId: (v) => set({ compareId: v }),
}))

export default useChatToolsStore
