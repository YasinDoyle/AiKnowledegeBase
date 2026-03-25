import { withTimeout, SearchResult, getUrlsContent, FETCH_HEADERS } from './utils'

// 本地百度搜索函数
export const localBaiduSearch = async (query: string): Promise<SearchResult[]> => {
  const TOTAL_SEARCH_RESULTS = 10
  // 构建请求 URL
  const url = `http://www.baidu.com/s?wd=${encodeURIComponent(query)}&tn=json&rn=${TOTAL_SEARCH_RESULTS}`

  try {
    // 发起带有超时控制的 fetch 请求
    const response = await withTimeout(
      fetch(url, { signal: new AbortController().signal, headers: FETCH_HEADERS }),
      10000,
    )
    // 解析响应为 JSON
    const jsonRes = await response.json()

    // 提取搜索结果数据
    const data = jsonRes?.feed?.entry || []

    // 处理搜索结果数据
    const searchResults: SearchResult[] = data.map((result: any) => {
      const title = result?.title || ''
      let link = result?.url
      const content = result?.abs || ''
      return { title, link, content }
    })

    // 过滤掉没有链接和内容的结果
    let resultList = []
    for (const result of searchResults) {
      if (result.link && result.title) {
        resultList.push(result)
      }
    }
    resultList = await getUrlsContent(resultList)
    return resultList
  } catch (error) {
    console.error('Search request failed:', error)
    // 返回空数组表示搜索失败
    return []
  }
}
