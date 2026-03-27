import { Spin } from 'antd'
import { useTranslation } from 'react-i18next'
import useChatContentStore from '@/stores/chatContent'
import useSoftSettingsStore from '@/stores/softSettings'
import MarkdownRender from './MarkdownRender'
import AnswerTools from './AnswerTools'
import { answerLogo } from './controller'
import type { AnswerInfo, MultipeQuestionDto, Stat } from '@/types'
import './answer.scss'

interface Props {
  answerContent: AnswerInfo
  questionContent: MultipeQuestionDto
}

export default function Answer({ answerContent, questionContent }: Props) {
  const { t } = useTranslation()
  const isInChat = useChatContentStore((s) => s.isInChat)
  const targetNet = useSoftSettingsStore((s) => s.targetNet)

  const model = answerContent.stat ? (answerContent.stat as Stat).model || '' : ''
  const logo = answerLogo(model)

  return (
    <div className="answer">
      <img src={logo} width={30} height={30} alt="model" className="answer-logo" />
      {!answerContent.content && isInChat ? (
        <div className="answer-token flex items-center gap-5px">
          <Spin size="small" />
          {targetNet ? t('正在搜索...') : t('正在思考...')}
        </div>
      ) : (
        <div className="answer-token">
          <MarkdownRender
            content={answerContent.content as string}
            searchResult={
              Array.isArray(answerContent.search_result) ? answerContent.search_result : []
            }
            toolsResult={answerContent.tools_result?.length ? answerContent.tools_result : []}
          />
          <AnswerTools answerContent={answerContent} questionContent={questionContent} />
        </div>
      )}
    </div>
  )
}
