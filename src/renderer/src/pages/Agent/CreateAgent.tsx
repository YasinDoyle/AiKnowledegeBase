import { Modal, Form, Input } from 'antd'
import { useTranslation } from 'react-i18next'
import useAgentStore from '@/stores/agent'
import { createAgent, closeCreateAgent } from './controller'

export default function CreateAgent() {
  const { t } = useTranslation()
  const createAgentShow = useAgentStore((s) => s.createAgentShow)
  const formData = useAgentStore((s) => s.createAgentFormData)
  const isEdit = useAgentStore((s) => s.isEditAgent)
  const setFormData = useAgentStore((s) => s.setCreateAgentFormData)

  return (
    <Modal
      open={createAgentShow}
      onCancel={closeCreateAgent}
      onOk={createAgent}
      title={isEdit ? t('编辑智能体') : t('创建智能体')}
      width={500}
      destroyOnClose
    >
      <Form layout="vertical">
        <Form.Item label={t('图标')}>
          <Input
            value={formData.icon}
            onChange={(e) => setFormData({ icon: e.target.value })}
            style={{ width: 60 }}
          />
        </Form.Item>
        <Form.Item label={t('名称')} required>
          <Input
            placeholder={t('请输入智能体名称')}
            value={formData.agent_title}
            onChange={(e) => setFormData({ agent_title: e.target.value })}
          />
        </Form.Item>
        <Form.Item label={t('提示词')} required>
          <Input.TextArea
            rows={4}
            placeholder={t('请输入智能体提示词')}
            value={formData.prompt}
            onChange={(e) => setFormData({ prompt: e.target.value })}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
