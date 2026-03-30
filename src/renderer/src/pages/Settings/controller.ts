import { ipcInvoke } from '@/api'
import { message } from '@/utils/message'
import i18n from '@/i18n'
import useSettingsStore from '@/stores/settings'
import useHeaderStore from '@/stores/header'
import useThirdPartyApiStore from '@/stores/thirdPartyApi'
import useKnowledgeStore from '@/stores/knowledge'
import { eventBus } from '@/utils/tools'
import type { SupplierModelItem } from '@/types'

const t = i18n.t.bind(i18n)

/** 打开模型管理 */
export async function openModelManage() {
  try {
    await getVisibleModelList()
    useSettingsStore.getState().setSettingsShow(true)
  } catch (err) {
    console.error('openModelManage', err)
  }
}

/** 获取可安装模型列表 */
export async function getVisibleModelList() {
  const store = useSettingsStore.getState()
  try {
    const res = await ipcInvoke('manager:get_model_manager')
    if (res.code === 200) {
      store.setIsInstalledManager(res.message.status)
      store.setOllamaUrl(res.message.ollama_host)
      if (!res.message.status) {
        store.setSettingsShow(true)
        store.setManagerInstallConfirm(true)
      } else {
        store.setManagerInstallConfirm(false)
      }
      store.setVisibleModelList(res.message.models)
      if (store.isResetModelList.type === 1) {
        store.setIsResetModelList({ status: true, type: 1 })
      }
    }
  } catch (err) {
    console.error('getVisibleModelList', err)
  }
}

/** 获取已安装模型列表 (flat) */
export async function getModelList() {
  try {
    const header = useHeaderStore.getState()
    const thirdParty = useThirdPartyApiStore.getState()
    const res = await ipcInvoke('chat:get_model_list')
    if (res.code === 200) {
      header.setModelListSource(res.message)
      const flatList: SupplierModelItem[] = Object.values(
        res.message as Record<string, SupplierModelItem[]>,
      ).reduce((p: any, v: any) => [...p, ...v], [])
      header.setModelList(flatList)
      if (flatList.length && !thirdParty.currentSupplierName) {
        thirdParty.setCurrentSupplierName(flatList[0].supplierName)
      }
    }
  } catch (err) {
    console.error('getModelList', err)
  }
}

/** 获取本机盘符 */
export async function getDiskList() {
  await ipcInvoke('manager:get_disk_list')
}

/** 安装大模型 */
export async function installModel(modelName?: string, callback?: () => void) {
  const store = useSettingsStore.getState()
  if (modelName) {
    const [model, parameters] = modelName.split(':')
    store.setModelNameForInstall({ model, parameters })
  }
  ipcInvoke('manager:install_model', store.modelNameForInstall)
  store.setInstallShow(true)
  getModelInstallProgress(callback)
}

/** 轮询模型安装进度 */
export function getModelInstallProgress(callback?: () => void) {
  const timer = setInterval(async () => {
    const store = useSettingsStore.getState()
    const res = await ipcInvoke('manager:get_model_install_progress', store.modelNameForInstall)
    const modelFull = `${store.modelNameForInstall.model}:${store.modelNameForInstall.parameters}`

    if (res.message.status === 3) {
      message.success(t('安装成功'))
      store.setInstallShow(false)
      store.setDownloadText(t('正在连接，请稍候...'))
      clearInterval(timer)
      eventBus.$emit('modelInstalled', 'installed')
      getModelList()
      getVisibleModelList()
      callback?.()
    } else if (res.message.status === 0) {
      store.setDownloadText(t('等待下载:') + modelFull)
    } else if (res.message.status === 1) {
      store.setDownloadText(t('正在下载:') + modelFull)
    } else if (res.message.status === 2) {
      store.setDownloadText(t('正在安装:') + modelFull)
    } else if (res.message.status === -1) {
      message.error(t('安装失败'))
      store.setInstallShow(false)
      clearInterval(timer)
    }
    store.setModelInstallProgress(res.message)
  }, 1000)
}

/** 安装模型管理器 */
export async function installModelManager() {
  const store = useSettingsStore.getState()
  if (!store.managerForInstall) {
    message.warning(t('请选择模型管理器'))
    return
  }
  if (!store.modelManagerInstallPath) {
    message.warning(t('请选择模型管理器安装路径'))
    return
  }
  store.setModelManagerInstallProgresShow(true)
  store.setManagerInstallConfirm(false)
  ipcInvoke('manager:install_model_manager', {
    manager_name: store.managerForInstall,
    models_path: store.modelManagerInstallPath,
  })
  store.setModelManagerInstallNotice(t('正在下载'))
  getModelManagerInstallProgress()
}

/** 轮询模型管理器安装进度 */
export function getModelManagerInstallProgress() {
  const timer = setInterval(async () => {
    const store = useSettingsStore.getState()
    const res = await ipcInvoke('manager:get_model_manager_install_progress', {
      manager_name: store.managerForInstall,
    })
    if (res.message.status === 0) store.setModelManagerInstallNotice(t('正在选择下载节点，请稍后'))
    if (res.message.status === 1)
      store.setModelManagerInstallNotice(t('正在下载模型管理器，请稍后'))
    if (res.message.status === 2)
      store.setModelManagerInstallNotice(t('正在安装模型管理器，可能要几分钟时间，请耐心等待'))
    if (res.message.status === 3) {
      message.success(t('模型管理器安装成功'))
      store.setModelManagerInstallProgresShow(false)
      store.setIsInstalledManager(true)
      clearInterval(timer)
      getVisibleModelList()
      store.setIsResetModelList({ status: false, type: 1 })
    }
    if (res.message.status === -1) {
      message.error(t('模型管理器安装失败'))
      store.setModelManagerInstallProgresShow(false)
      clearInterval(timer)
      getVisibleModelList()
    }
    store.setModelManagerInstallProgress(res.message)
  }, 1000)
}

/** 删除模型 */
export async function removeModel() {
  const store = useSettingsStore.getState()
  const [model, parameters] = store.modelForDel.split(':')
  const res = await ipcInvoke('manager:remove_model', { model, parameters })
  if (res.code === 200) {
    await getVisibleModelList()
    await getModelList()
    eventBus.$emit('modelInstalled')
    message.success(t('模型删除成功'))
  } else {
    message.error(t('模型删除失败') + (res.error_msg ? `:${res.error_msg}` : ''))
  }
  store.setModelDelLoading(false)
  store.setModelDelConfirm(false)
}

/** 重新选择下载节点 */
export async function reconnectModelDownload() {
  const res = await ipcInvoke('manager:reconnect_model_download')
  message.success(res.msg || t('操作成功'))
}

/** 选择模型管理器安装路径 */
export async function chooseOllamaPath() {
  const res = await ipcInvoke('index:select_folder')
  if (res.code === 200) {
    useSettingsStore.getState().setModelManagerInstallPath(res.message.folder)
  }
}

/** 设置 ollama URL */
export async function setOllamaUrl() {
  const store = useSettingsStore.getState()
  try {
    const res = await ipcInvoke('manager:set_ollama_host', { ollama_host: store.ollamaUrl })
    if (res.code !== 200) {
      message.error(res.msg || t('设置失败'))
    } else {
      message.success(t('设置成功'))
      eventBus.$emit('modelInstalled', 'all')
    }
  } catch (err) {
    console.error('setOllamaUrl', err)
  }
}

/** 获取 embedding 模型列表 */
export async function getEmbeddingModels() {
  try {
    const res = await ipcInvoke('rag:get_embedding_models')
    if (res.code === 200) {
      const models: any[] = Object.values(res.message).flat()
      useKnowledgeStore.getState().setEmbeddingModelsList(models)
      if (models.length) {
        let found = models.find(
          (m: any) => m.model?.includes('bge-m3') && m.title?.includes('ollama'),
        )
        if (!found) found = models.find((m: any) => m.model?.includes('bge-m3'))
        if (!found) found = models[0]
        useKnowledgeStore.getState().setCreateKnowledgeFormData({
          embeddingModel: found.model,
          supplierName: found.supplierName,
        })
      }
    }
  } catch (err) {
    console.error('getEmbeddingModels', err)
  }
}

/** 安装模型确认 */
export function installModelConfirm(info: { model: string; parameters: string }) {
  useSettingsStore.getState().setModelNameForInstall(info)
  installModel()
}

/** 删除模型问询 */
export function removeModelConfirm(model: string) {
  const store = useSettingsStore.getState()
  store.setModelDelConfirm(true)
  store.setModelForDel(model)
}

/** 确认删除模型 */
export function doRemoveModel() {
  useSettingsStore.getState().setModelDelLoading(true)
  removeModel()
}

/** 取消删除模型 */
export function cancelRemoveModel() {
  const store = useSettingsStore.getState()
  store.setModelDelConfirm(false)
  store.setModelForDel('')
}

/** 暂不安装模型管理器 */
export function doNotInstallModelManagerNow() {
  const store = useSettingsStore.getState()
  store.setSettingsShow(false)
  store.setManagerInstallConfirm(false)
}

/** 搜索/过滤模型 */
export async function handleSearch() {
  const store = useSettingsStore.getState()
  await getVisibleModelList()
  const s = useSettingsStore.getState()
  const filtered = s.visibleModelList.filter((item: any) => {
    const nameMatch = item.full_name.toLowerCase().includes(s.search.toLowerCase())
    const typeMatch =
      s.modeType === 'all'
        ? true
        : s.modeType === 'installed'
          ? item.install
          : item.capability.includes(s.modeType)
    return nameMatch && typeMatch
  })
  store.setFilterList(filtered)
  if (!s.search) store.setPage(1)
}
