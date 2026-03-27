import { Tooltip, Image } from 'antd'
import { CopyOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { message } from '@/utils/message'
import { getFileNameFromPath } from '@/utils/tools'
import type { MultipeQuestionDto } from '@/types'
import userImage from '@/assets/images/user.png'
import pdfIcon from '@/assets/images/PDF.png'
import './question.scss'

interface Props {
  questionContent: MultipeQuestionDto
}

export default function Question({ questionContent }: Props) {
  const { t } = useTranslation()

  async function copyQuestion(text: string) {
    await navigator.clipboard.writeText(text)
    message.success(t('复制成功'))
  }

  function openFile(filePath: string) {
    window.open(`file://${filePath}`)
  }

  const displayContent = questionContent.content.replace(/^\d+--/, '')

  return (
    <div className="question">
      <img src={userImage} width={30} height={30} alt="user" className="mt-6px" />
      <div className="question-token-wrapper">
        {/* 附件列表 */}
        {questionContent.files && questionContent.files.length > 0 && (
          <div className="files">
            {questionContent.files.map((item, index) => (
              <div key={index} className="file-item cursor-pointer" onClick={() => openFile(item)}>
                <img src={pdfIcon} width={40} alt="file" />
                <span className="show-tit">{getFileNameFromPath(item)}</span>
              </div>
            ))}
          </div>
        )}

        {/* 图片列表 */}
        {questionContent.images && questionContent.images.length > 0 && (
          <div className="images">
            {questionContent.images.map((item) => (
              <Image key={item} src={item} width={240} />
            ))}
          </div>
        )}

        {/* 提问内容 */}
        <div className="question-content">
          <div className="question-token" dangerouslySetInnerHTML={{ __html: displayContent }} />
          <div className="tools">
            {!questionContent.files?.length && !questionContent.images?.length && (
              <Tooltip title={t('复制')}>
                <span className="tool-item" onClick={() => copyQuestion(displayContent)}>
                  <CopyOutlined />
                </span>
              </Tooltip>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
