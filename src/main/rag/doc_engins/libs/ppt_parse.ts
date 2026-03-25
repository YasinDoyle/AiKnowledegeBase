import * as fs from 'fs/promises'
import * as path from 'path'

/**
 * PPT解析器类
 */
export class PptxParser {
  // 读取PPT文件，按格式提取文本和图片，返回Markdown格式的字符串
  async ppt2md(filename: string): Promise<string> {
    try {
      // 动态导入pptxjs库
      const { default: JSZip } = await import('jszip')

      // 读取文件内容
      const fileData = await fs.readFile(filename)
      const zip = await JSZip.loadAsync(fileData)

      // 获取幻灯片数量和关系信息
      const presentationXml = await this.getPresentationXml(zip)
      const slideIds = this.extractSlideIds(presentationXml)

      // 存储内容数组
      const documentContent: any[] = []

      // 处理每个幻灯片
      for (let i = 0; i < slideIds.length; i++) {
        const slideIndex = i + 1
        await this.processSlide(zip, slideIndex, documentContent)
      }

      // 生成 Markdown 格式的文本
      const markdownText = this.formatToMarkdown(documentContent)

      return markdownText
    } catch (error) {
      console.error('PPT解析错误:', error)
      return ''
    }
  }

  // 获取presentation.xml文件内容
  private async getPresentationXml(zip: any): Promise<string> {
    const presentationXml = await zip.file('ppt/presentation.xml')?.async('text')
    if (!presentationXml) {
      throw new Error('Invalid PPT file: missing presentation.xml')
    }
    return presentationXml
  }

  // 从presentation.xml中提取幻灯片ID
  private extractSlideIds(presentationXml: string): string[] {
    const slideCountMatch = presentationXml.match(/<p:sldIdLst>([^]*?)<\/p:sldIdLst>/)
    return slideCountMatch ? slideCountMatch[1].match(/id="(\d+)"/g) || [] : []
  }

  // 处理单个幻灯片
  private async processSlide(zip: any, slideIndex: number, documentContent: any[]): Promise<void> {
    try {
      const slideXml = await zip.file(`ppt/slides/slide${slideIndex}.xml`)?.async('text')
      if (!slideXml) return

      // 提取文本内容
      const paragraphs = this.extractParagraphsFromSlide(slideXml)

      // 添加幻灯片文本到内容数组
      if (paragraphs.length > 0) {
        documentContent.push({
          type: 'text',
          content: paragraphs.join('\n'),
          slide: slideIndex,
        })
      }
    } catch (err: any) {
      console.warn(`Error processing slide ${slideIndex}:`, err.message)
    }
  }

  // 从幻灯片XML中提取段落文本
  extractParagraphsFromSlide(slideXml: string): string[] {
    const paragraphs: string[] = []
    const paragraphElements = slideXml.match(/<a:p>.*?<\/a:p>/g) || []

    for (const paragraph of paragraphElements) {
      const textElementsInParagraph = paragraph.match(/<a:t>(.+?)<\/a:t>/g) || []
      if (textElementsInParagraph.length > 0) {
        const paragraphText = textElementsInParagraph
          .map((t) => t.replace(/<a:t>|<\/a:t>/g, ''))
          .join(' ')

        if (paragraphText.trim()) {
          paragraphs.push(paragraphText)
        }
      }
    }

    return paragraphs
  }

  // 格式化内容为 Markdown 文本
  formatToMarkdown(documentContent: any[]): string {
    return documentContent
      .map((item) => {
        if (item.type === 'text') {
          return `## Slide ${item.slide}\n${item.content}`
        }
        return ''
      })
      .join('\n\n')
  }
}

/**
 * 将PPT文件解析并转换为md格式
 * @param filename PPT文件路径
 * @returns Markdown格式的字符串
 */
export async function parse(filename: string): Promise<string> {
  try {
    // 检查文件扩展名
    const ext = path.extname(filename).toLowerCase()

    if (ext === '.pptx') {
      const parser = new PptxParser()
      return await parser.ppt2md(filename)
    } else if (ext === '.ppt') {
      return `# 不支持的文件格式\n\n很抱歉，目前仅支持.pptx格式的PowerPoint文件解析。`
    } else {
      return `# 不支持的文件格式\n\n文件 ${path.basename(filename)} 不是有效的PowerPoint文件。`
    }
  } catch (error: any) {
    console.error('解析PPT文件失败:', error)
    return `# PPT解析失败\n\n无法解析PowerPoint文件。错误: ${error.message || '未知错误'}`
  }
}
