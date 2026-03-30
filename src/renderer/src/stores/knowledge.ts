import { create } from 'zustand'
import type {
  KnowledgeDocumentInfo,
  ActiveKnowledgeDto,
  ActiveKnowledgeDocDto,
  CreateKnowledgeFormData,
  TestDocChunkParams,
} from '@/types'

interface KnowledgeState {
  // 知识库列表
  knowledgeList: KnowledgeDocumentInfo[]
  addingKnowledge: boolean
  activeKnowledge: string | null
  activeKnowledgeDto: ActiveKnowledgeDto | null
  activeKnowledgeForChat: string[]
  knowledgeSiderWidth: number
  activeKnowledgeDocList: ActiveKnowledgeDocDto[]
  createKnowledgeShow: boolean
  // 创建知识库表单
  createKnowledgeFormData: CreateKnowledgeFormData
  // embedding 模型列表
  embeddingModelsList: any[]
  // 删除知识库
  deleteKnowledgeShow: boolean
  deleteKnowledgeDoc: ActiveKnowledgeDocDto | null
  deleteKnowledgeDocShow: boolean
  // 文档解析状态
  docParseStatus: boolean
  // 文档内容
  docContent: string
  // 上传相关
  knowledgeUploadDocShow: boolean
  isUploadingDoc: boolean
  uploadMode: 'file' | 'dir'
  fileOrDirList: string[]
  chooseList: any[]
  // 分片设置
  sliceChunkFormData: TestDocChunkParams
  customSeparators: boolean
  slicePreviewList: any[]
  // 安装 embedding
  installEmbeddingShow: boolean
  // 优化知识库
  optimizeKnowledgeShow: boolean
  // 知识库选择面板
  knowledgeChoosePanelShow: boolean
  // 文档通用配置
  knowledgeDocConfigShow: boolean

  setKnowledgeList: (l: KnowledgeDocumentInfo[]) => void
  setActiveKnowledge: (k: string | null) => void
  setActiveKnowledgeDto: (d: ActiveKnowledgeDto | null) => void
  setActiveKnowledgeForChat: (l: string[]) => void
  setKnowledgeSiderWidth: (w: number) => void
  setCreateKnowledgeShow: (v: boolean) => void
  setCreateKnowledgeFormData: (d: Partial<CreateKnowledgeFormData>) => void
  resetCreateKnowledgeFormData: () => void
  setEmbeddingModelsList: (l: any[]) => void
  setDeleteKnowledgeShow: (v: boolean) => void
  setDeleteKnowledgeDoc: (d: ActiveKnowledgeDocDto | null) => void
  setDeleteKnowledgeDocShow: (v: boolean) => void
  setDocParseStatus: (v: boolean) => void
  setDocContent: (c: string) => void
  setKnowledgeUploadDocShow: (v: boolean) => void
  setIsUploadingDoc: (v: boolean) => void
  setUploadMode: (m: 'file' | 'dir') => void
  setFileOrDirList: (l: string[]) => void
  setChooseList: (l: any[]) => void
  setSliceChunkFormData: (d: Partial<TestDocChunkParams>) => void
  setCustomSeparators: (v: boolean) => void
  setSlicePreviewList: (l: any[]) => void
  setInstallEmbeddingShow: (v: boolean) => void
  setOptimizeKnowledgeShow: (v: boolean) => void
  setKnowledgeChoosePanelShow: (v: boolean) => void
  setKnowledgeDocConfigShow: (v: boolean) => void
  setActiveKnowledgeDocList: (l: ActiveKnowledgeDocDto[]) => void
}

const defaultCreateForm: CreateKnowledgeFormData = {
  ragName: '',
  ragDesc: '',
  supplierName: '',
  embeddingModel: '',
  maxRecall: 5,
}

const defaultSliceForm: TestDocChunkParams = {
  filename: '',
  chunkSize: 500,
  overlapSize: 50,
  separators: [],
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
  createKnowledgeFormData: { ...defaultCreateForm },
  embeddingModelsList: [],
  deleteKnowledgeShow: false,
  deleteKnowledgeDoc: null,
  deleteKnowledgeDocShow: false,
  docParseStatus: false,
  docContent: '',
  knowledgeUploadDocShow: false,
  isUploadingDoc: false,
  uploadMode: 'file',
  fileOrDirList: [],
  chooseList: [],
  sliceChunkFormData: { ...defaultSliceForm },
  customSeparators: false,
  slicePreviewList: [],
  installEmbeddingShow: false,
  optimizeKnowledgeShow: false,
  knowledgeChoosePanelShow: false,
  knowledgeDocConfigShow: false,

  setKnowledgeList: (l) => set({ knowledgeList: l }),
  setActiveKnowledge: (k) => set({ activeKnowledge: k }),
  setActiveKnowledgeDto: (d) => set({ activeKnowledgeDto: d }),
  setActiveKnowledgeForChat: (l) => set({ activeKnowledgeForChat: l }),
  setKnowledgeSiderWidth: (w) => set({ knowledgeSiderWidth: w }),
  setCreateKnowledgeShow: (v) => set({ createKnowledgeShow: v }),
  setCreateKnowledgeFormData: (d) =>
    set((s) => ({ createKnowledgeFormData: { ...s.createKnowledgeFormData, ...d } })),
  resetCreateKnowledgeFormData: () => set({ createKnowledgeFormData: { ...defaultCreateForm } }),
  setEmbeddingModelsList: (l) => set({ embeddingModelsList: l }),
  setDeleteKnowledgeShow: (v) => set({ deleteKnowledgeShow: v }),
  setDeleteKnowledgeDoc: (d) => set({ deleteKnowledgeDoc: d }),
  setDeleteKnowledgeDocShow: (v) => set({ deleteKnowledgeDocShow: v }),
  setDocParseStatus: (v) => set({ docParseStatus: v }),
  setDocContent: (c) => set({ docContent: c }),
  setKnowledgeUploadDocShow: (v) => set({ knowledgeUploadDocShow: v }),
  setIsUploadingDoc: (v) => set({ isUploadingDoc: v }),
  setUploadMode: (m) => set({ uploadMode: m }),
  setFileOrDirList: (l) => set({ fileOrDirList: l }),
  setChooseList: (l) => set({ chooseList: l }),
  setSliceChunkFormData: (d) =>
    set((s) => ({ sliceChunkFormData: { ...s.sliceChunkFormData, ...d } })),
  setCustomSeparators: (v) => set({ customSeparators: v }),
  setSlicePreviewList: (l) => set({ slicePreviewList: l }),
  setInstallEmbeddingShow: (v) => set({ installEmbeddingShow: v }),
  setOptimizeKnowledgeShow: (v) => set({ optimizeKnowledgeShow: v }),
  setKnowledgeChoosePanelShow: (v) => set({ knowledgeChoosePanelShow: v }),
  setKnowledgeDocConfigShow: (v) => set({ knowledgeDocConfigShow: v }),
  setActiveKnowledgeDocList: (l) => set({ activeKnowledgeDocList: l }),
}))

export default useKnowledgeStore
