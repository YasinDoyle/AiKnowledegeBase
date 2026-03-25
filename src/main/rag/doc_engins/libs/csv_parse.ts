import * as fs from 'fs'
import * as path from 'path'

// 类型定义
interface CsvRecord {
  [key: string]: string | number | boolean | null
}

interface CsvStatistics {
  rowCount: number
  columnCount: number
  headers: string[]
  emptyRows: number
  uniqueValues: Map<string, Set<any>>
}

/**
 * CSV解析器类
 */
export class CsvParser {
  private filename: string
  private ragName: string
  private baseDocName: string
  private content: string = ''
  private records: CsvRecord[] = []
  private headers: string[] = []
  private statistics: CsvStatistics | null = null

  /**
   * 构造函数
   * @param filename CSV文件路径
   */
  constructor(filename: string, ragName: string) {
    this.filename = filename
    this.ragName = ragName
    this.baseDocName = path.basename(filename)
  }

  /**
   * 读取CSV文件内容
   * @returns 是否读取成功
   */
  private readFile(): boolean {
    try {
      // 尝试多种编码读取CSV文件
      let content
      const encodings = ['utf8', 'gbk', 'gb2312', 'latin1']

      // 先尝试检测BOM标记确定编码
      const buffer = fs.readFileSync(this.filename)
      if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
        // 检测到UTF-8 BOM
        content = buffer.toString('utf8').slice(1) // 跳过BOM
      } else {
        // 尝试不同编码
        for (const encoding of encodings) {
          try {
            content = buffer.toString(encoding as BufferEncoding)
            // 简单检测是否有乱码（如果包含常见的替换字符）
            if (!content.includes('�') && !content.includes('锟�') && !content.includes('鈩�')) {
              break
            }
          } catch (e) {
            console.warn(`尝试使用 ${encoding} 编码失败`)
          }
        }
      }

      if (!content) {
        throw new Error('无法检测到正确的文件编码')
      }

      this.content = content
      return true
    } catch (error) {
      console.error('读取CSV文件失败:', error)
      return false
    }
  }

  /**
   * 解析CSV内容
   */
  private parseContent(): void {
    try {
      // 检查内容是否为空
      if (!this.content || this.content.trim() === '') {
        console.warn('CSV内容为空')
        this.records = []
        this.headers = []
        return
      }

      // 解析CSV，处理引号内的换行和逗号
      const parseCSV = (text: string) => {
        const result: any[] = []
        let row: any[] = []
        let inQuotes = false
        let currentValue = ''

        for (let i = 0; i < text.length; i++) {
          const char = text[i]
          const nextChar = text[i + 1]

          // 处理引号
          if (char === '"') {
            if (!inQuotes) {
              // 开始引号
              inQuotes = true
            } else if (nextChar === '"') {
              // 转义的引号
              currentValue += '"'
              i++ // 跳过下一个引号
            } else {
              // 结束引号
              inQuotes = false
            }
          }
          // 处理分隔符
          else if (char === ',' && !inQuotes) {
            row.push(currentValue)
            currentValue = ''
          }
          // 处理换行符
          else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !inQuotes) {
            row.push(currentValue)
            result.push(row)
            row = []
            currentValue = ''
            if (char === '\r') i++ // 跳过\n
          }
          // 其他字符
          else {
            // 跳过\r不在\r\n组合中的情况
            if (char !== '\r') {
              currentValue += char
            }
          }
        }

        // 处理最后一个值和行
        if (currentValue !== '' || row.length > 0) {
          row.push(currentValue)
          result.push(row)
        }

        return result
      }

      const parsedData = parseCSV(this.content)

      // 如果文件为空或只有一行，返回空数组
      if (parsedData.length <= 1) {
        this.records = []
        this.headers = []
        return
      }

      // 获取表头并清理可能的BOM标记
      this.headers = parsedData[0].map((header) => {
        // 清除BOM标记和特殊字符
        return header.replace(/^\uFEFF/, '').trim()
      })

      // 初始化结果数组
      this.records = []

      // 处理每一行数据
      for (let i = 1; i < parsedData.length; i++) {
        const values = parsedData[i]

        // 跳过空行
        if (values.length === 0 || (values.length === 1 && !values[0])) continue

        // 创建行对象
        const row: CsvRecord = {}
        for (let j = 0; j < this.headers.length; j++) {
          // 确保字段名不为空，如果为空使用列索引
          const headerName = this.headers[j] ? this.headers[j] : `Column${j + 1}`
          // 确保空值被设置为空字符串，而不是undefined
          row[headerName] = j < values.length ? values[j] : ''
        }

        // 添加到结果
        this.records.push(row)
      }

      // console.log(`成功解析CSV: ${this.records.length}行`);
      // console.log(`识别到${this.headers.length}列: ${this.headers.join(', ')}`);
    } catch (error) {
      console.error('解析CSV内容失败:', error)
      this.records = []
      this.headers = []
    }
  }

  /**
   * 计算CSV统计信息
   */
  private calculateStatistics(): void {
    const uniqueValues = new Map<string, Set<any>>()
    let emptyRows = 0

    // 初始化每个列的唯一值集合
    this.headers.forEach((header) => {
      uniqueValues.set(header, new Set())
    })

    // 遍历所有记录
    for (const record of this.records) {
      let isEmpty = true

      // 检查每个单元格
      for (const header of this.headers) {
        const value = record[header]

        // 如果有值，则该行不为空
        if (value !== undefined && value !== null && value !== '') {
          isEmpty = false
          uniqueValues.get(header)?.add(value)
        }
      }

      if (isEmpty) {
        emptyRows++
      }
    }

    this.statistics = {
      rowCount: this.records.length,
      columnCount: this.headers.length,
      headers: this.headers,
      emptyRows,
      uniqueValues,
    }
  }

  /**
   * 转义单元格内容以适应Markdown表格格式
   * @param value 单元格值
   * @returns 转义后的字符串
   */
  private escapeCellValue(value: any): string {
    if (value === undefined || value === null) {
      return ''
    }

    return String(value).replace(/\|/g, '\\|').replace(/\n/g, '<br>') // 使用HTML换行符保留换行信息
  }

  /**
   * 生成Markdown表格表示
   * @returns Markdown表格字符串
   */
  private generateTable(): string {
    if (!this.headers.length) {
      return '*CSV文件不包含有效数据*'
    }

    // 生成表头
    let table = '| ' + this.headers.map((h) => this.escapeCellValue(h)).join(' | ') + ' |\n'
    table += '| ' + this.headers.map(() => '---').join(' | ') + ' |\n'

    // 生成表格内容
    for (const record of this.records) {
      const row = this.headers.map((header) => this.escapeCellValue(record[header]))
      table += '| ' + row.join(' | ') + ' |\n'
    }

    return table
  }

  /**
   * 生成数据摘要
   * @returns Markdown格式的摘要信息
   */
  private generateSummary(): string {
    if (!this.statistics) {
      return ''
    }

    let summary = `## 文件摘要\n\n`
    summary += `- **文件名**: ${this.baseDocName}\n`
    summary += `- **总行数**: ${this.statistics.rowCount}\n`
    summary += `- **总列数**: ${this.statistics.columnCount}\n`
    summary += `- **空行数**: ${this.statistics.emptyRows}\n`

    // 添加列信息
    if (this.statistics.columnCount > 0) {
      summary += `\n### 列信息\n\n`

      summary += '| 列名 | 唯一值数量 | 样例值 |\n'
      summary += '| --- | --- | --- |\n'

      this.headers.forEach((header) => {
        const uniqueSet = this.statistics!.uniqueValues.get(header)
        const uniqueCount = uniqueSet ? uniqueSet.size : 0

        // 获取最多3个样例值
        let sampleValues = ''
        if (uniqueSet && uniqueSet.size > 0) {
          const samples = Array.from(uniqueSet).slice(0, 3)
          sampleValues = samples.map((v) => this.escapeCellValue(v).substr(0, 30)).join(', ')
        }

        summary += `| ${this.escapeCellValue(header)} | ${uniqueCount} | ${sampleValues} |\n`
      })
    }

    return summary
  }

  /**
   * 将CSV数据转换为Markdown格式
   * @returns Markdown表示
   */
  private generateMarkdown(): string {
    if (this.records.length === 0) {
      return `# CSV文件: ${this.baseDocName}\n\n*CSV文件为空或格式不正确*`
    }

    let markdown = `# CSV文件: ${this.baseDocName}\n\n`

    // 添加表格
    markdown += this.generateTable() + '\n\n'

    // 添加摘要
    markdown += this.generateSummary()

    return markdown
  }

  /**
   * 解析CSV文件
   * @returns Markdown格式的内容
   */
  public async parse(): Promise<string> {
    try {
      if (!this.readFile()) {
        return `# CSV解析失败\n\n无法读取文件: ${this.baseDocName}`
      }

      this.parseContent()

      if (this.records.length === 0) {
        return `# CSV文件: ${this.baseDocName}\n\n*CSV文件为空或格式不正确*`
      }

      this.calculateStatistics()
      return this.generateMarkdown()
    } catch (error: any) {
      console.error('解析CSV文件失败:', error)
      return `# CSV解析失败\n\n无法解析CSV文件。错误: ${error.message || '未知错误'}`
    } finally {
      this.dispose()
    }
  }

  /**
   * 清理资源
   */
  public dispose(): void {
    this.content = ''
    this.records = []
    this.headers = []
    this.statistics = null
  }
}

/**
 * 将CSV文件解析并转换为Markdown格式
 * @param filename CSV文件路径
 * @returns Markdown格式的字符串
 */
export async function parse(filename: string, ragName: string): Promise<string> {
  try {
    const parser = new CsvParser(filename, ragName)
    return await parser.parse()
  } catch (error: any) {
    console.error('解析CSV文件失败:', error)
    return `# CSV解析失败\n\n无法解析CSV文件。错误: ${error.message || '未知错误'}`
  }
}
