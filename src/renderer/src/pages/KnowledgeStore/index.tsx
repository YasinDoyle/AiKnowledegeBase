import { useEffect } from 'react'
import { Button, Popover, Tag, Spin } from 'antd'
import { useTranslation } from 'react-i18next'
import useKnowledgeStore from '@/stores/knowledge'
import {
  openKnowledgeStore,
  singleActive,
  openCreateKnowledge,
  openDelKnowledge,
  openDocUploadDialog,
  openDelKnowledgeDoc,
  optimizeTable,
} from './controller'
import CreateKnowledgeStore from './CreateKnowledgeStore'
import DelKnowledgeConfirm from './DelKnowledgeConfirm'
import DelKnowledgeDocConfirm from './DelKnowledgeDocConfirm'
import UploadKnowledgeDoc from './UploadKnowledgeDoc'
import InstallEmbedding from './InstallEmbedding'
import OptimizeProgress from './OptimizeProgress'
import KnowledgeDocGeneralConfig from './KnowledgeDocGeneralConfig'
import type { ActiveKnowledgeDocDto } from '@/types'

export default function KnowledgeStore() {
  const { t } = useTranslation()
  const knowledgeList = useKnowledgeStore((s) => s.knowledgeList)
  const activeKnowledge = useKnowledgeStore((s) => s.activeKnowledge)
  const activeKnowledgeDocList = useKnowledgeStore((s) => s.activeKnowledgeDocList)
  const docParseStatus = useKnowledgeStore((s) => s.docParseStatus)

  useEffect(() => {
    openKnowledgeStore()
  }, [])

  return (
    <div className="flex h-full">
      {/* 知识库列表侧边 */}
      <div className="w-200 border-r border-gray-2 p-10 flex flex-col">
        <div className="flex justify-between items-center mb-10">
          <span className="font-bold">{t('知识库')}</span>
          <Button type="primary" size="small" onClick={openCreateKnowledge}>
            {t('新建')}
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {knowledgeList.map((item) => (
            <div
              key={item.ragName}
              className={`p-8 cursor-pointer rounded mb-4 ${activeKnowledge === item.ragName ? 'bg-[var(--bt-theme-color-hover)]' : 'hover:bg-[var(--bt-theme-color-hover)]'}`}
              onClick={() => singleActive(item.ragName)}
            >
              <div className="truncate font-bold">{item.ragName}</div>
              <div className="text-12 text-gray-5 truncate">{item.ragDesc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 文档列表 */}
      <div className="flex-1 p-10">
        {activeKnowledge && (
          <>
            <div className="flex justify-between items-center mb-10">
              <span className="font-bold text-16">{activeKnowledge}</span>
              <div className="flex gap-8">
                <Button size="small" onClick={openDocUploadDialog}>
                  {t('上传文档')}
                </Button>
                <Button size="small" onClick={() => optimizeTable(activeKnowledge)}>
                  {t('优化')}
                </Button>
                <Button size="small" danger onClick={openDelKnowledge}>
                  {t('删除知识库')}
                </Button>
              </div>
            </div>
            {docParseStatus && (
              <div className="flex items-center gap-8 mb-10">
                <Spin size="small" />
                <span className="text-12 text-gray-5">{t('文档解析中...')}</span>
              </div>
            )}
            <div className="flex flex-col gap-8">
              {activeKnowledgeDocList.map((doc) => (
                <DocItem key={doc.doc_id} doc={doc} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* 子弹窗 */}
      <CreateKnowledgeStore />
      <DelKnowledgeConfirm />
      <DelKnowledgeDocConfirm />
      <UploadKnowledgeDoc />
      <InstallEmbedding />
      <OptimizeProgress />
      <KnowledgeDocGeneralConfig />
    </div>
  )
}

function DocItem({ doc }: { doc: ActiveKnowledgeDocDto }) {
  const { t } = useTranslation()
  const parseStatusText =
    doc.is_parsed === 1 ? t('已解析') : doc.is_parsed === 3 ? t('解析失败') : t('解析中')
  const parseColor = doc.is_parsed === 1 ? 'green' : doc.is_parsed === 3 ? 'red' : 'blue'

  return (
    <div className="flex justify-between items-center p-8 border border-gray-2 rounded">
      <Popover
        content={
          <div>
            <div>
              {t('文件')}: {doc.doc_name}
            </div>
            <div>
              {t('状态')}: {parseStatusText}
            </div>
          </div>
        }
      >
        <span className="truncate flex-1 cursor-pointer">{doc.doc_name}</span>
      </Popover>
      <div className="flex items-center gap-8">
        <Tag color={parseColor}>{parseStatusText}</Tag>
        <span
          className="i-weui:delete-outlined w-18 h-18 cursor-pointer hover:text-red-5"
          onClick={() => openDelKnowledgeDoc(doc)}
        />
      </div>
    </div>
  )
}
