import { pub } from '../../../class/public'
import { createWorker, PSM } from 'tesseract.js'

// 定义常量，方便修改配置
const LANG = 'eng+chi_sim'
const WORKER_THREADS = 3
export const CONFIDENCE_THRESHOLD = 40

// 封装错误处理函数
const handleError = (error: any, message: string) => {
  console.log(`${message}:`, error)
  return ''
}

// 初始化 Tesseract worker
export const initializeWorker = async () => {
  const worker = await createWorker(LANG, WORKER_THREADS, {
    langPath: pub.get_resource_path() + '/traineddata',
  })
  await worker.reinitialize(LANG, WORKER_THREADS)
  await worker.setParameters({
    preserve_interword_spaces: '1',
    tessedit_pageseg_mode: PSM.AUTO,
    tessedit_ocr_engine_mode: '2',
  })
  return worker
}

// 对识别结果进行后处理
export const postProcessText = (text: string) => {
  return text
    .replace(/\s{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// 过滤低置信度行
export const filterLowConfidenceLines = (lines: any[], threshold: number) => {
  return lines
    .filter((line) => line.confidence > threshold)
    .map((line) => line.text)
    .join('\n')
}

/**
 * 将图片中的文字解析并转换为Markdown格式
 * @param filename 图片文件路径
 * @returns Markdown格式的字符串
 */
export async function parse(filename: string, ragName: string): Promise<string> {
  try {
    // 初始化 worker
    const worker = await initializeWorker()

    // 从图片中识别文本
    const { data } = await worker.recognize(filename)

    // 对识别结果进行后处理
    let cleanText = postProcessText(data.text)

    // 过滤低置信度行
    const lines = data.blocks || []
    const filteredText = filterLowConfidenceLines(lines, CONFIDENCE_THRESHOLD)

    // 如果过滤后的文本有内容，则使用它
    if (filteredText.trim().length > 0) {
      cleanText = filteredText
    }

    // 终止 worker
    await worker.terminate()

    return cleanText
  } catch (error) {
    return handleError(error, 'image error')
  }
}
