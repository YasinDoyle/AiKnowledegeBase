import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import markdownit from 'markdown-it'
import hljs from 'highlight.js'
import useSoftSettingsStore from '@/stores/softSettings'

interface Props {
  content: string
}

const md: markdownit = markdownit({
  html: true,
  linkify: true,
  typographer: true,
  highlight(str: string, lang: string): string {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang, ignoreIllegals: true }).value
      } catch {
        /* ignore */
      }
    }
    return md.utils.escapeHtml(str)
  },
})

// link target=_blank
const defaultRender =
  md.renderer.rules.link_open ||
  function (tokens: any, idx: any, options: any, _env: any, self: any) {
    return self.renderToken(tokens, idx, options)
  }
md.renderer.rules.link_open = (tokens: any, idx: any, options: any, env: any, self: any) => {
  tokens[idx].attrPush(['target', '_blank'])
  tokens[idx].attrPush(['rel', 'noopener noreferrer'])
  return defaultRender(tokens, idx, options, env, self)
}

export default function ThinkWrapper({ content }: Props) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(true)
  const themeMode = useSoftSettingsStore((s) => s.themeMode)
  const themeColors = useSoftSettingsStore((s) => s.themeColors)

  const thinkBg =
    themeMode === 'light' ? themeColors.thinkWrapperLight : themeColors.thinlWrapperDark

  const rendered = useMemo(() => md.render(content), [content])

  if (!content.replace(/\s/g, '')) return null

  return (
    <div
      className="think-wrapper"
      style={{
        backgroundColor: thinkBg,
        padding: 'var(--bt-pd-normal)',
        marginBottom: 'var(--bt-mg-normal)',
        overflow: 'hidden',
        transition: 'max-height 0.3s ease',
        maxHeight: isOpen ? '5000px' : '30px',
      }}
    >
      <div
        className="has-thought"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: isOpen ? 'var(--bt-mg-normal)' : 0,
          cursor: 'pointer',
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="flex items-center gap-5px">💭 {t('已深度思考')}</span>
        <span style={{ fontSize: 18 }}>{isOpen ? '▲' : '▼'}</span>
      </div>
      {isOpen && (
        <div
          className="think-content"
          style={{ lineHeight: '28px' }}
          dangerouslySetInnerHTML={{ __html: rendered }}
        />
      )}
    </div>
  )
}
