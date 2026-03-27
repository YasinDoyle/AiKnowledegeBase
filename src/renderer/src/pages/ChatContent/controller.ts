import useChatContentStore from '@/stores/chatContent'
import { eventBus } from '@/utils/tools'

/**
 * 平滑滚动到底部
 */
export function scrollMove() {
  let timer: ReturnType<typeof setTimeout> | null = null
  return (delay = 100) => {
    if (!timer) {
      timer = setTimeout(() => {
        const state = useChatContentStore.getState()
        if (state.userScrollSelf) {
          timer = null
          return
        }
        const scrollEl = document.querySelector('#chat-scroll-area')
        if (scrollEl) {
          scrollEl.scrollTop = scrollEl.scrollHeight
        }
        timer = null
      }, delay)
    }
  }
}

/**
 * 滚动回调 — 判断用户是否手动向上滚动
 */
export function handleScrollCallback(e: React.UIEvent<HTMLDivElement>) {
  const target = e.currentTarget
  const state = useChatContentStore.getState()
  if (state.scrollTop < target.scrollTop) {
    state.setUserScrollSelf(false)
  } else {
    state.setUserScrollSelf(true)
  }
  state.setScrollTop(target.scrollTop)
}

/**
 * 鼠标离开回调 — 在对话中时自动恢复滚动
 */
export function handleMouseLeave() {
  const state = useChatContentStore.getState()
  state.setUserScrollSelf(false)
  if (state.isInChat) {
    eventBus.$emit('doScroll')
  }
}
