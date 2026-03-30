import { ipcInvoke } from '@/api'
import { message } from '@/utils/message'
import i18n from '@/i18n'
import useThirdPartyApiStore from '@/stores/thirdPartyApi'
import { getRandomStringFromSet } from '@/utils/tools'
import type { ThirdPartyApiServiceItem, AddThirdPartySupplierMode } from '@/types'

const t = i18n.t.bind(i18n)

// ===== 引用 Settings controller 的函数 =====
async function _getEmbeddingModels() {
  try {
    const res = await ipcInvoke('rag:get_embedding_models')
    if (res.code === 200) {
      // 简化：仅触发刷新，store 数据由 knowledge 管理
    }
  } catch (err) {
    console.error('_getEmbeddingModels', err)
  }
}

async function _getModelList() {
  try {
    // 此处简化，实际项目中应从 Settings/controller 导入
    const { default: useHeaderStore } = await import('@/stores/header')
    const res = await ipcInvoke('chat:get_model_list')
    if (res.code === 200) {
      const header = useHeaderStore.getState()
      header.setModelListSource(res.message)
      const flatList = Object.values(res.message as Record<string, any[]>).reduce(
        (p: any[], v: any[]) => [...p, ...v],
        [],
      )
      header.setModelList(flatList)
    }
  } catch (err) {
    console.error('_getModelList', err)
  }
}

// ===== 供应商列表 =====
export async function getSupplierList() {
  const store = useThirdPartyApiStore.getState()
  try {
    const res = await ipcInvoke('model:get_supplier_list')
    if (res.code === 200) {
      store.setThirdPartyApiServiceList(res.message)
      if (res.message.length) {
        store.setCurrentChooseApi(res.message[0])
        await getSupplierConfig(res.message[0])
      }
    }
  } catch (err) {
    console.error('getSupplierList', err)
  }
}

export async function getSupplierConfig(config: ThirdPartyApiServiceItem) {
  const store = useThirdPartyApiStore.getState()
  try {
    const res = await ipcInvoke('model:get_supplier_config', {
      supplierName: store.currentChooseApi?.supplierName,
    })
    if (res.code === 200) {
      store.setApplierServiceConfig({
        apiKey: res.message.apiKey,
        baseUrl: config.baseUrl || res.message.baseUrlExample,
      })
      await getSupplierModelList(store.currentChooseApi!.supplierName)
    }
  } catch (err) {
    console.error('getSupplierConfig', err)
  }
}

export async function getSupplierModelList(supplierName: string) {
  const store = useThirdPartyApiStore.getState()
  try {
    const res = await ipcInvoke('model:get_models_list', { supplierName })
    if (res.code === 200) {
      const list = res.message.filter((item: any) => item.title !== '')
      store.setSupplierModelList(list)
      store.setIsAllModelEnable(list.every((item: any) => item.status))
    }
  } catch (err) {
    console.error('getSupplierModelList', err)
  }
}

// ===== 添加/修改/删除 模型 =====
export async function addModels() {
  const store = useThirdPartyApiStore.getState()
  try {
    await ipcInvoke('model:add_models', {
      supplierName: store.currentChooseApi?.supplierName,
      ...store.addModelFormData,
      capability: JSON.stringify(store.addModelFormData.capability),
    })
    await _getEmbeddingModels()
    await _getModelList()
  } catch (err) {
    console.error('addModels', err)
  }
}

export async function editModels() {
  const store = useThirdPartyApiStore.getState()
  try {
    const { status, ...filteredFormData } = store.addModelFormData
    await ipcInvoke('model:modify_model', {
      ...filteredFormData,
      supplierName: store.currentChooseApi?.supplierName,
      capability: JSON.stringify(store.addModelFormData.capability),
    })
    await _getEmbeddingModels()
    await _getModelList()
  } catch (err) {
    console.error('editModels', err)
  }
}

export async function addSupplier() {
  const store = useThirdPartyApiStore.getState()
  const supplierName = getRandomStringFromSet(10)
  await ipcInvoke('model:add_supplier', { ...store.addSupplierFormData, supplierName })
}

export async function checkSupplierConfig() {
  const store = useThirdPartyApiStore.getState()
  const res = await ipcInvoke('model:check_supplier_config', {
    ...store.applierServiceConfig,
    supplierName: store.currentChooseApi?.supplierName,
  })
  return res.msg
}

export async function removeSupplier(supplierName: string) {
  try {
    await ipcInvoke('model:remove_supplier', { supplierName })
    await getSupplierList()
    await _getEmbeddingModels()
    await _getModelList()
  } catch (err) {
    console.error('removeSupplier', err)
  }
}

export async function removeSupplierModel(modelName: string) {
  const store = useThirdPartyApiStore.getState()
  try {
    await ipcInvoke('model:remove_models', {
      supplierName: store.currentChooseApi?.supplierName,
      modelName,
    })
  } catch (err) {
    console.error('removeSupplierModel', err)
  }
}

export async function setModelStatus(modelName: string, status: string) {
  const store = useThirdPartyApiStore.getState()
  try {
    await ipcInvoke('model:set_model_status', {
      supplierName: store.currentChooseApi?.supplierName,
      modelName,
      status,
    })
    await _getEmbeddingModels()
    await _getModelList()
  } catch (err) {
    console.error('setModelStatus', err)
  }
}

export async function setSupplierConfig() {
  const store = useThirdPartyApiStore.getState()
  try {
    await ipcInvoke('model:set_supplier_config', {
      ...store.applierServiceConfig,
      supplierName: store.currentChooseApi?.supplierName,
    })
    await _getModelList()
  } catch (err) {
    console.error('setSupplierConfig', err)
  }
}

export async function setSupplierStatus(supplierName: string, status: boolean) {
  try {
    await ipcInvoke('model:set_supplier_status', { supplierName, status: String(status) })
    message.success(status ? t('已启用模型该服务商') : t('已禁用模型该服务商'))
    await _getEmbeddingModels()
    await _getModelList()
  } catch (err) {
    console.error('setSupplierStatus', err)
  }
}

// ===== UI 交互函数 =====
export function changeCurrentSupplierStatus(supplierName: string, newStatus: boolean) {
  setSupplierStatus(supplierName, newStatus)
}

export function jumpToHelp(url: string) {
  window.open(url)
}
export function getKey(url: string) {
  window.open(url)
}

export function handleModelDataChange(row: AddThirdPartySupplierMode) {
  const store = useThirdPartyApiStore.getState()
  store.setIsEditModelFormData(true)
  store.setAddSupplierModel(true)
  store.setAddModelFormData(JSON.parse(JSON.stringify(row)))
}

export function delSupplier() {
  useThirdPartyApiStore.getState().setDeleteSupplierShow(true)
}

export function cancelDelSupplier() {
  useThirdPartyApiStore.getState().setDeleteSupplierShow(false)
}

export async function confirmDelSupplier() {
  const store = useThirdPartyApiStore.getState()
  if (!store.currentChooseApi) return
  await removeSupplier(store.currentChooseApi.supplierName)
  message.success(t('删除成功'))
  store.setDeleteSupplierShow(false)
  getSupplierList()
}

export async function confirmAddSupplier() {
  const store = useThirdPartyApiStore.getState()
  if (!store.addSupplierFormData.supplierTitle) {
    message.warning(t('请输入供应商名称'))
    return
  }
  await addSupplier()
  message.success(store.isEditModelFormData ? t('保存成功') : t('添加成功'))
  store.resetAddSupplierFormData()
  store.setAddSupplierShow(false)
  getSupplierList()
}

export function cancelAddSupplier() {
  const store = useThirdPartyApiStore.getState()
  store.setAddSupplierShow(false)
  store.resetAddSupplierFormData()
}

export async function multipleModelStatusChange(val: boolean) {
  const store = useThirdPartyApiStore.getState()
  const modelNames = store.supplierModelList.map((item) => item.modelName).join(',')
  await setModelStatus(modelNames, String(val))
  message.success(val ? t('已启用全部模型') : t('已禁用全部模型'))
  getSupplierModelList(store.currentChooseApi!.supplierName)
}

export async function modelStatusChange(modelName: string, val: boolean) {
  const store = useThirdPartyApiStore.getState()
  await setModelStatus(modelName, String(val))
  message.success(val ? t('模型启用成功') : t('模型禁用成功'))
  getSupplierModelList(store.currentChooseApi!.supplierName)
  _getModelList()
}

export async function checkConfig() {
  const store = useThirdPartyApiStore.getState()
  if (!store.applierServiceConfig.apiKey) {
    message.error(t('缺少API密钥'))
    return
  }
  if (!store.applierServiceConfig.baseUrl) {
    message.error(t('缺少API地址'))
    return
  }
  const msg = await checkSupplierConfig()
  message.info(msg || '')
}

export async function saveConfig() {
  const store = useThirdPartyApiStore.getState()
  if (!store.applierServiceConfig.apiKey || !store.applierServiceConfig.baseUrl) {
    message.error(t('请填写完整配置信息'))
    return
  }
  await setSupplierConfig()
  message.success(t('配置保存成功'))
  if (store.currentChooseApi) {
    store.setCurrentChooseApi({ ...store.currentChooseApi, status: true })
  }
  getSupplierModelList(store.currentChooseApi!.supplierName)
}

export function delModel(modelName: string) {
  const store = useThirdPartyApiStore.getState()
  store.setDeleteModelName(modelName)
  store.setDeleteModelShow(true)
}

export function cancelDelModel() {
  useThirdPartyApiStore.getState().setDeleteModelShow(false)
}

export async function confirmDelModel() {
  const store = useThirdPartyApiStore.getState()
  await removeSupplierModel(store.deleteModelName)
  message.success(t('模型删除成功'))
  getSupplierModelList(store.currentChooseApi!.supplierName)
  cancelDelModel()
}

export function capabilityChange(val: string[]) {
  const store = useThirdPartyApiStore.getState()
  if (val.includes('embedding')) {
    store.setAddModelFormData({ capability: ['embedding'] })
    store.setCantChoose(true)
  } else {
    store.setAddModelFormData({ capability: val })
    store.setCantChoose(false)
  }
}

export async function confirmAddModel() {
  const store = useThirdPartyApiStore.getState()
  if (!store.addModelFormData.modelName) {
    message.warning(t('请输入模型ID'))
    return
  }
  if (!store.addModelFormData.title) {
    message.warning(t('请输入模型别名'))
    return
  }
  if (store.isEditModelFormData) {
    await editModels()
  } else {
    await addModels()
  }
  getSupplierModelList(store.currentChooseApi!.supplierName)
  store.setAddSupplierModel(false)
  message.success(t('模型添加成功'))
  store.resetAddModelFormData()
}

export function modelIdChange(val: string) {
  useThirdPartyApiStore.getState().setAddModelFormData({ title: val, modelName: val })
}

export function closeAddModel() {
  const store = useThirdPartyApiStore.getState()
  store.setAddSupplierModel(false)
  store.resetAddModelFormData()
}

export async function chooseApiService(item: ThirdPartyApiServiceItem) {
  const store = useThirdPartyApiStore.getState()
  store.setCurrentChooseApi(item)
  await getSupplierModelList(item.supplierName)
  await getSupplierConfig(item)
}
