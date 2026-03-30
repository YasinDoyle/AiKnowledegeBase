import { Button } from 'antd'
import { useTranslation } from 'react-i18next'
import logoImg from '@/assets/images/logo.png'

export default function WelcomeContent() {
  const { t } = useTranslation()

  function jumpToGithub() {
    window.open('https://github.com/YasinDoyle/AiKnowledegeBase')
  }

  return (
    <>
      <WelcomeRow>
        <p>
          {t(
            '欢迎使用AiKnowledgeBase，这是一款简单好用的AI助手，支持知识库、模型API、分享、联网搜索、智能体，此软件开源免费，也期待您分享软件给别人来支持我们的发展。',
          )}
        </p>
      </WelcomeRow>
      <WelcomeRow>
        <p>
          {t(
            'AiKnowledgeBase是一个新的AI项目，它还在努力快速成长中，如果您在使用过程中遇到什么问题，或者您对软件有什么功能需求，可以加入我们微信群给我们进行反馈。',
          )}
        </p>
      </WelcomeRow>
      <WelcomeRow>
        <p>
          {t('最后您可以给我们开源项目点星星，您的这点鼓励对我们继续迭代开源项目极其重要，感谢。')}
        </p>
        <p className="mt-20px">
          <Button ghost onClick={jumpToGithub}>
            ⭐ {t('去github点星星')}
          </Button>
        </p>
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
