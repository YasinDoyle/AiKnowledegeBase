import { Dropdown, Tooltip } from 'antd'
import { useTranslation } from 'react-i18next'
import useKnowledgeStore from '@/stores/knowledge'
import { dealPopOperation } from './controller'
import { singleActive, openCreateKnowledge } from '../KnowledgeStore/controller'
import './KnowledgeList.scss'

function KnowledgeList() {
  const { t } = useTranslation()
  const knowledgeList = useKnowledgeStore((s) => s.knowledgeList)
  const activeKnowledge = useKnowledgeStore((s) => s.activeKnowledge)

  const menuItems = (item: any) => [
    { key: 'delChat', label: t('删除'), onClick: () => dealPopOperation('delChat', item) },
    { key: 'modifyTitle', label: t('修改'), onClick: () => dealPopOperation('modifyTitle', item) },
    {
      key: 'optimization',
      label: (
        <Tooltip title={t('增强索引,并释放多余的空间占用')}>
          <span>{t('优化')}</span>
        </Tooltip>
      ),
      onClick: () => dealPopOperation('optimization', item),
    },
  ]

  const openKnowledgeStore = (item: any) => {
    singleActive(item.ragName)
  }

  const createNewKnowledgeStore = () => {
    openCreateKnowledge()
  }

  return (
    <div className="recent-comunication">
      <ul className="recent-list">
        {knowledgeList.map((item) => (
          <li
            key={item.ragName}
            className={item.ragName === activeKnowledge ? 'active' : ''}
            onClick={() => openKnowledgeStore(item)}
          >
            <div className="flex items-center" style={{ height: '100%' }}>
              <i className="i-tdesign:folder w-16 h-16 mr-10 ml-8 text-[var(--bt-tit-color-secondary)]" />
              <div className="comu-title">{item.ragName}</div>
            </div>

            <Dropdown menu={{ items: menuItems(item) }} trigger={['click']}>
              <div
                className="flex justify-center items-center"
                style={{ height: '100%', padding: '0 8px' }}
                onClick={(e) => e.stopPropagation()}
              >
                <i className="i-common:more-operation w-16 h-16" />
              </div>
            </Dropdown>
          </li>
        ))}

        <li onClick={createNewKnowledgeStore}>
          <div className="flex items-center" style={{ height: '100%' }}>
            <i className="i-tdesign:folder-add w-16 h-16 mr-10 ml-8 text-[var(--bt-tit-color-secondary)]" />
            <div className="comu-title">{t('新建知识库')}</div>
          </div>
        </li>
      </ul>
    </div>
  )
}

export default KnowledgeList
