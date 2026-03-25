import * as cheerio from 'cheerio'
import { withTimeout, SearchResult, getUrlsContent, FETCH_HEADERS } from './utils'

// 本地搜狗搜索函数
export const local360Search = async (query: string): Promise<SearchResult[]> => {
  try {
    const url = `https://www.so.com/s?q=${encodeURIComponent(query)}`
    const response = await withTimeout(
      fetch(url, {
        signal: new AbortController().signal,
        headers: FETCH_HEADERS,
      }),
      10000,
    )
    const htmlString = await response.text()

    const $ = cheerio.load(htmlString)
    const items = $('.res-list')
    const searchResults: any[] = []
    items.each(function (index, item) {
      var link = $(item).find('a').attr('data-mdurl')
      var title = $(item).find('a').text()
      var content = $(item).find('.res-desc').text()
      searchResults.push({ title, link, content })
    })
    let searchResultList = searchResults.filter(
      (result) => result.link && result.title && result.content,
    )
    return getUrlsContent(searchResultList)
  } catch (error) {
    console.error('Search request failed:', error)
    return []
  }
}
