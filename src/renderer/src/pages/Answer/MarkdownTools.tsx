import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { message } from '@/utils/message'

interface Props {
  codeContent: string
}

export default function MarkdownTools({ codeContent }: Props) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  async function copyCode() {
    await navigator.clipboard.writeText(codeContent)
    setCopied(true)
    message.success(t('复制成功'))
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="tool-wrapper">
      <span onClick={copyCode} style={{ cursor: 'pointer' }}>
        {copied ? t('已复制') : t('复制')}
      </span>
      <span style={{ cursor: 'pointer' }}>{t('引用')}</span>
    </div>
  )
}
