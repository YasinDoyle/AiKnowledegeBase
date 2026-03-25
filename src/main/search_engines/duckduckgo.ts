import * as cheerio from 'cheerio'
import { withTimeout, SearchResult, FETCH_HEADERS, getUrlsContent } from './utils'

// 构建请求 URL 的函数
const buildDuckDuckGoUrl = (query: string) => {
  return `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
}

// 处理链接的函数
const processLink = (link: string | undefined): string => {
  if (!link) {
    return ''
  }
  return decodeURIComponent(link.replace('//duckduckgo.com/l/?uddg=', '').replace(/&rut=.*/, ''))
}

// 本地 DuckDuckGo 搜索函数
export const localDuckDuckGoSearch = async (query: string): Promise<SearchResult[]> => {
  try {
    // 构建请求 URL
    const url = buildDuckDuckGoUrl(query)
    // 发起带有超时控制的 fetch 请求
    const response = await withTimeout(
      fetch(url, { signal: new AbortController().signal, headers: FETCH_HEADERS }),
      10000,
    )
    // 获取响应的文本内容
    const htmlString = await response.text()

    // 加载 HTML 内容到 cheerio 中
    const $ = cheerio.load(htmlString)

    // 提取搜索结果
    const searchResults: SearchResult[] = Array.from($('div.results_links_deep')).map((result) => {
      const title = $(result).find('a.result__a').text()
      const link = processLink($(result).find('a.result__snippet').attr('href'))
      const content = $(result).find('a.result__snippet').text()
      return { title, link, content }
    })

    return getUrlsContent(searchResults)
  } catch (error) {
    console.error('Search request failed:', error)
    // 返回空数组表示搜索失败
    return []
  }
}
