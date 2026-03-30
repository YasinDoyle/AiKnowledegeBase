import { create } from 'zustand'
import storage from '@/utils/storage'
import type { CloudMcpServerListDto, McpServerListDto } from '@/types'

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

interface DataPathChangeStatus {
  status: number
  speed: number
  total: number
  current: number
  percent: number
  startTime: number
  endTime: number
  fileTotal: number
  fileCurrent: number
  message: string
  error: string
}

interface SoftSettingsState {
  softSettingsShow: boolean
  themeMode: string
  themeColors: ThemeColors
  currentLanguage: string
  languageOptions: { label: string; value: string }[]
  targetNet: string
  version: string
  // 数据路径
  userDataPath: string
  changeDataPathShow: boolean
  dataPathChangeCheckShow: boolean
  dataPathChangeStatusValues: DataPathChangeStatus
  // 设置面板 tab
  currentSettingTab: string
  settingPanelWidth: number
  // MCP 相关
  currentMcpName: string
  commadType: string
  mcpServerFormShow: boolean
  mcpServerList: McpServerListDto[]
  mcpServerTempList: CloudMcpServerListDto[]
  currentMcpChoose: CloudMcpServerListDto
  mcpServerEditMode: boolean
  mcpServerCloud: boolean
  envStatus: { node_npx: number; python_uv: number }
  envInstallShow: boolean
  mcpConfigFileShow: boolean
  mcpConfigFileContent: string
  currentMcpConfigBackup: McpServerListDto | null
  delMcpConfirmShow: boolean

  setSoftSettingsShow: (v: boolean) => void
  setThemeMode: (m: string) => void
  setCurrentLanguage: (l: string) => void
  setLanguageOptions: (o: { label: string; value: string }[]) => void
  setTargetNet: (t: string) => void
  setVersion: (v: string) => void
  setUserDataPath: (p: string) => void
  setChangeDataPathShow: (v: boolean) => void
  setDataPathChangeCheckShow: (v: boolean) => void
  setDataPathChangeStatusValues: (d: Partial<DataPathChangeStatus>) => void
  setCurrentSettingTab: (t: string) => void
  setSettingPanelWidth: (w: number) => void
  setCurrentMcpName: (n: string) => void
  setCommadType: (t: string) => void
  setMcpServerFormShow: (v: boolean) => void
  setMcpServerList: (l: McpServerListDto[]) => void
  setMcpServerTempList: (l: CloudMcpServerListDto[]) => void
  setCurrentMcpChoose: (c: CloudMcpServerListDto) => void
  setMcpServerEditMode: (v: boolean) => void
  setMcpServerCloud: (v: boolean) => void
  setEnvStatus: (s: { node_npx: number; python_uv: number }) => void
  setEnvInstallShow: (v: boolean) => void
  setMcpConfigFileShow: (v: boolean) => void
  setMcpConfigFileContent: (c: string) => void
  setCurrentMcpConfigBackup: (b: McpServerListDto | null) => void
  setDelMcpConfirmShow: (v: boolean) => void
}

const defaultMcpChoose: CloudMcpServerListDto = {
  name: '',
  description: '',
  type: 'stdio',
  command: 'npx',
  baseUrl: '',
  env: '',
  args: '',
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
  languageOptions: [],
  targetNet: 'baidu',
  version: '1.0.0',
  userDataPath: '',
  changeDataPathShow: false,
  dataPathChangeCheckShow: false,
  dataPathChangeStatusValues: {
    status: 0,
    speed: 0,
    total: 0,
    current: 0,
    percent: 0,
    startTime: 0,
    endTime: 0,
    fileTotal: 0,
    fileCurrent: 0,
    message: '',
    error: '',
  },
  currentSettingTab: 'general',
  settingPanelWidth: 480,
  currentMcpName: '',
  commadType: 'npx',
  mcpServerFormShow: false,
  mcpServerList: [],
  mcpServerTempList: [],
  currentMcpChoose: { ...defaultMcpChoose },
  mcpServerEditMode: false,
  mcpServerCloud: false,
  envStatus: { node_npx: 0, python_uv: 0 },
  envInstallShow: false,
  mcpConfigFileShow: false,
  mcpConfigFileContent: '',
  currentMcpConfigBackup: null,
  delMcpConfirmShow: false,

  setSoftSettingsShow: (v) => set({ softSettingsShow: v }),
  setThemeMode: (m) => set({ themeMode: m }),
  setCurrentLanguage: (l) => set({ currentLanguage: l }),
  setLanguageOptions: (o) => set({ languageOptions: o }),
  setTargetNet: (t) => set({ targetNet: t }),
  setVersion: (v) => set({ version: v }),
  setUserDataPath: (p) => set({ userDataPath: p }),
  setChangeDataPathShow: (v) => set({ changeDataPathShow: v }),
  setDataPathChangeCheckShow: (v) => set({ dataPathChangeCheckShow: v }),
  setDataPathChangeStatusValues: (d) =>
    set((s) => ({ dataPathChangeStatusValues: { ...s.dataPathChangeStatusValues, ...d } })),
  setCurrentSettingTab: (t) => set({ currentSettingTab: t }),
  setSettingPanelWidth: (w) => set({ settingPanelWidth: w }),
  setCurrentMcpName: (n) => set({ currentMcpName: n }),
  setCommadType: (t) => set({ commadType: t }),
  setMcpServerFormShow: (v) => set({ mcpServerFormShow: v }),
  setMcpServerList: (l) => set({ mcpServerList: l }),
  setMcpServerTempList: (l) => set({ mcpServerTempList: l }),
  setCurrentMcpChoose: (c) => set({ currentMcpChoose: c }),
  setMcpServerEditMode: (v) => set({ mcpServerEditMode: v }),
  setMcpServerCloud: (v) => set({ mcpServerCloud: v }),
  setEnvStatus: (s) => set({ envStatus: s }),
  setEnvInstallShow: (v) => set({ envInstallShow: v }),
  setMcpConfigFileShow: (v) => set({ mcpConfigFileShow: v }),
  setMcpConfigFileContent: (c) => set({ mcpConfigFileContent: c }),
  setCurrentMcpConfigBackup: (b) => set({ currentMcpConfigBackup: b }),
  setDelMcpConfirmShow: (v) => set({ delMcpConfirmShow: v }),
}))

export default useSoftSettingsStore
