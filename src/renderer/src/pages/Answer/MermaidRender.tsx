import { useState, useRef, useCallback } from 'react'
import { Card, Button } from 'antd'
import { useTranslation } from 'react-i18next'
import { message } from '@/utils/message'

interface Props {
  maidContent: string
  id: string
}

export default function MermaidRender({ maidContent, id }: Props) {
  const { t } = useTranslation()
  const [showSvg, setShowSvg] = useState(false)
  const svgRef = useRef<HTMLDivElement>(null)

  const renderSvg = useCallback(async () => {
    const { default: mermaid } = await import('mermaid')
    mermaid.initialize({ startOnLoad: false, theme: 'default' })
    mermaid.parseError = (err) => {
      console.warn(err)
    }
    const el = svgRef.current
    if (!el) return
    try {
      const res = await mermaid.render(id, maidContent)
      el.innerHTML = res.svg
    } catch {
      el.textContent = t('mermaid解析失败,请检查语法')
    }
  }, [maidContent, id, t])

  function handleShowImg() {
    setShowSvg(true)
    setTimeout(renderSvg, 0)
  }

  function doCopy() {
    navigator.clipboard.writeText(maidContent)
    message.success(t('复制成功'))
  }

  return (
    <Card
      size="small"
      title={
        <div className="flex justify-between items-center">
          <span className="text-14px">mermaid</span>
          <div className="flex gap-5px">
            <Button size="small" type="primary" ghost onClick={doCopy}>
              {t('复制')}
            </Button>
            <Button size="small" type="primary" ghost onClick={handleShowImg}>
              {t('图形')}
            </Button>
            <Button size="small" type="primary" ghost onClick={() => setShowSvg(false)}>
              {t('源码')}
            </Button>
          </div>
        </div>
      }
      style={{ marginBottom: 20 }}
    >
      {showSvg ? <div ref={svgRef} className="flex justify-center" /> : <pre>{maidContent}</pre>}
    </Card>
  )
}
