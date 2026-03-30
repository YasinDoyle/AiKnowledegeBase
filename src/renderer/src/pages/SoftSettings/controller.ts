import { ipcInvoke } from '@/api'
import { message } from '@/utils/message'
import i18n, { setLang } from '@/i18n'
import storage from '@/utils/storage'
import useSoftSettingsStore from '@/stores/softSettings'
import useGlobalStore from '@/stores/global'
import type { CloudMcpServerListDto } from '@/types'

const t = i18n.t.bind(i18n)

// ============= 辅助函数 =============
function formatArgs(val: string[]): string {
  if (!Array.isArray(val)) return ''
  return val.join('\n')
}
function formatEnv(val: Record<string, string>): string {
  return Object.keys(val)
    .map((k) => `${k}=${val[k]}`)
    .join('\n')
}
function receveArgs(val: string): string[] {
  return val.split('\n')
}
function receveEnv(val: string): Record<string, string> {
  if (!val) return {}
  return val.split('\n').reduce((p: Record<string, string>, v) => {
    const [key, ...rest] = v.split('=')
    if (key) p[key] = rest.join('=')
    return p
  }, {})
}

// ============= 通用设置 =============
export function openSoftSettings() {
  useSoftSettingsStore.getState().setSoftSettingsShow(true)
}

export function closeSoftSettings() {
  useSoftSettingsStore.getState().setSoftSettingsShow(false)
  resetMcp()
}

export async function setServiceLanguage(language: string) {
  await ipcInvoke('index:set_language', { language })
}

export async function getDataSavePath() {
  try {
    const res = await ipcInvoke('index:get_data_save_path')
    if (res.code === 200) {
      useSoftSettingsStore.getState().setUserDataPath(res.message.currentPath)
    }
  } catch (err) {
    console.error('getDataSavePath', err)
  }
}

export function changeDataSavePath() {
  useSoftSettingsStore.getState().setChangeDataPathShow(true)
}

export function cancelChangeDataSavePath() {
  useSoftSettingsStore.getState().setChangeDataPathShow(false)
  getDataSavePath()
}

export async function confirmChangeDataSavePath() {
  const store = useSoftSettingsStore.getState()
  try {
    const res = await ipcInvoke('index:select_folder')
    store.setChangeDataPathShow(false)
    if (res.code === 200) {
      store.setUserDataPath(res.message.folder)
      const pathRes = await ipcInvoke('index:set_data_save_path', { newPath: res.message.folder })
      if (pathRes.code === 200) {
        changeProgressCheck()
      } else {
        message.error(pathRes.msg || t('操作失败'))
        getDataSavePath()
      }
    }
  } catch (err) {
    console.error('confirmChangeDataSavePath', err)
  }
}

export function changeProgressCheck() {
  const store = useSoftSettingsStore.getState()
  store.setDataPathChangeCheckShow(true)
  const timer = setInterval(async () => {
    const res = await ipcInvoke('index:get_data_save_path')
    useSoftSettingsStore.getState().setUserDataPath(res.message.currentPath)
    const status = res.message.copyStatus
    useSoftSettingsStore.getState().setDataPathChangeStatusValues(status)
    if (status.status === -1) {
      message.error(t('数据迁移失败，请重试'))
      clearInterval(timer)
      useSoftSettingsStore.getState().setDataPathChangeCheckShow(false)
    }
    if (status.status === 2) {
      message.success(t('数据迁移成功'))
      clearInterval(timer)
      useSoftSettingsStore.getState().setDataPathChangeCheckShow(false)
    }
  }, 1000)
}

export async function getLanguages() {
  try {
    const res = await ipcInvoke('index:get_languages')
    if (res.code === 200) {
      const opts = res.message.languages.map((v: any) => ({ label: v.title, value: v.name }))
      useSoftSettingsStore.getState().setLanguageOptions(opts)
    }
  } catch (err) {
    console.error('getLanguages', err)
  }
}

export function toStar() {
  window.open('https://github.com/YasinDoyle/AiKnowledegeBase')
}
export function toIssue() {
  window.open('https://github.com/YasinDoyle/AiKnowledegeBase/issues')
}
export function jumpToTutorial() {
  window.open('https://docs.aingdesk.com/zh-Hans/')
}

export function guideChange(val: boolean) {
  storage.welcomeGuide = String(val)
}
export function setSearch(val: string) {
  storage.searchEngine = val
}

export function changeThemeMode(val: string) {
  useSoftSettingsStore.getState().setThemeMode(val)
  storage.themeMode = val
  useGlobalStore.getState().setThemeMode(val as 'light' | 'dark')
}

export function changeLanguage(val: string) {
  setLang(val)
  useSoftSettingsStore.getState().setCurrentLanguage(val)
  setServiceLanguage(val)
}

export function changeSettingTab(tab: string) {
  const store = useSoftSettingsStore.getState()
  store.setSettingPanelWidth(tab === 'general' ? 480 : 780)
  store.setCurrentSettingTab(tab)
}

// ============= MCP 相关 =============
export async function checkEnvStatus() {
  try {
    const res = await ipcInvoke('mcp:get_status')
    if (res.code === 200) {
      useSoftSettingsStore.getState().setEnvStatus(res.message)
    }
  } catch (err) {
    console.error('checkEnvStatus', err)
  }
}

export async function getMcpServerList() {
  try {
    const res = await ipcInvoke('mcp:get_mcp_server_list')
    if (res.code === 200) {
      const list = res.message.map((item: any) => ({
        ...item,
        args: formatArgs(item.args),
        env: formatEnv(item.env),
      }))
      useSoftSettingsStore.getState().setMcpServerList(list)
    }
  } catch (err) {
    console.error('getMcpServerList', err)
  }
}

export async function getMcpTempList() {
  const store = useSoftSettingsStore.getState()
  store.setMcpServerTempList([])
  try {
    const res = await ipcInvoke('mcp:get_common_server_list')
    if (Array.isArray(res.message) && res.message.length === 0 && !store.mcpServerCloud) {
      await syncCloudMcp()
      return
    }
    const list: CloudMcpServerListDto[] = []
    Object.keys(res.message.mcpServers).forEach((key) => {
      const item = res.message.mcpServers[key]
      item.args = formatArgs(item.args)
      item.env = formatEnv(item.env)
      list.push(item)
    })
    useSoftSettingsStore.getState().setMcpServerTempList(list)
  } catch (err) {
    console.error('getMcpTempList', err)
  }
}

export async function syncCloudMcp() {
  try {
    await ipcInvoke('mcp:sync_cloud_mcp')
    useSoftSettingsStore.getState().setMcpServerCloud(true)
    await getMcpTempList()
  } catch (err) {
    console.error('syncCloudMcp', err)
  }
}

export function resetMcp() {
  const store = useSoftSettingsStore.getState()
  store.setCurrentMcpChoose({
    name: '',
    description: '',
    type: 'stdio',
    command: 'npx',
    baseUrl: '',
    env: '',
    args: '',
  })
  store.setCurrentMcpName('')
  store.setMcpServerFormShow(false)
  store.setCommadType('npx')
}

export function handleAddMcp(row: CloudMcpServerListDto) {
  const store = useSoftSettingsStore.getState()
  store.setCurrentMcpChoose(JSON.parse(JSON.stringify(row)))
  store.setMcpServerEditMode(false)
  store.setMcpServerFormShow(true)
}

export async function handleEditMcp(name: string) {
  const store = useSoftSettingsStore.getState()
  store.setMcpServerFormShow(true)
  store.setMcpServerEditMode(true)
  const res = await ipcInvoke('mcp:get_mcp_server_info', { name })
  store.setCurrentMcpConfigBackup(res.message)
  store.setCurrentMcpName(name)
  store.setCommadType(res.message.command?.substring(0, 3) === 'npx' ? 'npx' : 'custom')
  const mcpData = { ...res.message }
  mcpData.args = formatArgs(mcpData.args)
  mcpData.env = formatEnv(mcpData.env)
  store.setCurrentMcpChoose(mcpData)
}

export function onChangeCommadType(type: string) {
  const store = useSoftSettingsStore.getState()
  const current = { ...store.currentMcpChoose }
  current.command = type === 'npx' ? 'npx' : ''
  store.setCurrentMcpChoose(current)
}

export async function installEnv(type: string) {
  const envType = type === 'py' ? 'install_uv' : 'install_npx'
  const store = useSoftSettingsStore.getState()
  store.setEnvInstallShow(true)
  const res = await ipcInvoke(`mcp:${envType}`)
  if (res.code === 200) {
    message.success(t('环境安装成功'))
    store.setEnvInstallShow(false)
    await checkEnvStatus()
  } else {
    message.error(t('环境安装失败'))
    store.setEnvInstallShow(false)
  }
}

export async function handleCurrentMcpStatus() {
  const store = useSoftSettingsStore.getState()
  const backup = JSON.parse(JSON.stringify(store.currentMcpConfigBackup))
  if ('isActive' in store.currentMcpChoose) {
    backup.is_active = (store.currentMcpChoose as any).isActive
  }
  backup.args = receveArgs(backup.args)
  backup.env = receveEnv(backup.env)
  delete backup.isActive
  const res = await ipcInvoke('mcp:modify_mcp_server', backup)
  message.success(res.msg || t('操作成功'))
  await getMcpServerList()
}

export async function handleAddMcpServer() {
  const store = useSoftSettingsStore.getState()
  if (store.envStatus.node_npx === 0) {
    message.error(t('请先安装Node.js环境'))
    return
  }
  const params = JSON.parse(JSON.stringify(store.currentMcpChoose))
  let api = 'add_mcp_server'
  if (store.mcpServerEditMode) {
    api = 'modify_mcp_server'
    params.is_active = params.isActive
    delete params.isActive
  }
  params.args = receveArgs(params.args)
  params.env = receveEnv(params.env)
  const res = await ipcInvoke(`mcp:${api}`, params)
  message.success(res.msg || t('操作成功'))
  await getMcpServerList()
  if (!store.mcpServerEditMode) {
    handleEditMcp(params.name)
  }
}

export function handleDeleteMcpServer() {
  useSoftSettingsStore.getState().setDelMcpConfirmShow(true)
}

export function cancelDeleteMcpServer() {
  useSoftSettingsStore.getState().setDelMcpConfirmShow(false)
}

export async function confirmDeleteMcpServer() {
  const store = useSoftSettingsStore.getState()
  const res = await ipcInvoke('mcp:remove_mcp_server', { name: store.currentMcpName })
  if (res.code === 200) {
    message.success(t('操作成功'))
    store.setMcpServerFormShow(false)
    store.setMcpServerEditMode(false)
  } else {
    message.error(res.msg || t('操作失败'))
  }
  await getMcpServerList()
  store.setDelMcpConfirmShow(false)
}

export async function openMcpConfigFile() {
  const store = useSoftSettingsStore.getState()
  store.setMcpConfigFileShow(true)
  try {
    const res = await ipcInvoke('mcp:get_mcp_config_body')
    store.setMcpConfigFileContent(res.message.mcp_config_body)
  } catch (err) {
    console.error('openMcpConfigFile', err)
  }
}

export async function saveMcpConfigFile(obj: Record<string, string>) {
  const res = await ipcInvoke('mcp:save_mcp_config_body', obj)
  if (res.code === 200) {
    message.success(t('操作成功'))
    useSoftSettingsStore.getState().setMcpConfigFileShow(false)
  } else {
    message.error(res.msg || t('操作失败'))
  }
}
