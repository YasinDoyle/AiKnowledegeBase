import { create } from 'zustand'
import storage from '@/utils/storage'

interface ThemeColors {
  markdownCodeLight: string
  markdownCOdeDark: string
  markdownToolsLight: string
  markdownToolsDark: string
  markdownToolsFontColorLight: string
  markdownToolsFontColorDark: string
  thinkWrapperLight: string
  thinlWrapperDark: string
  questionToolBgLight: string
  questionToolBgDark: string
}

interface SoftSettingsState {
  softSettingsShow: boolean
  themeMode: string
  themeColors: ThemeColors
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
  themeColors: {
    markdownCodeLight: '#F9FAFB',
    markdownCOdeDark: 'rgb(97 96 96 / 14%)',
    markdownToolsLight: '#F3F4F6',
    markdownToolsDark: 'rgb(97 96 96 / 34%)',
    markdownToolsFontColorLight: '#545454',
    markdownToolsFontColorDark: 'inherit',
    thinkWrapperLight: '#f5f5f5',
    thinlWrapperDark: 'rgb(97 96 96 / 14%)',
    questionToolBgLight: 'transparent',
    questionToolBgDark: '#28282C',
  },
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
