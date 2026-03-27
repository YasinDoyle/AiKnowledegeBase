import { create } from 'zustand'
import type { CurrentModelDto, MultipleModelListDto, SupplierModelItem } from '@/types'

export interface ShareItem {
  share_id: string
  title: string
  context_id: string
  model: string
  password: string
  is_use_context: number
  create_time: number
  url?: string
}

interface HeaderState {
  modelList: SupplierModelItem[]
  modelListSource: Record<string, SupplierModelItem[]>
  currentModelDto: CurrentModelDto | null
  currentModel: string
  modelListFilterKey: string
  modelListShow: boolean
  multipleModelList: MultipleModelListDto[]
  shareShow: boolean

  // Share
  shareSelectModel: string
  shareTitle: string
  sharePassword: string
  shareIsUseContext: number
  shareList: ShareItem[]
  shareCreateShow: boolean
  shareModifyShow: boolean
  currentShareModify: ShareItem | null

  setCurrentModel: (m: string) => void
  setCurrentModelDto: (d: CurrentModelDto | null) => void
  setModelList: (l: SupplierModelItem[]) => void
  setModelListSource: (s: Record<string, SupplierModelItem[]>) => void
  setModelListShow: (v: boolean) => void
  setModelListFilterKey: (k: string) => void
  setMultipleModelList: (l: MultipleModelListDto[]) => void
  setShareShow: (v: boolean) => void
  setShareSelectModel: (m: string) => void
  setShareTitle: (t: string) => void
  setSharePassword: (p: string) => void
  setShareIsUseContext: (v: number) => void
  setShareList: (l: ShareItem[]) => void
  setShareCreateShow: (v: boolean) => void
  setShareModifyShow: (v: boolean) => void
  setCurrentShareModify: (s: ShareItem | null) => void
}

const useHeaderStore = create<HeaderState>((set) => ({
  modelList: [],
  modelListSource: {},
  currentModelDto: null,
  currentModel: '',
  modelListFilterKey: '',
  modelListShow: false,
  multipleModelList: [],
  shareShow: false,

  shareSelectModel: '',
  shareTitle: '',
  sharePassword: '',
  shareIsUseContext: 0,
  shareList: [],
  shareCreateShow: false,
  shareModifyShow: false,
  currentShareModify: null,

  setCurrentModel: (m) => set({ currentModel: m }),
  setCurrentModelDto: (d) => set({ currentModelDto: d }),
  setModelList: (l) => set({ modelList: l }),
  setModelListSource: (s) => set({ modelListSource: s }),
  setModelListShow: (v) => set({ modelListShow: v }),
  setModelListFilterKey: (k) => set({ modelListFilterKey: k }),
  setMultipleModelList: (l) => set({ multipleModelList: l }),
  setShareShow: (v) => set({ shareShow: v }),
  setShareSelectModel: (m) => set({ shareSelectModel: m }),
  setShareTitle: (t) => set({ shareTitle: t }),
  setSharePassword: (p) => set({ sharePassword: p }),
  setShareIsUseContext: (v) => set({ shareIsUseContext: v }),
  setShareList: (l) => set({ shareList: l }),
  setShareCreateShow: (v) => set({ shareCreateShow: v }),
  setShareModifyShow: (v) => set({ shareModifyShow: v }),
  setCurrentShareModify: (s) => set({ currentShareModify: s }),
}))

export default useHeaderStore
