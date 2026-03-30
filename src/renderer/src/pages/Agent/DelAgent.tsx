import { Modal } from 'antd'
import { useTranslation } from 'react-i18next'
import useAgentStore from '@/stores/agent'
import { confirmDelAgent, cancelDelAgent } from './controller'

export default function DelAgent() {
  const { t } = useTranslation()
  const delAgentShow = useAgentStore((s) => s.delAgentShow)
  const agentForDel = useAgentStore((s) => s.agentForDel)

  return (
    <Modal
      open={delAgentShow}
      onCancel={cancelDelAgent}
      onOk={confirmDelAgent}
      title={t('提示')}
      width={400}
    >
      <span>
        {t('是否确认删除智能体')} <strong>{agentForDel?.agent_title}</strong> ?
      </span>
    </Modal>
  )
}
