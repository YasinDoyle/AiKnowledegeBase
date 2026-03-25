import * as fs from 'fs'
import * as path from 'path'
import * as cheerio from 'cheerio'
import { pub } from '../../../class/public'

/**
 * HTML解析器类
 */
export class HtmlParser {
  private filename: string
  private ragName: string
  private baseDocName: string
  private $: cheerio.CheerioAPI | any = null

  /**
   * 构造函数
   * @param filename HTML文件路径
   */
  constructor(filename: string, ragName: string) {
    this.filename = filename
    this.ragName = ragName
    this.baseDocName = path.basename(filename, path.extname(filename))
  }

  /**
   * 初始化Cheerio对象
   * @returns 是否成功初始化
   */
  private async initCheerio(): Promise<boolean> {
    try {
      // 判断是否为URL地址
      let html = ''
      if (this.filename.startsWith('http://') || this.filename.startsWith('https://')) {
        let httpRes = await pub.httpRequest(this.filename)
        if (httpRes.statusCode != 200) {
          return false
        }
        html = httpRes.body
      } else {
        html = fs.readFileSync(this.filename, 'utf8')
      }

      if (!html) {
        return false
      }

      this.$ = cheerio.load(html)
      return true
    } catch (error) {
      console.error('初始化Cheerio对象失败:', error)
      return false
    }
  }

  /**
   * 清理干扰元素
   */
  private cleanInterferenceElements() {
    if (!this.$) return

    // 常见的干扰元素
    const interferenceSelectors = [
      'nav',
      'footer',
      'script',
      'style',
      'aside',
      'header',
      '.advertisement',
      '.sidebar',
      '.ads',
      '.banner',
      '.copyright',
      'page-footer-content',
      'xcp-list',
    ]

    interferenceSelectors.forEach((selector) => {
      this.$!(selector).remove()
    })

    // 清理 class 中包含Header、Footer、Sidebar、Ads、Banner、Advertisement、Copyright 的元素
    this.$(
      '[class*="Header"], [class*="Footer"], [class*="Sidebar"], [class*="Ads"], [class*="Banner"], [class*="Advertisement"], [class*="Copyright"], [class*="topToolsWrap"]',
    ).remove()
  }

  /**
   * 将HTML转换为Markdown
   * @returns Markdown文本
   */
  private convertToMarkdown(): string {
    if (!this.$) return ''

    let markdown = ''

    // 提取标题
    const title = this.$('title').text().replace('icon_voice_onicon_voice', '').trim()

    if (title) {
      markdown += `# ${title}\n\n`
    }

    // 查找特定标签
    const targetElements = this.$(
      'article, [class="article"], [id="article"], [class="content_text"], [id="content_text"], [data-testid="article"]',
    )

    if (targetElements.length > 0) {
      // 只处理目标元素的内容
      this.$ = cheerio.load(targetElements.html() || '')
      this.cleanInterferenceElements()
    } else {
      // 没有目标元素，处理整个文档
      this.cleanInterferenceElements()
    }

    // 处理段落
    this.$('p').each((_, element) => {
      const text = this.$(element).text().trim()
      if (text) {
        markdown += `${text}\n\n`
      }
    })

    // 处理直接包含文本的div
    this.$('div').each((_, element) => {
      const $el = this.$(element)
      const hasBlockElements =
        $el.find('p, h1, h2, h3, h4, h5, h6, ul, ol, table, blockquote').length > 0
      if (!hasBlockElements) {
        const text = $el.text().trim()
        if (text) {
          markdown += `${text}\n\n`
        }
      }
    })

    // 处理标题
    for (let i = 1; i <= 6; i++) {
      this.$(`h${i}`).each((_, element) => {
        const text = this.$(element).text().trim()
        if (text) {
          markdown += `${'#'.repeat(i)} ${text}\n\n`
        }
      })
    }

    // 处理列表
    this.$('ul, ol').each((_, listElement) => {
      const isList = this.$(listElement).is('ul')
      this.$('li', listElement).each((index, item) => {
        const text = this.$(item).text().trim()
        if (text) {
          markdown += isList ? `* ${text}\n` : `${index + 1}. ${text}\n`
        }
      })
      markdown += '\n'
    })

    // 处理表格
    this.$('table').each((_, table) => {
      let tableMarkdown = ''
      this.$('thead tr', table).each((_, row) => {
        const headers = this.$('th', row)
          .map((_, cell) => this.$(cell).text().trim())
          .get()
        tableMarkdown += `| ${headers.join(' | ')} |\n`
        tableMarkdown += `| ${headers.map(() => '---').join(' | ')} |\n`
      })
      this.$('tbody tr', table).each((_, row) => {
        const cells = this.$('td', row)
          .map((_, cell) => this.$(cell).text().trim())
          .get()
        tableMarkdown += `| ${cells.join(' | ')} |\n`
      })
      markdown += tableMarkdown + '\n'
    })

    // 处理代码块
    this.$('pre, code').each((_, element) => {
      const code = this.$(element).text().trim()
      if (code) {
        markdown += '```\n' + code + '\n```\n\n'
      }
    })

    return markdown.trim()
  }

  /**
   * 解析HTML文件并转换为Markdown
   * @returns Markdown文本
   */
  public async parse(): Promise<string> {
    if (!(await this.initCheerio())) {
      return ''
    }

    return this.convertToMarkdown()
  }

  /**
   * 清理资源
   */
  public dispose(): void {
    this.$ = null
  }
}

/**
 * 开始解析(此函数为统一入口，其它同类模块也使用此函数名作为入口)
 * @param filename HTML文件路径
 * @returns Markdown格式的字符串
 */
export async function parse(filename: string, ragName: string): Promise<string> {
  try {
    const parser = new HtmlParser(filename, ragName)
    const markdown = await parser.parse()
    parser.dispose() // 释放资源
    return markdown
  } catch (error) {
    console.error('解析HTML失败:', error)
    return ''
  }
}
