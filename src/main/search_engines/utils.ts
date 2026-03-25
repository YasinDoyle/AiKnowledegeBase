import * as cheerio from 'cheerio'
// 请求头常量
export const FETCH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate, br',
  DNT: '1',
  Connection: 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
}
// 定义搜索结果项的类型
export type SearchResult = {
  title: string | any
  link: string | any
  content: string | any
}

// 封装超时逻辑的函数
export const withTimeout = (promise: Promise<any>, timeout: number) => {
  const abortController = new AbortController()
  const timeoutId = setTimeout(() => abortController.abort(), timeout)

  return promise
    .finally(() => clearTimeout(timeoutId))
    .catch((error) => {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out')
      }
      throw error
    })
}

// 定义一个辅助函数来提取 HTML 正文内容，排除 JavaScript 脚本
const extractContentFromHtml = (html: string): string => {
  try {
    let htmlObj = cheerio.load(html)
    // 移除所有的 <script> 标签
    htmlObj('script').remove()
    // 移除所有的 <style> 标签，可选，若不需要样式相关内容
    htmlObj('style').remove()

    // 清除导航栏、页脚、广告等无关内容
    htmlObj('nav,footer,aside,header,script').remove()

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
      htmlObj!(selector).remove()
    })

    // 清理 class 中包含Header、Footer、Sidebar、Ads、Banner、Advertisement、Copyright 的元素
    htmlObj(
      '[class*="Header"], [class*="Footer"], [class*="Sidebar"], [class*="Ads"], [class*="Banner"], [class*="Advertisement"], [class*="Copyright"], [class*="topToolsWrap"], [class*="w_tq_box"], [class*="footerseo"],[class*="recommend"], [class*="footer"],[class*="mod-statement"],[class*="floor"],[class*="knowledge"],[id*="footer"],[class*="nav"]',
    ).remove()

    // 查找特定标签
    const targetElements = htmlObj(
      'article, [class="article"], [id="article"], [class="content_text"], [id="content_text"], [data-testid="article"],[class="detail-answer-item"]',
    )
    let text = ''
    if (targetElements.length > 0) {
      // 只处理目标元素的内容
      htmlObj = cheerio.load(targetElements.html() || '')
      text = htmlObj.text().trim()
    } else {
      text = htmlObj('body').text().trim()
    }

    // 过滤不相关的内容
    let result: string[] = []
    text.split('\n').filter((line) => {
      line = line.trim()
      if (line.length > 30) {
        result.push(line)
        return true
      }
      return false
    })
    return result.join('\n')
  } catch (e) {
    console.error('Error extracting content from HTML:', e, cheerio)
    return ''
  }
}

// 获取 URL 内容的函数
export const getUrlsContent = async (searchResult: SearchResult[]): Promise<SearchResult[]> => {
  console.log('Fetching URLs content...', searchResult)
  const fetchPromises = searchResult.map(async (result) => {
    if (!result.link) {
      return result
    }
    try {
      const response = await withTimeout(
        fetch(result.link, { signal: new AbortController().signal }),
        1000,
      )
      const html = await response.text()
      const content = extractContentFromHtml(html)
      if (content.length > result.content.length) {
        result.content = content
      }
      return result
    } catch (error) {
      console.error(`Failed to fetch content from ${result.link}:`, error)
      return result
    }
  })

  return Promise.all(fetchPromises)
}
