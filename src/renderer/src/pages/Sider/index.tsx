import { useEffect } from 'react'
import { Button, Popover } from 'antd'
import { useTranslation } from 'react-i18next'
import useGlobalStore from '@/stores/global'
import { getChatList, makeNewChat, doFold, cleanAllChats } from './controller'
import ChatList from './ChatList'
import KnowledgeList from './KnowledgeList'
import SiderBottom from './SiderBottom'
import RemoveChatConfirm from './RemoveChatConfirm'
import ModifyChatConfirm from './ModifyChatConfirm'
import CleanChatsList from './CleanChatsList'
import './index.scss'

function Sider() {
  const { t } = useTranslation()
  const siderBg = useGlobalStore((s) => s.siderBg)

  useEffect(() => {
    getChatList()
  }, [])

  return (
    <>
      <div className="layout-sider-wrapper" style={{ background: siderBg }}>
        {/*logo*/}
        <div className="logo">
          <div className="log-left">
            <span className="text-[var(--bt-tit-color-secondary)] text-lg font-bold">
              AiKnowledgeBase
            </span>
          </div>
          <div>
            <i className="i-common:fold w-18 h-18 cursor-pointer" onClick={doFold}></i>
          </div>
        </div>
        {/* 新建对话按钮 */}
        <div className="flex justify-center items-center">
          <Button
            type="primary"
            ghost
            block
            onClick={makeNewChat}
            icon={<i className="i-tdesign:chat-add w-16 h-16" />}
          >
            {t('新建对话')}
          </Button>
        </div>

        {/* 对话标题 */}
        <div className="recent-header">
          <span className="ml-8 text-[var(--bt-notice-text-color)]">{t('对话')}</span>
          <Popover content={t('清空对话')} trigger="hover">
            <i className="i-ci:bar-top w-14 h-14 cursor-pointer" onClick={cleanAllChats} />
          </Popover>
        </div>

        {/* 对话列表 */}
        <div className="sider-wrapper" style={{ overflow: 'hidden' }}>
          <div className="sider-top" style={{ height: '100%', overflowY: 'auto' }}>
            <ChatList />
          </div>
          <div className="sider-divider" />
        </div>

        {/* 知识库标题 */}
        <div className="recent-header">
          <span className="text-[var(--bt-notice-text-color)] flex justify-start items-center ml-10">
            {t('知识库')}
          </span>
        </div>

        {/* 知识库列表 */}
        <div className="sider-wrapper" style={{ overflow: 'hidden' }}>
          <div className="sider-top" style={{ height: '100%', overflowY: 'auto' }}>
            <KnowledgeList />
          </div>
        </div>

        {/* 底部菜单 */}
        <div className="sider-bottom">
          <div className="sider-divider" />
          <SiderBottom />
        </div>
      </div>
      {/* 弹窗 */}
      <RemoveChatConfirm />
      <ModifyChatConfirm />
      <CleanChatsList />
    </>
  )
}

export default Sider
