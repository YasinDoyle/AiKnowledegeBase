import { pub } from '../../class/public'
import axios from 'axios'
import path from 'path'

const supplierName = 'VolcEngine'
const supplierPath = path.resolve(pub.get_data_path(), 'models', supplierName)
class VolcEngine {
  private baseUrl: string
  private apiKey: string
  private configFile: string
  private modelFile: string
  private embeddingFile: string
  private config: any

  constructor() {
    this.baseUrl = ''
    this.apiKey = ''
    this.configFile = path.resolve(supplierPath, 'config.json')
    this.modelFile = path.resolve(supplierPath, 'models.json')
    this.embeddingFile = path.resolve(supplierPath, 'embedding.json')
    this.getConfig()
  }

  /**
   * 获取配置信息
   * @returns {Promise<any>} 包含配置信息的对象，封装在成功响应中返回
   * @memberof VolcEngine
   */
  getConfig() {
    this.config = pub.read_json(this.configFile)
    this.baseUrl = this.config.baseUrl
    this.apiKey = this.config.apiKey
    return this.config
  }

  /**
   * 获取线上模型列表
   * @returns {Promise<any>} 包含模型列表的对象，封装在成功响应中返回
   * @memberof VolcEngine
   */
  async getOnlineModels() {
    let url = `${this.baseUrl}/models?Action=ListFoundationModels&Version=2024-01-01`
    let res = await pub.httpRequest(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
    })

    return res
  }
}
