import http from 'http'
import https from 'https'

// 节点列表
const nodes = [
  'https://dg2.bt.cn',
  'https://download.bt.cn',
  'https://ctcc1-node.bt.cn',
  'https://cmcc1-node.bt.cn',
  'https://ctcc2-node.bt.cn',
  'https://hk1-node.bt.cn',
  'https://na1-node.bt.cn',
  'https://jp1-node.bt.cn',
  'https://cf1-node.aapanel.com',
]

// 测试单个节点的下载速度
function testNodeDownloadSpeed(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http
    const fullUrl = url + '/ollama/test.bin'

    let startTime = Date.now()
    let downloadedBytes = 0
    const req = protocol.get(fullUrl, (res) => {
      res.on('data', (chunk) => {
        downloadedBytes += chunk.length
      })

      res.on('end', () => {
        if (!startTime) {
          reject(new Error('No data received'))
          return
        }
        const endTime = Date.now()
        const elapsedTime = (endTime - startTime) / 1000 // 转换为秒
        const speed = downloadedBytes / elapsedTime // 每秒下载的字节数
        resolve(speed)
      })
    })

    req.on('error', (error) => {
      reject(error)
    })

    req.setTimeout(2000, () => {
      req.destroy()
      reject(new Error('Request timed out'))
    })
  })
}

// 选择最快的节点
export async function selectFastestNode() {
  const promises = nodes.map((node) => {
    return testNodeDownloadSpeed(node)
      .then((speed) => {
        return { node, speed, error: null }
      })
      .catch((error) => {
        return { node, speed: 0, error }
      })
  })

  return Promise.all(promises).then((results) => {
    const fastestNode = results.reduce((prev: any, current: any) => {
      return prev.speed > current.speed ? prev : current
    })

    if (fastestNode.error) {
      return 'https://download.bt.cn'
    } else {
      return fastestNode.node
    }
  })
}
