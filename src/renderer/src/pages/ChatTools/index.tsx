import { useEffect, useRef, useMemo } from 'react'
import { Button, Input, Tooltip, Popover } from 'antd'
import {
  PaperClipOutlined,
  SendOutlined,
  StopOutlined,
  GlobalOutlined,
  FolderOutlined,
  ToolOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import useChatToolsStore from '@/stores/chatTools'
import useChatContentStore from '@/stores/chatContent'
import useKnowledgeStore from '@/stores/knowledge'
import useSoftSettingsStore from '@/stores/softSettings'
import FileList from './FileList'
import ToolsChoosePanel from './ToolsChoosePanel'
import {
  sendChatToModel,
  handleKeyDown,
  handleFilesChange,
  toggleSearchEngine,
  toggleTempChat,
  getMcpServerListForChat,
  acceptFileType,
} from './controller'
import { eventBus } from '@/utils/tools'
import { scrollMove } from '@/pages/ChatContent/controller'
import './chatTools.scss'

const doScroll = scrollMove()

export default function ChatTools() {
  const { t } = useTranslation()
  const fileRef = useRef<HTMLInputElement>(null)
  const activeKnowledge = useKnowledgeStore((s) => s.activeKnowledge)
  const activeKnowledgeForChat = useKnowledgeStore((s) => s.activeKnowledgeForChat)
  const questionContent = useChatToolsStore((s) => s.questionContent)
  const tempChat = useChatToolsStore((s) => s.tempChat)
  const netActive = useChatToolsStore((s) => s.netActive)
  const chatMask = useChatToolsStore((s) => s.chatMask)
  const mcpListChoosed = useChatToolsStore((s) => s.mcpListChoosed)
  const isInChat = useChatContentStore((s) => s.isInChat)
  const themeMode = useSoftSettingsStore((s) => s.themeMode)
  const themeColors = useSoftSettingsStore((s) => s.themeColors)

  const questionToolBg =
    themeMode === 'light' ? themeColors.questionToolBgLight : themeColors.questionToolBgDark

  useEffect(() => {
    getMcpServerListForChat()
    eventBus.$on('chat-tool-do-scroll', () => doScroll(100))
    return () => eventBus.$del('chat-tool-do-scroll')
  }, [])

  if (activeKnowledge) return null

  return (
    <div className="search-tools-wrapper">
      {chatMask.status && (
        <div className="chat-mask">
          <span>{chatMask.notice}</span>
        </div>
      )}
      <div className="search-tools">
        <div className="tools" style={{ backgroundColor: questionToolBg }}>
          <FileList />
          <Input.TextArea
            placeholder={t('请输入对话内容')}
            className="input-token"
            autoSize={{ minRows: 3, maxRows: 15 }}
            value={questionContent}
            onChange={(e) => useChatToolsStore.getState().setQuestionContent(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          <div className="send-tools">
            {/* 无记忆 */}
            <Tooltip title={t(' 能提升单次回复质量，但大模型将没有上下文记忆')}>
              <Button
                ghost={tempChat}
                type={tempChat ? 'primary' : 'default'}
                onClick={toggleTempChat}
                className="h-40px"
              >
                {t('无记忆')}
              </Button>
            </Tooltip>

            {/* 上传附件 */}
            <input
              type="file"
              ref={fileRef}
              style={{ display: 'none' }}
              accept={acceptFileType}
              onChange={handleFilesChange}
            />
            <Tooltip title={t('支持上传文件、图片(最大不超过20MB), 支持PDF、DOC、TXT等格式')}>
              <Button
                icon={<PaperClipOutlined />}
                onClick={() => fileRef.current?.click()}
                className="h-40px"
              >
                {t('上传附件')}
              </Button>
            </Tooltip>

            <Popover
              trigger="click"
              content={<div style={{ padding: 10 }}>{t('知识库选择面板')}</div>}
            >
              <Button
                ghost={activeKnowledgeForChat.length > 0}
                type={activeKnowledgeForChat.length > 0 ? 'primary' : 'default'}
                icon={<FolderOutlined />}
                className="h-40px"
              >
                {t('知识库')}
              </Button>
            </Popover>

            {/* 工具 */}
            <Popover trigger="click" content={<ToolsChoosePanel />}>
              <Button
                ghost={mcpListChoosed.length > 0}
                type={mcpListChoosed.length > 0 ? 'primary' : 'default'}
                icon={<ToolOutlined />}
                className="h-40px"
              >
                {t('工具')}
              </Button>
            </Popover>

            {/* 联网搜索 */}
            <Button
              ghost={netActive}
              type={netActive ? 'primary' : 'default'}
              icon={<GlobalOutlined />}
              onClick={toggleSearchEngine}
              className="h-40px"
            >
              {t('联网搜索')}
            </Button>

            {/* 发送/停止 */}
            {!isInChat ? (
              <Button
                type="primary"
                className="send-btn"
                disabled={!questionContent.trim()}
                onClick={sendChatToModel}
                icon={<SendOutlined />}
              >
                {t('发送')}
              </Button>
            ) : (
              <Button
                danger
                className="send-btn"
                onClick={() => {
                  import('./controller').then(({ stopGenerate }) => stopGenerate())
                }}
                icon={<StopOutlined />}
              >
                {t('停止生成')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
