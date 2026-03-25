import { pub } from '../class/public'
import path from 'path'
import { logger } from '../lib/utils'

/**
 * 智能体服务类，提供与智能体相关的各种操作
 */
export class AgentService {
  // 读取智能体配置
  get_agent_config(agent_name: string) {
    let agentPath = path.resolve(pub.get_data_path(), 'agent')
    let systemAgentPath = path.resolve(pub.get_resource_path(), 'agent')
    let agentConfigFile = path.resolve(agentPath, agent_name + '.json')
    if (pub.file_exists(agentConfigFile)) {
      try {
        let agentConfig = pub.read_json(agentConfigFile)
        return agentConfig
      } catch (e) {
        logger.error(pub.lang('读取智能体配置文件失败'), e)
        return null
      }
    }

    let systemAgentConfigFile = path.resolve(systemAgentPath, agent_name + '.json')
    if (pub.file_exists(systemAgentConfigFile)) {
      try {
        let agentConfig = pub.read_json(systemAgentConfigFile)
        return agentConfig
      } catch (e) {
        logger.error(pub.lang('读取智能体配置文件失败'), e)
        return null
      }
    }

    return null
  }
}

/**
 * 重写 AgentService 类的 toString 方法，方便调试和日志输出
 * @returns {string} - 类的字符串表示
 */
AgentService.toString = () => '[class AgentService]'

/**
 * 导出 AgentService 类的单例实例
 */
export const agentService = new AgentService()
