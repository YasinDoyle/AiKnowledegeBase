import { LanceDBManager } from './vector_database/vector_lancedb'
import { pub } from '../class/public'
import { Rag } from './rag'
import { indexService } from '../service/index'
import { logger } from '../lib/utils'
import path from 'path'

export class RagTask {
  private docTable = 'doc_table'

  /**
   * 获取未解析文档
   * @returns Promise<any>
   */
  async getNotParseDocument(): Promise<any> {
    let result = await LanceDBManager.queryRecord(this.docTable, 'is_parsed=0')
    return result
  }

  async getNotEmbeddingDocument(): Promise<any> {
    let result = await LanceDBManager.queryRecord(this.docTable, 'is_parsed=2')
    return result
  }

  /**
   * 文档分割 - 将长文本分割成小块，尊重Markdown文档结构
   * @param docBody 待分割的文档内容
   * @returns 分割后的文本块数组
   */
  public docChunk(docBody: string, chunkSize: number, overlapSize: number): string[] {
    // 每个块的最大字符数
    if (!chunkSize || chunkSize < 100) {
      chunkSize = 1000
    }
    // 重叠区域的字符数，确保上下文连贯性
    if (!overlapSize) {
      overlapSize = 100
    }

    // 最小块大小阈值，小于此值不设置重叠区域
    const minSizeForOverlap = overlapSize

    // 处理空文档情况
    if (!docBody || docBody.trim().length === 0) {
      return []
    }

    const chunks: string[] = []

    // 首先按照Markdown标题分割（# 开头的行）
    const headingRegex = /^#{1,6}\s+.+$/gm
    const headingMatches = [...docBody.matchAll(headingRegex)]

    if (headingMatches.length > 1) {
      // 有明确的Markdown标题结构，按标题分块
      const sections: string[] = []

      for (let i = 0; i < headingMatches.length; i++) {
        const currentMatch = headingMatches[i]
        const nextMatch = headingMatches[i + 1]

        const startIdx = currentMatch.index!
        const endIdx = nextMatch ? nextMatch.index! : docBody.length

        sections.push(docBody.substring(startIdx, endIdx))
      }

      // 对每个部分进一步处理
      for (const section of sections) {
        if (section.length <= chunkSize) {
          chunks.push(section.trim())
        } else {
          // 如果部分太长，进一步分割
          const subChunks = this.splitTextBySize(section, chunkSize, overlapSize, minSizeForOverlap)
          chunks.push(...subChunks)
        }
      }
    } else {
      // // 没有明确的标题结构，尝试按照Markdown列表、代码块等分割
      // const mdBlockRegex = /```[\s\S]*?```|^\s*[*+-]\s+.*$(?:\n^\s*[*+-]\s+.*$)*/gm;
      // const mdBlocks = [...docBody.matchAll(mdBlockRegex)];

      // if (mdBlocks.length > 0) {
      //     // 处理Markdown块和块之间的文本
      //     let lastEnd = 0;

      //     for (const block of mdBlocks) {
      //         // 先处理块前的文本
      //         if (block.index! > lastEnd) {
      //             const textBefore = docBody.substring(lastEnd, block.index!);
      //             const textChunks = this.splitTextBySize(textBefore, chunkSize, overlapSize, minSizeForOverlap);
      //             chunks.push(...textChunks);
      //         }

      //         // 处理Markdown块本身
      //         const blockContent = block[0];
      //         if (blockContent.length <= chunkSize) {
      //             chunks.push(blockContent.trim());
      //         } else {
      //             const blockChunks = this.splitTextBySize(blockContent, chunkSize, overlapSize, minSizeForOverlap);
      //             chunks.push(...blockChunks);
      //         }

      //         lastEnd = block.index! + block[0].length;
      //     }

      //     // 处理最后一个块后的文本
      //     if (lastEnd < docBody.length) {
      //         const textAfter = docBody.substring(lastEnd);
      //         const textChunks = this.splitTextBySize(textAfter, chunkSize, overlapSize, minSizeForOverlap);
      //         chunks.push(...textChunks);
      //     }
      // 没有特定Markdown结构，按段落分割
      const textChunks = this.splitTextBySize(docBody, chunkSize, overlapSize, minSizeForOverlap)
      chunks.push(...textChunks)
      // } else {
      //     // 没有特定Markdown结构，按段落分割
      //     const textChunks = this.splitTextBySize(docBody, chunkSize, overlapSize, minSizeForOverlap);
      //     chunks.push(...textChunks);
      // }
    }

    return chunks
  }

  /**
   * 辅助方法：按大小分割文本
   */
  private splitTextBySize(
    text: string,
    chunkSize: number,
    overlapSize: number,
    minSizeForOverlap: number,
  ): string[] {
    const chunks: string[] = []
    const paragraphs = text.split('\n\n')
    let currentChunk = ''

    for (const paragraph of paragraphs) {
      // 如果段落本身就超过了块大小，则需要进一步分割
      if (paragraph.length > chunkSize) {
        // 如果当前块不为空，先保存它
        if (currentChunk.length > 0) {
          chunks.push(currentChunk.trim())
          currentChunk = ''
        }

        // 将段落按单换行符进一步分割
        const lines = paragraph.split('\n')
        for (const line of lines) {
          // 如果当前行加入后会超出块大小，先保存当前块
          if (currentChunk.length + line.length > chunkSize && currentChunk.length > 0) {
            chunks.push(currentChunk.trim())

            // 只有当块足够大时才保留重叠部分
            if (currentChunk.length >= minSizeForOverlap) {
              currentChunk = currentChunk.slice(-overlapSize)
            } else {
              currentChunk = ''
            }
          }

          // 添加当前行到块中
          currentChunk += line + '\n'
        }
      } else {
        // 如果加入当前段落后会超出块大小，先保存当前块
        if (currentChunk.length + paragraph.length > chunkSize && currentChunk.length > 0) {
          chunks.push(currentChunk.trim())

          // 只有当块足够大时才保留重叠部分
          if (currentChunk.length >= minSizeForOverlap) {
            currentChunk = currentChunk.slice(-overlapSize)
          } else {
            currentChunk = ''
          }
        }

        // 添加当前段落到块中
        currentChunk += paragraph + '\n\n'
      }
    }

    // 添加最后一个块（如果有内容）
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim())
    }

    return chunks
  }

  // 递归分割
  recursionSplit(
    chunkList: string[],
    separators: string[],
    chunkSize: number,
    currentSep: string,
    overlapSize: number,
  ): string[] {
    let chunks: string[] = []
    let currentSepIsString = typeof currentSep == 'string'
    for (let chunk of chunkList) {
      if (chunk.length == 0) {
        continue
      }
      if (chunk.length <= chunkSize) {
        if (currentSepIsString) {
          // 如果当前分隔符是字符串，则直接添加
          chunks.push(chunk.trim() + currentSep)
        } else {
          chunks.push(chunk.trim())
        }
        continue
      }

      if (separators.length > 0) {
        let sep = separators[0]
        let chunkList2 = this.split(chunk, sep)
        chunks.push(
          ...this.recursionSplit(chunkList2, separators.slice(1), chunkSize, sep, overlapSize),
        )
      } else {
        // 如果所有分隔符都尝试过了，还是没有找到合适的分隔符，就直接按长度分割
        chunks.push(...this.docChunk(chunk, chunkSize, overlapSize))
      }
    }
    return chunks
  }

  // 使用分隔符分割文本
  // 这里的分隔符可以是字符串或正则表达式
  split(text: string, sep: any) {
    let chunkList: string[] = []
    if (typeof sep == 'string') {
      // 如果是字符串，直接使用字符串分割
      chunkList = text.split(sep)
    } else {
      // 如果是正则表达式，使用正则表达式分割
      let keys: any = text.match(sep) // 匹配分隔符
      if (keys == null) {
        return [text]
      }
      for (let key of keys) {
        let splitArr: string[] = text.split(key)
        let arrLen = splitArr.length
        if (arrLen > 1) {
          for (let i = 0; i < arrLen; i++) {
            let chunk = splitArr[i]

            if (i > 0) {
              chunk = key + chunk // 添加分隔符
            }

            if (i == arrLen - 1) {
              text = chunk // 更新文本
              continue
            }

            if (chunk.length > 0) {
              chunkList.push(chunk) // 添加到块列表
            }
          }
        }
      }

      // 最后一个块
      if (text.length > 0) {
        chunkList.push(text)
      }
    }

    return chunkList
  }

  // 自动识别分隔符
  defaultSeparators(separators: string[], filename: string, text: string): string[] {
    if (separators.length == 0) {
      separators = []
      // 如果表格文件，且未指定分隔符，则默认使用换行符分割
      if (filename.endsWith('.xlsx') || filename.endsWith('.xls') || filename.endsWith('.csv')) {
        separators = ['\n']
        return separators
      }

      // 如果文本高频出现第X章、第X节，第X条等明显符合规则的关键字，则使用对应正则表达式进行分割
      let patt_list = [
        /(第.{1,10}章[\s\:\.：])/g,
        /(第.{1,10}条[\s\:\.：])/g,
        /(第.{1,10}节[\s\:\.：])/g,
        /(第.{1,10}款[\s\:\.：])/g,
        /(\s[一二三四五六七八九十]{1,5}[\s:\.：、])/g,
        /(\s\([一二三四五六七八九十]{1,5}\)[\s:\.：、])/g,
        /(Slide\s+\d+)/g,
        /(\s\d{1,4}\.\d{1,4}[\s:\.\：、])/g,
        /(\s\(\d{1,4}\)[\s:\.\：、])/g,
      ]

      for (let patt of patt_list) {
        let keys = text.match(patt)
        if (keys && keys.length > 3) {
          separators.push('/' + patt.source + '/')
        }
      }
    }
    return separators
  }

  // 格式化分割符
  formatSep(sep: string[]): any[] {
    let sepList: any[] = []
    for (let s of sep) {
      // 判断是否为正则表达式
      if (s.length > 3 && s.startsWith('/') && (s.endsWith('/') || s.endsWith('/g'))) {
        // 去掉开头和结尾的斜杠
        if (s.endsWith('/g')) {
          s = s.slice(1, -2)
        } else {
          s = s.slice(1, -1)
        }

        // 如果没有括号，添加括号
        // 这里的正则表达式是为了匹配括号内的内容
        // 例如：/(\d+)/g => (\d+)
        if (!s.startsWith('(') || !s.endsWith(')')) {
          s = '(' + s + ')'
        }

        sepList.push(new RegExp(s, 'g'))
      } else {
        sepList.push(s)
      }
    }
    return sepList
  }

  // 获取文档名称
  getDocName(filename: string): string {
    let docName = path.basename(filename)
    // 删除文档名称中的扩展名
    if (docName.includes('.')) {
      docName = docName.replace('.md', '').split('.').slice(0, -1).join('.')
    }
    return docName
  }

  /**
   *
   * @param text <string> 文本内容
   * @param separators <string[]> 分隔符列表
   * @param chunkSize <number> 每个块的大小
   * @returns
   */
  splitText(
    filename: string,
    text: string,
    separators: string[],
    chunkSize: number,
    overlapSize?: number,
  ): string[] {
    let chunks: string[] = []
    let i = 0
    if (separators.length == 0) {
      // 尝试自动识别分隔符
      separators = this.defaultSeparators(separators, filename, text)
      if (separators.length == 0) {
        // 如果没有分隔符，则直接按长度分割
        return this.docChunk(text, chunkSize, overlapSize)
      }
    }

    let docName = this.getDocName(filename)
    let sepList: any[] = this.formatSep(separators)
    let sep = sepList[i]
    let chunkList: string[] = this.split(text, sep)
    chunks = this.recursionSplit(chunkList, sepList.slice(1), chunkSize, sep, overlapSize)

    // 为每个块添加文档名称和块索引、起始位置和结束位置
    for (let i = 0; i < chunks.length; i++) {
      let chunk = chunks[i].trim()
      if (chunk.length > 0) {
        // 计算块起始位置和结束位置
        let startPos = text.indexOf(chunk)
        let endPos = startPos + chunk.length
        chunks[i] = `[${docName}]#${i + 1} POS[${startPos}-${endPos}]\n` + chunk
      }
    }

    return chunks
  }

  // 后台解析任务
  public async parseTask() {
    const sleep = 5 * 1000
    let self = this

    setTimeout(async () => {
      if (global.changePath) {
        global.changePath = false
        indexService.copyDataPath()
      }
      // await LanceDBManager.optimizeAllTable()
      await self.parse()
      await self.embed()
      self.parseTask()
    }, sleep)
  }

  // 当向量数据足够多时，切换到余弦相似度索引
  public async switchToCosineIndex() {
    let tableList = pub.readdir(pub.get_data_path() + '/rag/vector_db')
    let indexTipsPath = pub.get_data_path() + '/rag/index_tips'
    if (!pub.file_exists(indexTipsPath)) {
      pub.mkdir(indexTipsPath)
    }

    for (let tablePath of tableList) {
      let tableName = tablePath.split('/').pop()?.replace('.lance', '')
      // console.log(tableName,tableName?.length)
      if (tableName?.length !== 32) {
        continue
      }

      // 创建全文索引
      await LanceDBManager.createDocFtsIndex(tableName)

      let indexTipFile = indexTipsPath + '/' + tableName + '.pl'
      if (pub.file_exists(indexTipFile)) {
        continue
      }

      if ((await LanceDBManager.tableCount(tableName)) > 256) {
        await LanceDBManager.addIndex(tableName, [{ type: 'ivfPq', key: 'vector' }])
        pub.write_file(indexTipFile, '1')
      }
    }
  }

  /**
   * 解析文档
   * @returns Promise<void>
   */
  public async parse() {
    let notParseDocument = await this.getNotParseDocument()
    let dataDir = pub.get_data_path()
    let repDataDir = '{DATA_DIR}'

    let ragObj = new Rag()
    for (let doc of notParseDocument) {
      try {
        let filename = doc.doc_file.replace(repDataDir, dataDir)
        let parseDoc = await ragObj.parseDocument(filename, doc.doc_rag, true)
        if (!parseDoc.content) {
          // 标记为解析失败
          await LanceDBManager.updateRecord(this.docTable, {
            where: `doc_id='${doc.doc_id}'`,
            values: { is_parsed: -1 },
          })
          continue
        }
        let pdata = {
          md_file: parseDoc.savedPath?.replace(dataDir, repDataDir),
          doc_abstract: await ragObj.generateAbstract(parseDoc.content),
          doc_keywords: await ragObj.generateKeywords(parseDoc.content, 5),
          is_parsed: 2,
          update_time: pub.time(),
        }
        // 更新文档状态
        await LanceDBManager.updateRecord(this.docTable, {
          where: `doc_id='${doc.doc_id}'`,
          values: pdata,
        })
      } catch (e) {
        logger.error(pub.lang('[parseDocument]解析文档失败'), e)
        await LanceDBManager.updateRecord(this.docTable, {
          where: `doc_id='${doc.doc_id}'`,
          values: { is_parsed: -1 },
        })
      }
    }
  }

  /**
   * 开始嵌入文档
   * @returns Promise<string>
   */
  public async embed() {
    try {
      let notEmbeddingDocument = await this.getNotEmbeddingDocument()
      let dataDir = pub.get_data_path()
      let repDataDir = '{DATA_DIR}'
      let ragObj = new Rag()
      let ragNameList: string[] = []
      for (let doc of notEmbeddingDocument) {
        let md_file = doc.md_file.replace(repDataDir, dataDir)
        if (!pub.file_exists(md_file)) {
          continue
        }
        let md_body = pub.read_file(md_file)
        let chunks = this.splitText(
          doc.doc_file,
          md_body,
          doc.separators,
          doc.chunk_size,
          doc.overlap_size,
        )
        let chunkList: any[] = []
        for (let chunk of chunks) {
          let chunkInfo = {
            text: chunk,
            docId: doc.doc_id,
            tokens: pub.cutForSearch(chunk).join(' '),
            keywords: await ragObj.generateKeywords(chunk, 5),
          }
          chunkList.push(chunkInfo)
        }

        let table = pub.md5(doc.doc_rag)
        let ragInfo: any = await ragObj.getRagInfo(doc.doc_rag)
        for (let checkInfo of chunkList) {
          try {
            await LanceDBManager.addDocument(
              table,
              ragInfo.supplierName,
              ragInfo.embeddingModel,
              checkInfo.text,
              checkInfo.keywords,
              checkInfo.docId,
              checkInfo.tokens,
            )
          } catch (e) {
            logger.error(pub.lang('[addDocument]插入数据失败'), e)
            await LanceDBManager.updateRecord(this.docTable, {
              where: `doc_id='${doc.doc_id}'`,
              values: { is_parsed: -1 },
            })
          }
        }

        // 更新文档状态
        await LanceDBManager.updateRecord(this.docTable, {
          where: `doc_id='${doc.doc_id}'`,
          values: { is_parsed: 3 },
        })

        // 添加知识库名称到列表
        if (!ragNameList.includes(doc.doc_rag)) {
          ragNameList.push(doc.doc_rag)
        }
      }

      // 更新知识库FIT索引
      for (let ragName of ragNameList) {
        let encryptTableName = pub.md5(ragName)
        await LanceDBManager.createDocFtsIndex(encryptTableName)
        await LanceDBManager.optimizeTable(encryptTableName)
      }
    } catch (e) {
      logger.error(pub.lang('[embed]嵌入文档失败'), e)
      return e
    }
  }
}
