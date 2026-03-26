import { create } from 'zustand'
import type { CurrentModelDto, MultipleModelListDto } from '@/types'

interface HeaderState {
  modelList: any[]
  modelListSource: any
  currentModelDto: CurrentModelDto | null
  currentModel: string
  modelListFilterKey: string
  modelListShow: boolean
  multipleModelList: MultipleModelListDto[]
  shareShow: boolean

  setCurrentModel: (m: string) => void
  setCurrentModelDto: (d: CurrentModelDto | null) => void
  setModelList: (l: any[]) => void
  setModelListSource: (s: any) => void
  setModelListShow: (v: boolean) => void
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

  setCurrentModel: (m) => set({ currentModel: m }),
  setCurrentModelDto: (d) => set({ currentModelDto: d }),
  setModelList: (l) => set({ modelList: l }),
  setModelListSource: (s) => set({ modelListSource: s }),
  setModelListShow: (v) => set({ modelListShow: v }),
}))

export default useHeaderStore
