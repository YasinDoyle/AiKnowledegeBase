import { Checkbox } from 'antd'
import { useTranslation } from 'react-i18next'
import useKnowledgeStore from '@/stores/knowledge'
import { chooseCurrent } from './controller'
import type { KnowledgeDocumentInfo } from '@/types'

export default function KnowledgeChoosePanel() {
  const { t } = useTranslation()
  const knowledgeList = useKnowledgeStore((s) => s.knowledgeList)
  const activeForChat = useKnowledgeStore((s) => s.activeKnowledgeForChat)

  return (
    <div className="flex flex-col gap-8 p-10">
      <div className="font-bold mb-8">{t('选择知识库')}</div>
      {knowledgeList.map((item: KnowledgeDocumentInfo) => (
        <div
          key={item.ragName}
          className={`flex items-center gap-8 p-8 rounded cursor-pointer ${!item.embeddingModelExist ? 'opacity-50' : 'hover:bg-[var(--bt-theme-color-hover)]'}`}
          onClick={() => chooseCurrent(item)}
        >
          <Checkbox
            checked={activeForChat.includes(item.ragName)}
            disabled={!item.embeddingModelExist}
          />
          <div className="flex-1 min-w-0">
            <div className="truncate font-bold">{item.ragName}</div>
            <div className="text-12 text-gray-5 truncate">{item.ragDesc}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
