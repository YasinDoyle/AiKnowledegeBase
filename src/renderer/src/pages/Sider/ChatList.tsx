import { Dropdown } from 'antd'
import { useTranslation } from 'react-i18next'
import useSiderStore from '@/stores/sider'
import { handleChoose, doChatOperateSelect } from './controller'
import type { ChatItemInfo } from '@/types'
import './ChatList.scss'

function ChatList() {
  const { t } = useTranslation()
  const chatList = useSiderStore((s) => s.chatList)
  const currentContextId = useSiderStore((s) => s.currentContextId)

  const menuItems = (contextId: string) => [
    {
      key: 'delChat',
      label: t('删除对话'),
      onClick: () => doChatOperateSelect('delChat', contextId),
    },
    {
      key: 'modifyTitle',
      label: t('修改标题'),
      onClick: () => doChatOperateSelect('modifyTitle', contextId),
    },
  ]

  return (
    <div className="recent-comunication">
      <ul className="recent-list">
        {chatList.map((item: ChatItemInfo) => (
          <li
            key={item.context_id}
            className={currentContextId === item.context_id ? 'active' : ''}
            onClick={() => handleChoose(item)}
          >
            <div className="flex items-center" style={{ height: '100%' }}>
              {item.agent_info ? (
                <>
                  <span className="mr-10 ml-8">{item.agent_info.icon || '😀'}</span>
                  <div className="comu-title">{item.agent_info.agent_title}</div>
                </>
              ) : (
                <>
                  <i className="i-tdesign:chat w-16 h-16 mr-10 ml-8 text-[var(--bt-tit-color-secondary)]" />
                  <div className="comu-title">{item.title || t('对话内容')}</div>
                </>
              )}
            </div>

            <Dropdown menu={{ items: menuItems(item.context_id) }} trigger={['click']}>
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
      </ul>
    </div>
  )
}

export default ChatList
