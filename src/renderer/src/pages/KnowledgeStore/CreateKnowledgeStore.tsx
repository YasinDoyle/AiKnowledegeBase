import { Modal, Form, Input, Select, Slider } from 'antd'
import { useTranslation } from 'react-i18next'
import useKnowledgeStore from '@/stores/knowledge'
import { closeCreateKnowledge, createNewKnowledgeStore, doSelectModel } from './controller'

export default function CreateKnowledgeStore() {
  const { t } = useTranslation()
  const show = useKnowledgeStore((s) => s.createKnowledgeShow)
  const formData = useKnowledgeStore((s) => s.createKnowledgeFormData)
  const embeddingModels = useKnowledgeStore((s) => s.embeddingModelsList)
  const setFormData = useKnowledgeStore((s) => s.setCreateKnowledgeFormData)

  const modelOptions = embeddingModels.map((m: any) => ({
    label: `${m.title} (${m.model})`,
    value: m.model,
    supplierName: m.supplierName,
  }))

  return (
    <Modal
      open={show}
      onCancel={closeCreateKnowledge}
      onOk={createNewKnowledgeStore}
      title={t('创建知识库')}
      width={520}
      destroyOnClose
    >
      <Form layout="vertical">
        <Form.Item label={t('名称')} required>
          <Input
            placeholder={t('请输入知识库名称')}
            value={formData.ragName}
            onChange={(e) => setFormData({ ragName: e.target.value })}
          />
        </Form.Item>
        <Form.Item label={t('描述')}>
          <Input.TextArea
            placeholder={t('请输入知识库描述')}
            value={formData.ragDesc}
            onChange={(e) => setFormData({ ragDesc: e.target.value })}
          />
        </Form.Item>
        <Form.Item label={t('嵌入模型')} required>
          <Select
            placeholder={t('请选择嵌入模型')}
            value={formData.embeddingModel || undefined}
            options={modelOptions}
            onChange={(val, opt: any) => doSelectModel(val, opt?.supplierName)}
          />
        </Form.Item>
        <Form.Item label={t('最大召回数量')}>
          <Slider
            min={1}
            max={20}
            value={formData.maxRecall ?? 5}
            onChange={(v) => setFormData({ maxRecall: v })}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
