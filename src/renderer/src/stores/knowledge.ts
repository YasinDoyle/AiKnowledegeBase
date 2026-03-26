import { create } from 'zustand'
import type { KnowledgeDocumentInfo, ActiveKnowledgeDto, ActiveKnowledgeDocDto } from '@/types'

interface KnowledgeState {
  knowledgeList: KnowledgeDocumentInfo[]
  addingKnowledge: boolean
  activeKnowledge: string | null
  activeKnowledgeDto: ActiveKnowledgeDto | null
  activeKnowledgeForChat: string[]
  knowledgeSiderWidth: number
  activeKnowledgeDocList: ActiveKnowledgeDocDto[]
  createKnowledgeShow: boolean

  setKnowledgeList: (l: KnowledgeDocumentInfo[]) => void
  setActiveKnowledge: (k: string | null) => void
  setActiveKnowledgeDto: (d: ActiveKnowledgeDto | null) => void
  setActiveKnowledgeForChat: (l: string[]) => void
  setKnowledgeSiderWidth: (w: number) => void
  setCreateKnowledgeShow: (v: boolean) => void
}

const useKnowledgeStore = create<KnowledgeState>((set) => ({
  knowledgeList: [],
  addingKnowledge: false,
  activeKnowledge: null,
  activeKnowledgeDto: null,
  activeKnowledgeForChat: [],
  knowledgeSiderWidth: 0,
  activeKnowledgeDocList: [],
  createKnowledgeShow: false,

  setKnowledgeList: (l) => set({ knowledgeList: l }),
  setActiveKnowledge: (k) => set({ activeKnowledge: k }),
  setActiveKnowledgeDto: (d) => set({ activeKnowledgeDto: d }),
  setActiveKnowledgeForChat: (l) => set({ activeKnowledgeForChat: l }),
  setKnowledgeSiderWidth: (w) => set({ knowledgeSiderWidth: w }),
  setCreateKnowledgeShow: (v) => set({ createKnowledgeShow: v }),
}))

export default useKnowledgeStore
