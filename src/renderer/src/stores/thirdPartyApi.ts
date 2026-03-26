import { create } from 'zustand'
import type { ThirdPartyApiServiceItem } from '@/types'

interface ThirdPartyApiState {
  thirdPartyApiShow: boolean
  thirdPartyApiServiceList: ThirdPartyApiServiceItem[]
  currentSupplierName: string

  setThirdPartyApiShow: (v: boolean) => void
  setCurrentSupplierName: (s: string) => void
}

const useThirdPartyApiStore = create<ThirdPartyApiState>((set) => ({
  thirdPartyApiShow: false,
  thirdPartyApiServiceList: [],
  currentSupplierName: '',

  setThirdPartyApiShow: (v) => set({ thirdPartyApiShow: v }),
  setCurrentSupplierName: (s) => set({ currentSupplierName: s }),
}))

export default useThirdPartyApiStore
