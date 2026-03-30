import { ipcInvoke } from '@/api'
import { message } from '@/utils/message'
import i18n from '@/i18n'
import useHeaderStore from '@/stores/header'
import type { ShareItem } from '@/stores/header'
import useSiderStore from '@/stores/sider'
import useThirdPartyApiStore from '@/stores/thirdPartyApi'
import type { SupplierModelItem } from '@/types'

const t = i18n.t.bind(i18n)

/**
 * 获取模型列表（实际调用 settings controller）
 */
export async function getModelList() {
  const header = useHeaderStore.getState()
  try {
    const res = await ipcInvoke('chat:get_model_list')
    if (res.code === 200) {
      const source: Record<string, SupplierModelItem[]> = res.message
      header.setModelListSource(source)
      // 展平为 flat list
      const flatList: SupplierModelItem[] = []
      Object.values(source).forEach((models) => {
        models.forEach((m) => flatList.push(m))
      })
      header.setModelList(flatList)
    }
  } catch (err) {
    console.error('getModelList error', err)
  }
}

/**
 * 切换当前模型
 */
export function changeCurrentModel(modelName: string, supplierName: string) {
  const header = useHeaderStore.getState()
  const sider = useSiderStore.getState()
  const thirdParty = useThirdPartyApiStore.getState()

  header.setCurrentModel(modelName)
  thirdParty.setCurrentSupplierName(supplierName)

  // 如果当前有对话，更新对话的模型信息
  if (sider.currentContextId) {
    ipcInvoke('chat:change_model', {
      context_id: sider.currentContextId,
      model: modelName,
      supplierName,
    }).catch(console.error)
  }
}

/**
 * 获取分享列表
 */
export async function getShareList() {
  const header = useHeaderStore.getState()
  try {
    const res = await ipcInvoke('share:get_share_list')
    if (res.code === 200) {
      header.setShareList(res.message)
    }
  } catch (err) {
    console.error('getShareList error', err)
  }
}

/**
 * 创建分享
 */
export async function createShare() {
  const header = useHeaderStore.getState()
  const sider = useSiderStore.getState()

  if (!sider.currentContextId) {
    message.warning(t('请先选择一个对话'))
    return
  }
  try {
    const res = await ipcInvoke('share:create_share', {
      context_id: sider.currentContextId,
      model: header.shareSelectModel || header.currentModel,
      title: header.shareTitle,
      password: header.sharePassword,
      is_use_context: header.shareIsUseContext,
    })
    if (res.code === 200) {
      message.success(t('创建成功'))
      header.setShareCreateShow(false)
      header.setShareTitle('')
      header.setSharePassword('')
      header.setShareIsUseContext(0)
      await getShareList()
    }
  } catch (err) {
    console.error('createShare error', err)
  }
}

/**
 * 修改分享
 */
export async function modifyShare() {
  const header = useHeaderStore.getState()
  const current = header.currentShareModify
  if (!current) return
  try {
    const res = await ipcInvoke('share:modify_share', {
      share_id: current.share_id,
      title: header.shareTitle,
      password: header.sharePassword,
      is_use_context: header.shareIsUseContext,
    })
    if (res.code === 200) {
      message.success(t('修改成功'))
      header.setShareModifyShow(false)
      await getShareList()
    }
  } catch (err) {
    console.error('modifyShare error', err)
  }
}

/**
 * 删除分享
 */
export async function delShare(shareId: string) {
  try {
    const res = await ipcInvoke('share:del_share', { share_id: shareId })
    if (res.code === 200) {
      message.success(t('删除成功'))
      await getShareList()
    }
  } catch (err) {
    console.error('delShare error', err)
  }
}

/**
 * 展开侧边栏
 */
export function doExpand() {
  const sider = useSiderStore.getState()
  if (sider.siderWidth === 0) {
    sider.setSiderWidth(220)
  } else {
    sider.setSiderWidth(0)
  }
}

/**
 * 打开修改分享弹窗
 */
export function openModifyShare(item: ShareItem) {
  const header = useHeaderStore.getState()
  header.setCurrentShareModify(item)
  header.setShareTitle(item.title)
  header.setSharePassword(item.password)
  header.setShareIsUseContext(item.is_use_context)
  header.setShareModifyShow(true)
}

/**
 * 关闭分享
 */
export function closeShare() {
  const header = useHeaderStore.getState()
  header.setShareShow(false)
}

/**
 * 关闭修改分享
 */
export function closeModifyShare() {
  const header = useHeaderStore.getState()
  header.setShareModifyShow(false)
  header.setCurrentShareModify(null)
}
