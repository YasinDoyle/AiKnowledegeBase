import * as fs from 'fs'
import * as path from 'path'
import { get_image_save_path, IMAGE_URL_LAST } from '../utils'

/**
 * 基础文档解析器接口
 */
export interface BaseParserResult {
  success: boolean
  content: string
  error?: string
}

/**
 * 基础文档解析器类
 */
export abstract class BaseDocumentParser {
  protected filename: string
  protected baseDocName: string
  protected content: string = ''
  protected imageIndex: number = 0

  /**
   * 构造函数
   * @param filename 文件路径
   */
  constructor(filename: string) {
    this.filename = filename
    this.baseDocName = path.basename(filename)
  }

  /**
   * 验证文件是否存在且可访问
   * @returns 是否可访问
   */
  protected validateFile(): boolean {
    try {
      fs.accessSync(this.filename, fs.constants.R_OK)
      return true
    } catch (error) {
      console.error(`文件访问失败: ${this.filename}`, error)
      return false
    }
  }

  /**
   * 确保图片保存目录存在
   * @param subDir 子目录名
   * @returns 完整的输出目录路径
   */
  protected ensureImageDirectory(subDir: string): string {
    const outputDir = path.join(get_image_save_path(), subDir)
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }
    return outputDir
  }

  /**
   * 生成唯一的图片名称
   * @param prefix 前缀
   * @param ext 扩展名
   * @returns 唯一的图片名称
   */
  protected generateUniqueImageName(prefix: string, ext: string = '.png'): string {
    const timestamp = Date.now()
    return `${prefix}_${timestamp}_${this.imageIndex++}${ext}`
  }

  /**
   * 保存图片并返回URL
   * @param imageData 图片数据
   * @param subDir 子目录名
   * @param prefix 文件名前缀
   * @param ext 文件扩展名
   * @returns 图片URL
   */
  protected saveImage(
    imageData: Buffer | Uint8Array,
    subDir: string,
    prefix: string,
    ext: string = '.png',
  ): string {
    const outputDir = this.ensureImageDirectory(subDir)
    const imageName = this.generateUniqueImageName(prefix, ext)
    const imagePath = path.join(outputDir, imageName)

    fs.writeFileSync(imagePath, Buffer.from(imageData))
    return `${IMAGE_URL_LAST}/${subDir}/${imageName}`
  }

  /**
   * 清理资源
   */
  protected dispose(): void {
    this.content = ''
    this.imageIndex = 0
  }

  /**
   * 解析文档
   * @returns 解析结果
   */
  public abstract parse(): Promise<BaseParserResult>

  /**
   * 转义Markdown特殊字符
   * @param text 需要转义的文本
   * @returns 转义后的文本
   */
  protected escapeMarkdown(text: string): string {
    return text
      .replace(/[\\`*_{}\[\]()#+\-.!]/g, '\\$&')
      .replace(/\|/g, '\\|')
      .replace(/\n/g, '<br>')
  }

  /**
   * 格式化错误信息
   * @param error 错误对象
   * @returns 格式化的错误信息
   */
  protected formatError(error: any): string {
    return `# 解析失败\n\n无法解析文件 ${this.baseDocName}。错误: ${error?.message || '未知错误'}`
  }
}
