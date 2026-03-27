import { Tooltip, Popover } from 'antd'
import { CopyOutlined, InfoCircleOutlined, ReloadOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { copyContent, answerAgain } from './controller'
import { isoToLocalDateTime, fixedStrNum } from '@/utils/tools'
import type { AnswerInfo, MultipeQuestionDto, Stat } from '@/types'

interface Props {
  answerContent: AnswerInfo
  questionContent: MultipeQuestionDto
}

export default function AnswerTools({ answerContent, questionContent }: Props) {
  const { t } = useTranslation()
  const stat = answerContent.stat as Stat | undefined

  return (
    <div className="answer-tools">
      <Tooltip title={t('复制')}>
        <span className="tool-item" onClick={() => copyContent(answerContent.content as string)}>
          <CopyOutlined />
        </span>
      </Tooltip>

      <Popover
        placement="top"
        content={
          stat?.eval_count ? (
            <div className="flex flex-col gap-2px text-12px">
              <div>eval count: {stat.eval_count}</div>
              <div>model: {stat.model}</div>
              <div>created at: {isoToLocalDateTime(stat.created_at || '')}</div>
              <div>total duration: {fixedStrNum(stat.total_duration || '')}s</div>
              <div>load duration: {fixedStrNum(stat.load_duration || '')}ms</div>
              <div>prompt eval count: {stat.prompt_eval_count}</div>
              <div>prompt eval duration: {fixedStrNum(stat.prompt_eval_duration || '')}ms</div>
              <div>eval duration: {fixedStrNum(stat.eval_duration || '')}s</div>
            </div>
          ) : (
            <span>{t('暂无信息')}</span>
          )
        }
      >
        <span className="tool-item">
          <InfoCircleOutlined />
        </span>
      </Popover>

      <Tooltip title={t('重新生成')}>
        <span
          className="tool-item"
          onClick={() => answerAgain(questionContent, answerContent.id || '')}
        >
          <ReloadOutlined />
        </span>
      </Tooltip>
    </div>
  )
}
