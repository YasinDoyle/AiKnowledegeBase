const WordExtractor = require('word-extractor')

/**
 * 开始解析(此函数为统一入口，其它同类模块也使用此函数名作为入口)
 * @param filename 文件名
 * @returns 解析后的文本
 */
export async function parse(filename: string, ragName: string): Promise<string> {
  try {
    const extractor = new WordExtractor()
    const extracted = await extractor.extract(filename)
    let result = extracted.getBody()
    return result
  } catch (error) {
    console.error('解析文档失败:', error)
    return ''
  }
}
