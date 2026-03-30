import { create } from 'zustand'
import type {
  ThirdPartyApiServiceItem,
  SupplierModelItem,
  AddThirdPartySupplierMode,
  AddSupplierFormData,
  SupplierConfigInfo,
} from '@/types'

interface ThirdPartyApiState {
  thirdPartyApiShow: boolean
  thirdPartyApiServiceList: ThirdPartyApiServiceItem[]
  currentChooseApi: ThirdPartyApiServiceItem | null
  supplierModelList: SupplierModelItem[]
  addSupplierModel: boolean
  addModelFormData: AddThirdPartySupplierMode
  deleteModelShow: boolean
  deleteModelName: string
  applierServiceConfig: SupplierConfigInfo
  deleteSupplierShow: boolean
  isAllModelEnable: boolean
  addSupplierShow: boolean
  addSupplierFormData: AddSupplierFormData
  isEditModelFormData: boolean
  currentModelNameForEdit: string
  currentSupplierName: string
  modelTitTemp: string
  cantChoose: boolean

  setThirdPartyApiShow: (v: boolean) => void
  setThirdPartyApiServiceList: (l: ThirdPartyApiServiceItem[]) => void
  setCurrentChooseApi: (a: ThirdPartyApiServiceItem | null) => void
  setSupplierModelList: (l: SupplierModelItem[]) => void
  setAddSupplierModel: (v: boolean) => void
  setAddModelFormData: (d: Partial<AddThirdPartySupplierMode>) => void
  resetAddModelFormData: () => void
  setDeleteModelShow: (v: boolean) => void
  setDeleteModelName: (n: string) => void
  setApplierServiceConfig: (c: Partial<SupplierConfigInfo>) => void
  setDeleteSupplierShow: (v: boolean) => void
  setIsAllModelEnable: (v: boolean) => void
  setAddSupplierShow: (v: boolean) => void
  setAddSupplierFormData: (d: Partial<AddSupplierFormData>) => void
  resetAddSupplierFormData: () => void
  setIsEditModelFormData: (v: boolean) => void
  setCurrentModelNameForEdit: (n: string) => void
  setCurrentSupplierName: (s: string) => void
  setModelTitTemp: (t: string) => void
  setCantChoose: (v: boolean) => void
}

const defaultModelForm: AddThirdPartySupplierMode = {
  modelName: '',
  capability: [],
  title: '',
}

const defaultSupplierForm: AddSupplierFormData = {
  supplierTitle: '',
  supplierName: '',
  baseUrl: '',
  apiKey: '',
}

const useThirdPartyApiStore = create<ThirdPartyApiState>((set) => ({
  thirdPartyApiShow: false,
  thirdPartyApiServiceList: [],
  currentChooseApi: null,
  supplierModelList: [],
  addSupplierModel: false,
  addModelFormData: { ...defaultModelForm },
  deleteModelShow: false,
  deleteModelName: '',
  applierServiceConfig: { baseUrl: '', apiKey: '' },
  deleteSupplierShow: false,
  isAllModelEnable: false,
  addSupplierShow: false,
  addSupplierFormData: { ...defaultSupplierForm },
  isEditModelFormData: false,
  currentModelNameForEdit: '',
  currentSupplierName: '',
  modelTitTemp: '',
  cantChoose: false,

  setThirdPartyApiShow: (v) => set({ thirdPartyApiShow: v }),
  setThirdPartyApiServiceList: (l) => set({ thirdPartyApiServiceList: l }),
  setCurrentChooseApi: (a) => set({ currentChooseApi: a }),
  setSupplierModelList: (l) => set({ supplierModelList: l }),
  setAddSupplierModel: (v) => set({ addSupplierModel: v }),
  setAddModelFormData: (d) => set((s) => ({ addModelFormData: { ...s.addModelFormData, ...d } })),
  resetAddModelFormData: () =>
    set({ addModelFormData: { ...defaultModelForm }, isEditModelFormData: false }),
  setDeleteModelShow: (v) => set({ deleteModelShow: v }),
  setDeleteModelName: (n) => set({ deleteModelName: n }),
  setApplierServiceConfig: (c) =>
    set((s) => ({ applierServiceConfig: { ...s.applierServiceConfig, ...c } })),
  setDeleteSupplierShow: (v) => set({ deleteSupplierShow: v }),
  setIsAllModelEnable: (v) => set({ isAllModelEnable: v }),
  setAddSupplierShow: (v) => set({ addSupplierShow: v }),
  setAddSupplierFormData: (d) =>
    set((s) => ({ addSupplierFormData: { ...s.addSupplierFormData, ...d } })),
  resetAddSupplierFormData: () => set({ addSupplierFormData: { ...defaultSupplierForm } }),
  setIsEditModelFormData: (v) => set({ isEditModelFormData: v }),
  setCurrentModelNameForEdit: (n) => set({ currentModelNameForEdit: n }),
  setCurrentSupplierName: (s) => set({ currentSupplierName: s }),
  setModelTitTemp: (t) => set({ modelTitTemp: t }),
  setCantChoose: (v) => set({ cantChoose: v }),
}))

export default useThirdPartyApiStore
