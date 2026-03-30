import { Button, Card, Dropdown } from 'antd'
import { useTranslation } from 'react-i18next'
import useAgentStore from '@/stores/agent'
import { openCreateAgent, handleAgentOperation, chooseAgentForChat } from './controller'
import type { AgentItemDto } from '@/types'

export default function MyAgent() {
  const { t } = useTranslation()
  const agentList = useAgentStore((s) => s.agentList)
  const userAgents = agentList.filter((a) => !a.is_system)

  return (
    <div>
      <div className="flex justify-end mb-10">
        <Button type="primary" onClick={openCreateAgent}>
          {t('创建智能体')}
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-10">
        {userAgents.map((agent) => (
          <AgentCard key={agent.agent_name} agent={agent} />
        ))}
      </div>
    </div>
  )
}

function AgentCard({ agent }: { agent: AgentItemDto }) {
  const { t } = useTranslation()
  const menuItems = [
    { key: 'edit', label: t('编辑') },
    { key: 'delete', label: t('删除'), danger: true },
  ]

  return (
    <Card hoverable className="cursor-pointer" onClick={() => chooseAgentForChat(agent)}>
      <div className="flex items-center gap-8">
        <span className="text-24">{agent.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="font-bold truncate">{agent.agent_title}</div>
          <div className="text-12 text-gray-5 truncate">{agent.prompt}</div>
        </div>
        <Dropdown
          menu={{
            items: menuItems,
            onClick: ({ key, domEvent }) => {
              domEvent.stopPropagation()
              handleAgentOperation(key, agent)
            },
          }}
          trigger={['click']}
        >
          <span
            className="i-tdesign:more w-18 h-18 cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>
      </div>
    </Card>
  )
}
