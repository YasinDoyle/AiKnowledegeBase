/*
 * @description 本地存储工具类，封装了对 localStorage 的访问。
 */

export default {
  // 语言选择本地存储
  get language() {
    return localStorage.getItem('language') as string
  },
  set language(lang: string) {
    localStorage.setItem('language', lang)
  },

  // 暗黑模式本地存储
  get themeMode() {
    return localStorage.getItem('themeMode') as string
  },

  set themeMode(mode: string) {
    localStorage.setItem('themeMode', mode)
  },

  // 欢迎窗口关闭
  get welcomeEnd() {
    return localStorage.getItem('welcomeEnd') as string
  },

  set welcomeEnd(end: string) {
    localStorage.setItem('welcomeEnd', end as string)
  },

  // 新手指引
  get welcomeGuide(): boolean {
    if (localStorage.getItem('welcomeGuide') == null) {
      return true
    } else {
      return localStorage.getItem('welcomeGuide') == 'true' ? true : false
    }
  },

  set welcomeGuide(guide: string) {
    localStorage.setItem('welcomeGuide', guide as string)
  },

  // 搜索引擎
  get searchEngine() {
    return localStorage.getItem('searchEngine') as string
  },

  set searchEngine(engine: string) {
    localStorage.setItem('searchEngine', engine)
  },
}
