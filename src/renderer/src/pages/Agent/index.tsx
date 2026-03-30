import { Modal, Tabs } from 'antd'
import { useTranslation } from 'react-i18next'
import useAgentStore from '@/stores/agent'
import MyAgent from './MyAgent'
import PresetAgent from './PresetAgent'
import CreateAgent from './CreateAgent'
import DelAgent from './DelAgent'
import { closeAgent } from './controller'

export default function Agent() {
  const { t } = useTranslation()
  const agentShow = useAgentStore((s) => s.agentShow)

  return (
    <>
      <Modal
        open={agentShow}
        onCancel={closeAgent}
        title={t('智能体')}
        footer={null}
        width={720}
        destroyOnClose
      >
        <Tabs
          items={[
            { key: 'my', label: t('我的智能体'), children: <MyAgent /> },
            { key: 'preset', label: t('预设模板'), children: <PresetAgent /> },
          ]}
        />
      </Modal>
      <CreateAgent />
      <DelAgent />
    </>
  )
}
