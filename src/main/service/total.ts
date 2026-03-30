import { pub } from '../class/public'
import https from 'https'
import querystring from 'querystring'
import { logger } from '../lib/utils'

class TotalService {
  private apiDomain = 'api.aingdesk.com'

  // 统计安装量和日活跃量
  async total() {
    let data = querystring.stringify({
      version: pub.version(), // 版本号
      os_type: pub.os_type(), // 操作系统类型  windows,mac,linux
      client_id: pub.client_id(), // 64位客户端唯一标识
    })

    // User-Agent
    let userAgent = 'AiKnowledgeBase/' + pub.version() + ' (' + pub.os_type() + ')'

    // 请求配置
    let options = {
      hostname: this.apiDomain,
      port: 443,
      path: '/client/total',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': data.length,
        'User-Agent': userAgent,
      },
    }

    // 发送请求
    let req = https.request(options, (res) => {
      res.setEncoding('utf8')
      res.on('data', (data) => {
        // logger.info("res:",data);
        let result = JSON.parse(data)
        if (result.status === true) {
          if (result.data && result.data.shareid_prefix) {
            // 如果配置中没有设置分享ID前缀，则使用接口返回的前缀，避免分享ID冲突
            if (!pub.C('shareIdPrefix')) {
              pub.C('shareIdPrefix', result.data.shareid_prefix)
            }

            global.area = result.data.area
          }
        }
      })
    })

    req.on('error', (e) => {
      logger.warn(e)
    })

    // 写入数据到请求主体
    req.write(data)

    // 结束请求
    req.end()
  }

  // 启动统计服务，每天统计一次
  async start() {
    this.total() // 每次启动时先统计一次
    setInterval(() => {
      this.total()
    }, 86400)
  }
}

/**
 * 重写 TotalService 类的 toString 方法，方便调试和日志输出
 * @returns {string} - 类的字符串表示
 */
TotalService.toString = () => '[class TotalService]'

/**
 * 导出 TotalService 类的单例实例
 */
export const totalService = new TotalService()
