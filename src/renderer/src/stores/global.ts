import { create } from 'zustand'
import storage from '@/utils/storage'
import { themeChange } from '@/assets/theme'

interface GlobalState {
  themeMode: 'light' | 'dark'
  setThemeMode: (mode: 'light' | 'dark') => void
  //派生样式值
  siderBg: string
  settingPanelBorder: string
  modalTitleBg: string
}

const useGlobalStore = create<GlobalState>((set) => ({
  themeMode: (storage.themeMode as 'light' | 'dark') || 'light',
  setThemeMode: (mode) => {
    storage.themeMode = mode
    themeChange(mode)
    set({
      themeMode: mode,
      siderBg: mode === 'light' ? 'var(--gray-1)' : 'var(--gray-9)',
      settingPanelBorder: mode === 'light' ? '1px solid var(--gray-3)' : '1px solid var(--gray-7)',
      modalTitleBg: mode === 'light' ? '#fafafa' : '#262626',
    })
  },
  // 初始值
  siderBg: (storage.themeMode || 'light') === 'light' ? 'var(--gray-1)' : 'var(--gray-9)',
  settingPanelBorder:
    (storage.themeMode || 'light') === 'light'
      ? '1px solid var(--gray-3)'
      : '1px solid var(--gray-7)',
  modalTitleBg: (storage.themeMode || 'light') === 'light' ? '#fafafa' : '#262626',
}))

export default useGlobalStore
