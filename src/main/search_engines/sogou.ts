import * as cheerio from 'cheerio'
import { withTimeout, SearchResult, getUrlsContent, FETCH_HEADERS } from './utils'

// 获取正确目标 URL 的函数
const getCorrectTargeUrl = async (url: string): Promise<string> => {
  if (!url) return ''
  try {
    const res = await fetch(url, { headers: FETCH_HEADERS })
    const $ = cheerio.load(await res.text())
    const link = $('script').text()
    const matches = link.match(/"(.*?)"/)
    return matches?.[1] || ''
  } catch (error) {
    console.error('Error getting correct target URL:', error)
    return ''
  }
}

// 处理搜索结果节点的函数
const processSearchResultNode = async ($el: any): Promise<SearchResult> => {
  const title = $el.find('.vr-title').text().replace(/\n/g, '').trim()
  let link = $el.find('.vr-title > a').attr('href')

  ;['.text-lightgray', '.zan-box', '.tag-website'].forEach((cls) => {
    $el.find(cls).remove()
  })

  const content = ['.star-wiki', '.fz-mid', '.attribute-centent']
    .map((selector) => $el.find(selector).text().trim())
    .join(' ')

  if (link && link.startsWith('/')) {
    link = await getCorrectTargeUrl(`https://www.sogou.com${link}`)
  }

  return { title, link: link || '', content }
}

// 本地搜狗搜索函数
export const localSogouSearch = async (query: string): Promise<SearchResult[]> => {
  try {
    const url = `https://www.sogou.com/web?query=${encodeURIComponent(query)}`
    const response = await withTimeout(
      fetch(url, {
        signal: new AbortController().signal,
      }),
      10000,
    )
    const htmlString = await response.text()

    const $ = cheerio.load(htmlString)
    const $result = $('#main .results')

    const nodes = $result.children().toArray()
    const searchResultsPromises = nodes.map((node) => processSearchResultNode($(node)))
    const searchResults = await Promise.all(searchResultsPromises)

    let searchResultList = searchResults.filter(
      (result) => result.link && result.title && result.content,
    )
    return getUrlsContent(searchResultList)
  } catch (error) {
    console.error('Search request failed:', error)
    return []
  }
}
