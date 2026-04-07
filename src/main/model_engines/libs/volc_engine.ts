import { pub } from '../../class/public'
import path from 'path'

const supplierName = 'VolcEngine'
const supplierPath = path.resolve(pub.get_data_path(), 'models', supplierName)
export class VolcEngine {
  private baseUrl: string
  private apiKey: string
  private configFile: string
  private config: any

  constructor() {
    this.baseUrl = ''
    this.apiKey = ''
    this.configFile = path.resolve(supplierPath, 'config.json')
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
    const url = `${this.baseUrl}/models?Action=ListFoundationModels&Version=2024-01-01`
    const res = await pub.httpRequest(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
    })

    return res
  }
}
