import { message } from '@/utils/message'
import i18n from '@/i18n'
import useHeaderStore from '@/stores/header'
import useChatContentStore from '@/stores/chatContent'
import useThirdPartyApiStore from '@/stores/thirdPartyApi'
import { sendChat } from '@/pages/ChatTools/controller'
import type { MultipeQuestionDto } from '@/types'

import logoImg from '@/assets/images/logo.png'

const t = i18n.t.bind(i18n)

// 模型 logo 映射表（按需导入，减少体积）
const logoMap: Record<string, () => Promise<{ default: string }>> = {
  deepseek: () => import('@/assets/images/deepseek.png'),
  qwen: () => import('@/assets/images/qwen.png'),
  llama: () => import('@/assets/images/llama.png'),
  gemma: () => import('@/assets/images/gemma.png'),
  phi4: () => import('@/assets/images/phi4.png'),
  mistral: () => import('@/assets/images/mistral.png'),
}

const logoCache: Record<string, string> = {}

/**
 * 根据模型名获取 logo（同步返回缓存，异步加载）
 */
export function answerLogo(model: string): string {
  if (!model) return logoImg
  for (const key of Object.keys(logoMap)) {
    if (model.includes(key)) {
      if (logoCache[key]) return logoCache[key]
      // 异步加载并缓存
      logoMap[key]().then((mod) => {
        logoCache[key] = mod.default
      })
      return logoImg // 首次返回默认
    }
  }
  return logoImg
}

/**
 * 复制回答内容
 */
export async function copyContent(text: string) {
  const cleaned = text.replace(/<div class="thought-placeholder">(.*?)<\/div>/gs, '')
  await navigator.clipboard.writeText(cleaned)
  message.success(t('复制成功'))
}

/**
 * 重新回答
 */
export function answerAgain(question: MultipeQuestionDto, id: string) {
  const header = useHeaderStore.getState()
  const thirdParty = useThirdPartyApiStore.getState()
  const chatContent = useChatContentStore.getState()

  if (chatContent.isInChat) {
    message.warning(t('当前正在回答，请稍后'))
    return
  }

  chatContent.setIsInChat(true)
  const chatKey: MultipeQuestionDto = {
    content: question.content.replace(/^\d+--/, ''),
    files: question.files,
    images: question.images,
  }

  const newHistory = new Map(chatContent.chatHistory)
  newHistory.set(chatKey, { content: '', stat: { model: header.currentModel }, search_result: [] })
  chatContent.setChatHistory(newHistory)

  if (header.multipleModelList.length) {
    const modelList = [
      ...header.multipleModelList,
      { model: header.currentModel, supplierName: thirdParty.currentSupplierName },
    ]
    sendChat(
      {
        user_content: chatKey.content,
        images: chatKey.images?.join(','),
        doc_files: chatKey.files?.join(','),
        regenerate_id: id,
      },
      modelList,
    )
  } else {
    sendChat({
      user_content: chatKey.content,
      images: chatKey.images?.join(','),
      doc_files: chatKey.files?.join(','),
      regenerate_id: id,
    })
  }
}

/**
 * 替换 LaTeX 分隔符为 $$ 以便 KaTeX 渲染
 */
export function replaceLatexMathDelimiters(text: string): string {
  text = text.replace(/\\\[/g, '$$').replace(/\\\]/g, '$$')
  text = text.replace(/\\\(/g, '$').replace(/\\\)/g, '$')
  return text
}

/**
 * 跳转外部链接
 */
export function jumpThroughLink(link: string) {
  window.open(link)
}
