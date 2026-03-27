import { useMemo, useRef, useEffect, useCallback } from 'react'
import { Collapse, Divider, Tooltip, Button, List } from 'antd'
import { useTranslation } from 'react-i18next'
import markdownit from 'markdown-it'
import hljs from 'highlight.js'
import mk from '@vscode/markdown-it-katex'
import ThinkWrapper from './ThinkWrapper'
import McpToolsWrapper from './McpToolsWrapper'
import { replaceLatexMathDelimiters, jumpThroughLink } from './controller'
import useSoftSettingsStore from '@/stores/softSettings'
import useChatToolsStore from '@/stores/chatTools'
import { message } from '@/utils/message'
import { eventBus } from '@/utils/tools'
import 'katex/dist/katex.min.css'

interface Props {
  content: string
  searchResult?: Array<{ content: string; link: string; title: string }>
  toolsResult?: string[]
}

// markdown-it 实例 — 模块级单例
function createMd(t: (key: string) => string) {
  const md = markdownit({
    html: true,
    linkify: true,
    typographer: true,
    langPrefix: 'language-',
    highlight(str, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(str, { language: lang, ignoreIllegals: true }).value
        } catch {
          /* ignore */
        }
      }
      return str
    },
  })

  md.use(mk, { throwOnError: false })

  // fence 渲染 — mermaid 特殊处理
  md.renderer.rules.fence = (tokens, idx, options) => {
    const token = tokens[idx]
    const lang = token.info || ''
    const code = token.content
    const highlighted = options.highlight!(code, lang, '')

    if (lang === 'mermaid') {
      return `<div class="mermaid-wrapper" data-code="${encodeURIComponent(code)}">${highlighted}</div>`
    }

    const toolbar = `<div class="tool-header" data-lang="${lang}"><div class="tool-header-tit">${lang}</div><div class="tool-placeholder"><div class="tool-wrapper"><span class="tool-copy" data-code="${encodeURIComponent(code)}">${t('复制')}</span><span class="tool-reference" data-code="${encodeURIComponent(code)}">${t('引用')}</span></div></div></div>`
    return `<pre class="hljs"><div class="hljs-wrapper">${toolbar}<code${lang ? ` class="${lang} code-block"` : ''}>${highlighted}</code></div></pre>`
  }

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

  return md
}

export default function MarkdownRender({ content, searchResult, toolsResult }: Props) {
  const { t } = useTranslation()
  const markdownRef = useRef<HTMLDivElement>(null)
  const themeMode = useSoftSettingsStore((s) => s.themeMode)
  const themeColors = useSoftSettingsStore((s) => s.themeColors)

  // 提取 think 内容
  const thinkMatch = content.match(/<think>([\s\S]*?)(?:<\/think>|$)/)
  const thinkContent = thinkMatch ? thinkMatch[1] : ''

  // 提取 mcp tool 内容
  const toolsContentArr = useMemo(() => {
    const matches = content.match(/<mcptool>([\s\S]*?)<\/mcptool>/g)
    return matches ? matches.map((m) => m.replace(/<mcptool>|<\/mcptool>/g, '').trim()) : []
  }, [content])

  // 渲染 markdown
  const answerHtml = useMemo(() => {
    const md = createMd(t)
    const cleaned = content
      .replace(/<think>([\s\S]*?)(?:<\/think>|$)/, '')
      .replace(/<mcptool>([\s\S]*?)(?:<\/mcptool>|$)/g, '')
    return replaceLatexMathDelimiters(md.render(cleaned))
  }, [content, t])

  // 主题色
  const codeBg =
    themeMode === 'light' ? themeColors.markdownCodeLight : themeColors.markdownCOdeDark
  const fontColor =
    themeMode === 'light'
      ? themeColors.markdownToolsFontColorLight
      : themeColors.markdownToolsFontColorDark

  // 绑定工具栏事件 + 渲染 mermaid
  const bindEvents = useCallback(() => {
    const el = markdownRef.current
    if (!el) return

    // 复制按钮
    el.querySelectorAll<HTMLSpanElement>('.tool-copy').forEach((btn) => {
      btn.onclick = () => {
        navigator.clipboard.writeText(decodeURIComponent(btn.dataset.code || ''))
        message.success(t('复制成功'))
      }
    })

    // 引用按钮
    el.querySelectorAll<HTMLSpanElement>('.tool-reference').forEach((btn) => {
      btn.onclick = () => {
        useChatToolsStore.getState().setQuestionContent(decodeURIComponent(btn.dataset.code || ''))
      }
    })
  }, [t])

  useEffect(() => {
    bindEvents()
    eventBus.$emit('doScroll')
  }, [answerHtml, bindEvents])

  // mermaid 渲染
  useEffect(() => {
    eventBus.$on('answerRendered', () => renderMermaidBlocks())
    return () => eventBus.$del('answerRendered')
  }, [])

  useEffect(() => {
    renderMermaidBlocks()
  }, [answerHtml])

  function renderMermaidBlocks() {
    const el = markdownRef.current
    if (!el) return
    el.querySelectorAll<HTMLDivElement>('.mermaid-wrapper').forEach((wrapper, i) => {
      if (wrapper.dataset.rendered) return
      wrapper.dataset.rendered = 'true'
      const code = decodeURIComponent(wrapper.dataset.code || '')
      const container = document.createElement('div')
      wrapper.innerHTML = ''
      wrapper.appendChild(container)
      // 使用 React 渲染 MermaidRender 组件 — 简化为直接 DOM 插入
      import('mermaid').then(({ default: mermaid }) => {
        mermaid.initialize({ startOnLoad: false, theme: 'default' })
        mermaid
          .render(`mermaid-svg-${i}-${Date.now()}`, code)
          .then((res) => {
            container.innerHTML = res.svg
          })
          .catch(() => {
            container.textContent = t('mermaid解析失败,请检查语法')
          })
      })
    })
  }

  return (
    <>
      {/* 联网搜索结果 */}
      {searchResult && searchResult.length > 0 && (
        <>
          <Collapse
            size="small"
            items={[
              {
                key: 'search',
                label: t('共参考{0}份资料', { 0: searchResult.length }),
                children: (
                  <List
                    size="small"
                    dataSource={searchResult}
                    renderItem={(item, index) => (
                      <List.Item>
                        <Tooltip title={item.link}>
                          <span>
                            [{index + 1}]{' '}
                            <Button
                              type="link"
                              size="small"
                              onClick={() => jumpThroughLink(item.link)}
                            >
                              {item.title || item.link}
                            </Button>
                          </span>
                        </Tooltip>
                      </List.Item>
                    )}
                  />
                ),
              },
            ]}
          />
          <Divider style={{ margin: '10px 0' }} />
        </>
      )}

      {/* 思考过程 */}
      {thinkContent && <ThinkWrapper content={thinkContent} />}

      {/* MCP 工具结果（流式） */}
      {toolsContentArr.map((item, index) => (
        <McpToolsWrapper key={index} content={item} />
      ))}

      {/* MCP 工具结果（最终） */}
      {toolsResult?.map((item, index) => (
        <McpToolsWrapper key={`final-${index}`} content={item} />
      ))}

      {/* Markdown 正文 */}
      <div
        ref={markdownRef}
        className="markdown-content"
        style={{ '--md-code-bg': codeBg, '--md-font-color': fontColor } as React.CSSProperties}
        dangerouslySetInnerHTML={{ __html: answerHtml }}
      />
    </>
  )
}
