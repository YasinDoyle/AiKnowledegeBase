import { useEffect } from 'react'
import { Button, Popover, Spin, Divider, Tooltip } from 'antd'
import { useTranslation } from 'react-i18next'
import useKnowledgeStore from '@/stores/knowledge'
import { isoToLocalDateTime } from '@/utils/tools'
import {
  openKnowledgeStore,
  openDocUploadDialog,
  openDelKnowledgeDoc,
  getDocContent,
} from './controller'
import { knowledgeIsClose } from '@/pages/Sider/controller'
import CreateKnowledgeStore from './CreateKnowledgeStore'
import DelKnowledgeConfirm from './DelKnowledgeConfirm'
import DelKnowledgeDocConfirm from './DelKnowledgeDocConfirm'
import UploadKnowledgeDoc from './UploadKnowledgeDoc'
import InstallEmbedding from './InstallEmbedding'
import OptimizeProgress from './OptimizeProgress'
import KnowledgeDocGeneralConfig from './KnowledgeDocGeneralConfig'
import MarkdownRender from '@/pages/Answer/MarkdownRender'
import type { ActiveKnowledgeDocDto } from '@/types'

export default function KnowledgeStore() {
  const { t } = useTranslation()
  const activeKnowledge = useKnowledgeStore((s) => s.activeKnowledge)
  const activeKnowledgeDto = useKnowledgeStore((s) => s.activeKnowledgeDto)
  const activeKnowledgeDocList = useKnowledgeStore((s) => s.activeKnowledgeDocList)
  const docParseStatus = useKnowledgeStore((s) => s.docParseStatus)
  const docContent = useKnowledgeStore((s) => s.docContent)

  useEffect(() => {
    openKnowledgeStore()
  }, [])

  return (
    <div className="flex h-full">
      {/* 左侧：知识库文件管理面板 */}
      <div className="w-240 border-r border-gray-2 flex flex-col h-full">
        {/* 头部：知识库名称 + 关闭按钮 */}
        <div className="flex items-center justify-between px-12 pt-12 pb-4">
          <div className="flex items-center gap-8 min-w-0 flex-1">
            <span className="i-tdesign:folder w-20 h-20 shrink-0" />
            <Tooltip title={activeKnowledge}>
              <span className="font-bold truncate">{activeKnowledge}</span>
            </Tooltip>
          </div>
          <span
            className="i-carbon:close w-18 h-18 cursor-pointer shrink-0 hover:text-red-5"
            onClick={knowledgeIsClose}
          />
        </div>
        <Divider className="my-8" />

        {/* 嵌入模型不存在提示 */}
        {activeKnowledgeDto && !activeKnowledgeDto.embeddingModelExist && (
          <div className="px-12 mb-8 text-12 text-gray-4">
            {t('模型{{model}}不存在，请添加本地模型或第三方模型api', {
              model: activeKnowledgeDto.embeddingModel,
            })}
          </div>
        )}

        <div className="flex-1 flex flex-col overflow-hidden px-12">
          {/* 上传按钮 */}
          <Button block onClick={openDocUploadDialog} className="mb-8">
            <span className="i-tdesign:file-add w-16 h-16 mr-4" />
            {t('上传文件')}
          </Button>

          {/* 文件数量 */}
          <div className="flex items-center justify-between text-12 text-gray-5 mb-8">
            <span>{t('{{count}}个文件', { count: activeKnowledgeDocList.length })}</span>
          </div>

          {/* 解析中提示 */}
          {docParseStatus && (
            <div className="flex items-center gap-5 mb-8 text-12">
              <Spin size="small" />
              <span className="text-warning">{t('文档嵌入中，请稍后')}...</span>
            </div>
          )}

          {/* 文档列表 */}
          <div className="flex-1 overflow-y-auto">
            <ul className="list-none m-0 p-0">
              {activeKnowledgeDocList.map((doc) => (
                <DocItem key={doc.doc_id} doc={doc} onClickDoc={getDocContent} />
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 右侧：文档内容预览 */}
      <div className="flex-1 overflow-y-auto p-16">
        {docContent ? (
          <MarkdownRender content={docContent} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-4 text-14">
            {t('点击左侧文档查看内容')}
          </div>
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

function DocItem({
  doc,
  onClickDoc,
}: {
  doc: ActiveKnowledgeDocDto
  onClickDoc: (doc: ActiveKnowledgeDocDto) => void
}) {
  const { t } = useTranslation()

  // -1:解析失败  0:待解析  1:嵌入成功  2:已解析待嵌入  3:嵌入成功
  const getStatusInfo = () => {
    switch (doc.is_parsed) {
      case 1:
      case 3:
        return { text: t('已嵌入完成, 可正常调用'), color: 'green', icon: 'text-gray' }
      case 0:
        return { text: t('正在嵌入中,请稍后...'), color: 'orange', icon: 'text-warning' }
      case 2:
        return { text: t('文档解析成功,等待嵌入'), color: 'blue', icon: 'text-info' }
      case -1:
        return { text: t('文档解析失败'), color: 'red', icon: 'text-danger' }
      default:
        return { text: t('未知状态'), color: 'default', icon: 'text-gray' }
    }
  }
  const status = getStatusInfo()

  return (
    <li
      className="flex items-center justify-between py-6 px-4 rounded cursor-pointer hover:bg-[var(--bt-theme-color-hover)] group"
      onClick={() => onClickDoc(doc)}
    >
      <Popover
        trigger="hover"
        placement="right"
        content={
          <div className="max-w-300">
            <div className="font-bold mb-4">{doc.doc_name}</div>
            <div className="text-gray-5 text-12 mb-4">
              {t('上传时间')}: {isoToLocalDateTime(doc.update_time * 1000)}
            </div>
            {doc.doc_abstract && (
              <div className="text-12 mb-4">
                {t('AI摘要')}: {doc.doc_abstract}
              </div>
            )}
            <div
              style={{
                color:
                  status.color === 'green'
                    ? 'var(--ant-color-success)'
                    : status.color === 'red'
                      ? 'var(--ant-color-error)'
                      : status.color === 'blue'
                        ? 'var(--ant-color-info)'
                        : 'var(--ant-color-warning)',
              }}
            >
              {status.text}
            </div>
          </div>
        }
      >
        <div className="flex items-center gap-8 min-w-0 flex-1">
          <span className={`i-tdesign:file w-19 h-19 shrink-0 ${status.icon}`} />
          <span className="truncate text-13">{doc.doc_name}</span>
        </div>
      </Popover>
      <span
        className="i-ri:close-circle-line w-18 h-18 shrink-0 text-gray-4 opacity-0 group-hover:opacity-100 hover:text-red-5"
        onClick={(e) => {
          e.stopPropagation()
          openDelKnowledgeDoc(doc)
        }}
      />
    </li>
  )
}
