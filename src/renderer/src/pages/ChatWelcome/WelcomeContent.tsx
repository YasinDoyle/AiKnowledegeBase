import { useTranslation } from 'react-i18next'
import logoImg from '@/assets/images/logo.png'

export default function WelcomeContent() {
  const { t } = useTranslation()

  return (
    <>
      <WelcomeRow>
        <p>
          {t(
            '欢迎使用AiKnowledgeBase，这是一款简单好用的AI助手，支持知识库、模型API、分享、联网搜索、智能体。',
          )}
        </p>
      </WelcomeRow>
      <WelcomeRow>
        <p>{t('让我们开启一段新的对话吧')}😀</p>
      </WelcomeRow>
      <WelcomeRow>
        <p>
          {t('您可以在')}
          {t('设置')}
          {t('中关闭新手指引')}
        </p>
      </WelcomeRow>
    </>
  )
}

function WelcomeRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="answer" style={{ marginBottom: 20 }}>
      <div className="w-30px h-30px">
        <img src={logoImg} width={30} height={30} alt="logo" />
      </div>
      <div className="answer-token">{children}</div>
    </div>
  )
}
