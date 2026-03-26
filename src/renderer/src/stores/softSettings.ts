import { create } from 'zustand'
import storage from '@/utils/storage'

interface SoftSettingsState {
  softSettingsShow: boolean
  themeMode: string
  currentLanguage: string
  targetNet: string
  version: string

  setSoftSettingsShow: (v: boolean) => void
  setThemeMode: (m: string) => void
  setCurrentLanguage: (l: string) => void
  setTargetNet: (t: string) => void
  setVersion: (v: string) => void
}

const useSoftSettingsStore = create<SoftSettingsState>((set) => ({
  softSettingsShow: false,
  themeMode: storage.themeMode || 'light',
  currentLanguage: storage.language || 'zh',
  targetNet: 'baidu',
  version: '1.0.0',

  setSoftSettingsShow: (v) => set({ softSettingsShow: v }),
  setThemeMode: (m) => set({ themeMode: m }),
  setCurrentLanguage: (l) => set({ currentLanguage: l }),
  setTargetNet: (t) => set({ targetNet: t }),
  setVersion: (v) => set({ version: v }),
}))

export default useSoftSettingsStore
