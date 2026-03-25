import { search } from '../search_engines/search'
import { pub } from '../class/public'

/**
 * rag controller 类，负责管理知识库的相关操作
 * @class
 */
class SearchController {
  async search(args: { query: string; searchProvider: string }) {
    let { query, searchProvider } = args
    if (!query) {
      return pub.return_error(pub.lang('请输入搜索内容'))
    }
    if (!searchProvider) {
      searchProvider = 'baidu'
    }

    const result = await search(query, searchProvider)
    return pub.return_success(pub.lang('搜索成功'), result)
  }
}

/**
 * 重写 SearchController 类的 toString 方法，方便调试和日志输出
 * @returns {string} - 类的字符串表示
 */
SearchController.toString = () => '[class SearchController]'

export default SearchController
