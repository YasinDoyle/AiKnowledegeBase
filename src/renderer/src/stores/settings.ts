import { create } from 'zustand'
import i18n from '@/i18n'
import type { InstallProgress } from '@/types'

interface SettingsState {
  settingsShow: boolean
  pcInfo: Record<string, any>
  visibleModelList: any[]
  modeType: string
  modelNameForInstall: { model: string; parameters: string }
  installShow: boolean
  modelInstallProgress: InstallProgress
  modelForDel: string
  modelDelLoading: boolean
  modelDelConfirm: boolean
  modelManagerInstallProgress: InstallProgress
  modelManagerInstallNotice: string
  modelManagerInstallPath: string
  modelManagerInstallProgresShow: boolean
  managerInstallConfirm: boolean
  managerForInstall: string
  isInstalledManager: boolean
  downloadText: string
  ollamaUrl: string
  isResetModelList: { status: boolean; type: number }
  filterList: any[]
  search: string
  page: number
  pageSize: number

  setSettingsShow: (v: boolean) => void
  setVisibleModelList: (l: any[]) => void
  setModeType: (m: string) => void
  setModelNameForInstall: (d: { model: string; parameters: string }) => void
  setInstallShow: (v: boolean) => void
  setModelInstallProgress: (p: InstallProgress) => void
  setModelForDel: (n: string) => void
  setModelDelLoading: (v: boolean) => void
  setModelDelConfirm: (v: boolean) => void
  setModelManagerInstallProgress: (p: InstallProgress) => void
  setModelManagerInstallNotice: (n: string) => void
  setModelManagerInstallPath: (p: string) => void
  setModelManagerInstallProgresShow: (v: boolean) => void
  setManagerInstallConfirm: (v: boolean) => void
  setManagerForInstall: (m: string) => void
  setIsInstalledManager: (v: boolean) => void
  setDownloadText: (t: string) => void
  setOllamaUrl: (u: string) => void
  setIsResetModelList: (d: { status: boolean; type: number }) => void
  setFilterList: (l: any[]) => void
  setSearch: (s: string) => void
  setPage: (p: number) => void
  setPageSize: (s: number) => void
  setPcInfo: (info: Record<string, any>) => void
}

const defaultInstallProgress: InstallProgress = {
  status: 0,
  digest: '',
  total: 0,
  completed: 0,
  progress: 0,
  speed: 0,
}

const useSettingsStore = create<SettingsState>((set) => ({
  settingsShow: false,
  pcInfo: {},
  visibleModelList: [],
  modeType: 'all',
  modelNameForInstall: { model: '', parameters: '' },
  installShow: false,
  modelInstallProgress: { ...defaultInstallProgress },
  modelForDel: '',
  modelDelLoading: false,
  modelDelConfirm: false,
  modelManagerInstallProgress: { ...defaultInstallProgress },
  modelManagerInstallNotice: '',
  modelManagerInstallPath: '',
  modelManagerInstallProgresShow: false,
  managerInstallConfirm: false,
  managerForInstall: 'ollama',
  isInstalledManager: false,
  downloadText: i18n.t('正在连接，请稍候...'),
  ollamaUrl: '',
  isResetModelList: { status: false, type: 0 },
  filterList: [],
  search: '',
  page: 1,
  pageSize: 10,

  setSettingsShow: (v) => set({ settingsShow: v }),
  setVisibleModelList: (l) => set({ visibleModelList: l }),
  setModeType: (m) => set({ modeType: m }),
  setModelNameForInstall: (d) => set({ modelNameForInstall: d }),
  setInstallShow: (v) => set({ installShow: v }),
  setModelInstallProgress: (p) => set({ modelInstallProgress: p }),
  setModelForDel: (n) => set({ modelForDel: n }),
  setModelDelLoading: (v) => set({ modelDelLoading: v }),
  setModelDelConfirm: (v) => set({ modelDelConfirm: v }),
  setModelManagerInstallProgress: (p) => set({ modelManagerInstallProgress: p }),
  setModelManagerInstallNotice: (n) => set({ modelManagerInstallNotice: n }),
  setModelManagerInstallPath: (p) => set({ modelManagerInstallPath: p }),
  setModelManagerInstallProgresShow: (v) => set({ modelManagerInstallProgresShow: v }),
  setManagerInstallConfirm: (v) => set({ managerInstallConfirm: v }),
  setManagerForInstall: (m) => set({ managerForInstall: m }),
  setIsInstalledManager: (v) => set({ isInstalledManager: v }),
  setDownloadText: (t) => set({ downloadText: t }),
  setOllamaUrl: (u) => set({ ollamaUrl: u }),
  setIsResetModelList: (d) => set({ isResetModelList: d }),
  setFilterList: (l) => set({ filterList: l }),
  setSearch: (s) => set({ search: s }),
  setPage: (p) => set({ page: p }),
  setPageSize: (s) => set({ pageSize: s }),
  setPcInfo: (info) => set({ pcInfo: info }),
}))

export default useSettingsStore
