import { pub } from '../class/public'
import * as path from 'path'
import * as fs from 'fs-extra'

// 定义模型服务类
class IndexService {
  // 递归列出目录下所有文件
  private listFiles(dir: string): string[] {
    let results: string[] = []
    const list = fs.readdirSync(dir)
    for (const file of list) {
      const filePath = path.join(dir, file)
      if (fs.statSync(filePath).isDirectory()) {
        results = results.concat(this.listFiles(filePath)) // 递归调用
      } else {
        results.push(filePath)
      }
    }
    return results
  }

  /**
   * 复制数据到新路径
   * @returns
   */
  public async copyDataPath(): Promise<any> {
    if ((global as any).isCopyDataPath) {
      return
    }
    ;(global as any).isCopyDataPath = true
    // 复制数据到新路径
    const savePathConfigFile = path.resolve(pub.get_system_data_path(), 'save_path.json')
    const savePathConfig = pub.read_json(savePathConfigFile)
    try {
      const oldPath = savePathConfig.oldPath
      const newPath = savePathConfig.currentPath
      savePathConfig.copyStatus.status = 1
      savePathConfig.copyStatus.startTime = pub.time()
      savePathConfig.copyStatus.total = pub.getDirSize(oldPath)
      pub.write_json(savePathConfigFile, savePathConfig)

      const files = this.listFiles(oldPath)
      savePathConfig.copyStatus.fileTotal = files.length
      savePathConfig.copyStatus.fileCurrent = 0

      let lastTime = pub.time()
      let lastCurrent = 0
      for (const filename of files) {
        const newFilename = filename.replace(oldPath, newPath)
        const dstPath = path.dirname(newFilename)
        const name = path.basename(newFilename)
        if (!pub.file_exists(dstPath)) {
          pub.mkdir(dstPath)
        }

        const fStat = pub.stat(filename)

        savePathConfig.copyStatus.fileCurrent++

        savePathConfig.copyStatus.message = pub.lang('正在复制文件: {}', name)
        savePathConfig.copyStatus.error = ''
        await fs.copyFile(filename, newFilename)
        savePathConfig.copyStatus.current += fStat!.size
        lastCurrent += fStat!.size
        savePathConfig.copyStatus.percent = Math.floor(
          (savePathConfig.copyStatus.current / savePathConfig.copyStatus.total) * 100,
        )

        if (pub.time() != lastTime) {
          savePathConfig.copyStatus.speed = lastCurrent
          lastTime = pub.time()
          lastCurrent = 0
        }

        pub.write_json(savePathConfigFile, savePathConfig)
      }

      // 删除旧数据
      if (savePathConfig.oldPath != newPath && savePathConfig.oldPath) {
        if (pub.file_exists(oldPath)) {
          savePathConfig.copyStatus.message = pub.lang('正在删除旧数据')
          pub.write_json(savePathConfigFile, savePathConfig)
          await fs.remove(oldPath)
          savePathConfig.isClearOldPath = true
        }
      }

      savePathConfig.isMoveSuccess = true
      savePathConfig.isMove = false
      savePathConfig.copyStatus.status = 2
      savePathConfig.copyStatus.endTime = pub.time()
      savePathConfig.copyStatus.message = pub.lang('复制完成')
      savePathConfig.copyStatus.error = ''
    } catch (e) {
      const rmPath = savePathConfig.currentPath
      savePathConfig.copyStatus.status = -1
      savePathConfig.copyStatus.message = pub.lang('复制失败，已撤回操作: {}', (e as Error).message)
      savePathConfig.currentPath = savePathConfig.oldPath
      savePathConfig.isMove = false
      savePathConfig.oldPath = ''
      savePathConfig.isMoveSuccess = false
      savePathConfig.copyStatus.error = (e as Error).message
      // 删除已复制的文件
      fs.removeSync(rmPath)
    } finally {
      pub.write_json(savePathConfigFile, savePathConfig)
      ;(global as any).isCopyDataPath = false
    }
  }
}

// 重写 toString 方法，方便调试和日志输出
IndexService.toString = () => '[class IndexService]'
// 创建 IndexService 实例
const indexService = new IndexService()

// 导出类和实例
export { IndexService, indexService }
