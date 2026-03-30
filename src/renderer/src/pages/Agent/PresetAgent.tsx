import { Card } from 'antd'
import useAgentStore from '@/stores/agent'
import { chooseAgentForChat } from './controller'
import type { AgentItemDto } from '@/types'

export default function PresetAgent() {
  const agentList = useAgentStore((s) => s.agentList)
  const presetAgents = agentList.filter((a) => a.is_system)

  return (
    <div className="grid grid-cols-3 gap-10">
      {presetAgents.map((agent) => (
        <Card
          key={agent.agent_name}
          hoverable
          className="cursor-pointer"
          onClick={() => chooseAgentForChat(agent)}
        >
          <div className="flex items-center gap-8">
            <span className="text-24">{agent.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="font-bold truncate">{agent.agent_title}</div>
              <div className="text-12 text-gray-5 truncate">{agent.prompt}</div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
