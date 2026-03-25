import { parse as httpParse } from './html_parse'

export async function parse(url: string, ragName: string): Promise<string> {
  try {
    return await httpParse(url, ragName)
  } catch (error) {
    console.error('请求失败:', error)
    return ''
  }
}
