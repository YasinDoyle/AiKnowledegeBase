import { Button, Image } from 'antd'
import { useTranslation } from 'react-i18next'
import useChatContentStore from '@/stores/chatContent'
import useAgentStore from '@/stores/agent'
import WelcomeContent from './WelcomeContent'
import logoImg from '@/assets/images/logo.png'

export default function ChatWelcome() {
  const { t } = useTranslation()
  const chatHistory = useChatContentStore((s) => s.chatHistory)
  const guideActive = useChatContentStore((s) => s.guideActive)
  const currentChatAgent = useAgentStore((s) => s.currentChatAgent)

  // 新手引导
  if (chatHistory.size === 0 && guideActive && !currentChatAgent) {
    return <WelcomeContent />
  }

  // 智能体或空对话
  if ((chatHistory.size === 0 && !guideActive) || currentChatAgent) {
    return (
      <div className="answer" style={{ marginBottom: 20 }}>
        {currentChatAgent ? (
          <div className="w-30px h-30px text-24px">{currentChatAgent.icon || '😀'}</div>
        ) : (
          <img src={logoImg} width={30} height={30} alt="logo" />
        )}
        <div className="answer-token">
          <p style={{ lineHeight: '30px' }}>
            {currentChatAgent ? currentChatAgent.prompt : t('让我们开启一段新的对话吧')}
          </p>
        </div>
      </div>
    )
  }

  return null
}
