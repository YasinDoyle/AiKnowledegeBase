import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import useSoftSettingsStore from '@/stores/softSettings'

interface Props {
  content: string
}

export default function McpToolsWrapper({ content }: Props) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const themeMode = useSoftSettingsStore((s) => s.themeMode)
  const themeColors = useSoftSettingsStore((s) => s.themeColors)

  const thinkBg =
    themeMode === 'light' ? themeColors.thinkWrapperLight : themeColors.thinlWrapperDark

  const mcpToolContent = useMemo(() => {
    try {
      return JSON.parse(content.replace(/<mcptool>|<\/mcptool>/g, '').trim())
    } catch {
      return { tool_server: 'unknown', tool_name: 'unknown', tool_result: [] }
    }
  }, [content])

  const preContent = useMemo(() => {
    const parts: string[] = []
    for (const item of mcpToolContent.tool_result || []) {
      if (item.type === 'text') {
        try {
          parts.push(JSON.stringify(JSON.parse(item.text), null, 4))
        } catch {
          parts.push(item.text)
        }
      } else {
        parts.push(JSON.stringify(item))
      }
    }
    return parts.join('\n')
  }, [mcpToolContent])

  if (!content.replace(/\s/g, '')) return null

  return (
    <div
      className="mcp-tools-wrapper"
      style={{
        marginBottom: 5,
        backgroundColor: thinkBg,
        overflow: 'hidden',
        transition: 'max-height 0.3s ease',
        maxHeight: isOpen ? '5000px' : '42px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(22deg, rgb(11, 163, 96) 0%, #3cba92 100%)',
          padding: 10,
          color: '#fff',
          cursor: 'pointer',
          fontSize: 12,
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="flex items-center gap-5px">
          ✅ {t('调用结果:')} [{mcpToolContent.tool_server}--{mcpToolContent.tool_name}]
        </span>
        <span>{isOpen ? '▲' : '▼'}</span>
      </div>
      {isOpen && (
        <pre
          style={{
            fontFamily: 'Microsoft YAHEI, monospace',
            paddingLeft: 26,
            whiteSpace: 'pre-wrap',
            overflowWrap: 'break-word',
          }}
        >
          {preContent}
        </pre>
      )}
    </div>
  )
}
