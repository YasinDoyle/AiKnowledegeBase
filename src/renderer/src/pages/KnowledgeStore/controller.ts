import { ipcInvoke } from '@/api'
import { message } from '@/utils/message'
import i18n from '@/i18n'
import useKnowledgeStore from '@/stores/knowledge'
import type { ActiveKnowledgeDocDto } from '@/types'

const t = i18n.t.bind(i18n)

/** 获取知识库列表 */
export async function getRagList() {
  try {
    const res = await ipcInvoke('rag:get_rag_list')
    if (res.code === 200) {
      useKnowledgeStore.getState().setKnowledgeList(res.message)
    }
  } catch (err) {
    console.error('getRagList', err)
  }
}

/** 获取知识库文档列表 */
export async function getRagDocList(ragName: string) {
  try {
    const res = await ipcInvoke('rag:get_doc_list', { ragName })
    if (res.code === 200) {
      useKnowledgeStore.getState().setActiveKnowledgeDocList(res.message)
    }
  } catch (err) {
    console.error('getRagDocList', err)
  }
}

/** 选中知识库 */
export async function singleActive(ragName: string) {
  const store = useKnowledgeStore.getState()
  store.setActiveKnowledge(ragName)
  const found = store.knowledgeList.find((k) => k.ragName === ragName)
  store.setActiveKnowledgeDto(found || null)
  await getRagDocList(ragName)
}

/** 打开知识库面板 */
export async function openKnowledgeStore() {
  await getRagList()
  const store = useKnowledgeStore.getState()
  if (store.knowledgeList.length > 0) {
    await singleActive(store.knowledgeList[0].ragName)
  }
}

/** 打开创建知识库弹窗 */
export function openCreateKnowledge() {
  const store = useKnowledgeStore.getState()
  store.resetCreateKnowledgeFormData()
  store.setCreateKnowledgeShow(true)
}

/** 关闭创建知识库弹窗 */
export function closeCreateKnowledge() {
  useKnowledgeStore.getState().setCreateKnowledgeShow(false)
}

/** 创建新知识库 */
export async function createNewKnowledgeStore() {
  const { createKnowledgeFormData } = useKnowledgeStore.getState()
  if (!createKnowledgeFormData.ragName) {
    message.warning(t('请输入知识库名称'))
    return
  }
  if (!createKnowledgeFormData.embeddingModel) {
    message.warning(t('请选择嵌入模型'))
    return
  }
  try {
    const res = await ipcInvoke('rag:create_rag', createKnowledgeFormData)
    if (res.code === 200) {
      message.success(t('创建成功'))
      closeCreateKnowledge()
      await getRagList()
      await singleActive(createKnowledgeFormData.ragName)
    } else {
      message.error(res.msg || t('创建失败'))
    }
  } catch (err) {
    console.error('createNewKnowledgeStore', err)
  }
}

/** 打开删除知识库确认 */
export function openDelKnowledge() {
  useKnowledgeStore.getState().setDeleteKnowledgeShow(true)
}

/** 取消删除知识库 */
export function cancelDelKnowledge() {
  useKnowledgeStore.getState().setDeleteKnowledgeShow(false)
}

/** 确认删除知识库 */
export async function confirmDelKnowledge() {
  const store = useKnowledgeStore.getState()
  if (!store.activeKnowledge) return
  try {
    const res = await ipcInvoke('rag:remove_rag', { ragName: store.activeKnowledge })
    if (res.code === 200) {
      message.success(t('删除成功'))
      cancelDelKnowledge()
      await getRagList()
      const list = useKnowledgeStore.getState().knowledgeList
      if (list.length > 0) {
        await singleActive(list[0].ragName)
      } else {
        store.setActiveKnowledge(null)
        store.setActiveKnowledgeDto(null)
        store.setActiveKnowledgeDocList([])
      }
    } else {
      message.error(res.msg || t('删除失败'))
    }
  } catch (err) {
    console.error('confirmDelKnowledge', err)
  }
}

/** 修改知识库 */
export async function modifyRag(params: Record<string, any>) {
  try {
    const res = await ipcInvoke('rag:modify_rag', params)
    if (res.code === 200) {
      message.success(t('修改成功'))
      await getRagList()
    } else {
      message.error(res.msg || t('修改失败'))
    }
  } catch (err) {
    console.error('modifyRag', err)
  }
}

/** 打开删除文档确认 */
export function openDelKnowledgeDoc(doc: ActiveKnowledgeDocDto) {
  const store = useKnowledgeStore.getState()
  store.setDeleteKnowledgeDoc(doc)
  store.setDeleteKnowledgeDocShow(true)
}

/** 取消删除文档 */
export function cancelDelKnowledgeDoc() {
  const store = useKnowledgeStore.getState()
  store.setDeleteKnowledgeDocShow(false)
  store.setDeleteKnowledgeDoc(null)
}

/** 确认删除文档 */
export async function confirmDelKnowledgeDoc() {
  const store = useKnowledgeStore.getState()
  if (!store.deleteKnowledgeDoc || !store.activeKnowledge) return
  try {
    const res = await ipcInvoke('rag:remove_doc', {
      ragName: store.activeKnowledge,
      docIdList: JSON.stringify([store.deleteKnowledgeDoc.doc_id]),
    })
    if (res.code === 200) {
      message.success(t('文档删除成功'))
      cancelDelKnowledgeDoc()
      await getRagDocList(store.activeKnowledge)
    } else {
      message.error(res.msg || t('文档删除失败'))
    }
  } catch (err) {
    console.error('confirmDelKnowledgeDoc', err)
  }
}

/** 获取文档内容 */
export async function getDocContent(doc: ActiveKnowledgeDocDto) {
  try {
    const res = await ipcInvoke('rag:get_doc_content', {
      ragName: doc.doc_rag,
      docName: doc.doc_name,
    })
    if (res.code === 200) {
      useKnowledgeStore.getState().setDocContent(res.message)
    }
  } catch (err) {
    console.error('getDocContent', err)
  }
}

/** 打开上传文档弹窗 */
export function openDocUploadDialog() {
  useKnowledgeStore.getState().setKnowledgeUploadDocShow(true)
}

/** 取消上传 */
export function cancelUpload() {
  const store = useKnowledgeStore.getState()
  store.setFileOrDirList([])
  store.setChooseList([])
  store.setIsUploadingDoc(false)
  store.setKnowledgeUploadDocShow(false)
}

/** 确认上传文档 */
export async function doUpload() {
  const store = useKnowledgeStore.getState()
  store.setIsUploadingDoc(true)
  try {
    const res = await ipcInvoke('rag:upload_doc', {
      ragName: store.activeKnowledge,
      filePath: JSON.stringify(store.fileOrDirList),
      separators: store.sliceChunkFormData.separators,
      chunkSize: store.sliceChunkFormData.chunkSize,
      overlapSize: store.sliceChunkFormData.overlapSize,
    })
    if (res.code === 200) {
      message.success(res.msg || t('上传成功'))
      cancelUpload()
      setTimeout(() => {
        getRagDocList(store.activeKnowledge!)
      }, 500)
      ragDocLoop()
    } else {
      message.error(res.msg || t('上传失败'))
      store.setIsUploadingDoc(false)
    }
  } catch (err) {
    console.error('doUpload', err)
    store.setIsUploadingDoc(false)
  }
}

/** 文档解析状态轮询 */
function ragDocLoop() {
  const store = useKnowledgeStore.getState()
  store.setDocParseStatus(true)
  const timer = setInterval(async () => {
    await getRagDocList(store.activeKnowledge!)
    const list = useKnowledgeStore.getState().activeKnowledgeDocList
    const allParsed = list.every((item) => item.is_parsed === 1 || item.is_parsed === 3)
    if (allParsed) {
      clearInterval(timer)
      useKnowledgeStore.getState().setDocParseStatus(false)
    }
  }, 5000)
}

/** 测试文档分片 */
export async function testChunk() {
  const store = useKnowledgeStore.getState()
  const params = { ...store.sliceChunkFormData }
  if (!store.customSeparators) {
    params.separators = []
  }
  try {
    return await ipcInvoke('rag:test_chunk', params)
  } catch (err) {
    console.error('testChunk', err)
  }
}

/** 文档分片预览 */
export async function doPreview() {
  const store = useKnowledgeStore.getState()
  if (!store.sliceChunkFormData.filename) {
    message.error(t('请选择文件'))
    return
  }
  const res = await testChunk()
  if (res?.message?.chunkList) {
    store.setSlicePreviewList(res.message.chunkList)
  }
}

/** 选择嵌入模型回调 */
export function doSelectModel(model: string, supplierName: string) {
  const store = useKnowledgeStore.getState()
  store.setCreateKnowledgeFormData({ embeddingModel: model, supplierName })
}

/** 选择/取消当前知识库（聊天关联） */
export function chooseCurrent(item: KnowledgeDocumentInfo) {
  if (!item.embeddingModelExist) return
  const store = useKnowledgeStore.getState()
  const list = [...store.activeKnowledgeForChat]
  const idx = list.indexOf(item.ragName)
  if (idx >= 0) {
    list.splice(idx, 1)
  } else {
    list.push(item.ragName)
  }
  store.setActiveKnowledgeForChat(list)
}

/** 优化知识库 */
export async function optimizeTable(ragName: string) {
  const store = useKnowledgeStore.getState()
  store.setOptimizeKnowledgeShow(true)
  try {
    const res = await ipcInvoke('rag:optimize_table', { ragName })
    message.success(res.msg || t('优化完成'))
  } catch (err) {
    console.error('optimizeTable', err)
  } finally {
    store.setOptimizeKnowledgeShow(false)
  }
}

/** 获取嵌入模型列表 */
export async function getEmbeddingModels() {
  try {
    const res = await ipcInvoke('rag:get_embedding_models')
    if (res.code === 200) {
      const models: any[] = Object.values(res.message).flat()
      useKnowledgeStore.getState().setEmbeddingModelsList(models)
      // 默认选择 bge-m3
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

/** 选择上传文件（通过IPC选择对话框） */
export async function chooseFiles() {
  try {
    const res = await ipcInvoke('index:select_file')
    if (res.code === 200 && res.message?.files) {
      const store = useKnowledgeStore.getState()
      store.setFileOrDirList([...store.fileOrDirList, ...res.message.files])
    }
  } catch (err) {
    console.error('chooseFiles', err)
  }
}

/** 选择上传文件夹 */
export async function chooseDir() {
  try {
    const res = await ipcInvoke('index:select_folder')
    if (res.code === 200 && res.message?.folder) {
      const store = useKnowledgeStore.getState()
      store.setFileOrDirList([...store.fileOrDirList, res.message.folder])
    }
  } catch (err) {
    console.error('chooseDir', err)
  }
}

/** 移除已选文件 */
export function removeFile(index: number) {
  const store = useKnowledgeStore.getState()
  const list = [...store.fileOrDirList]
  list.splice(index, 1)
  store.setFileOrDirList(list)
}
