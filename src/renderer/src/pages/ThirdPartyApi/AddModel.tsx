import { Modal, Form, Input, Select } from 'antd'
import { useTranslation } from 'react-i18next'
import useThirdPartyApiStore from '@/stores/thirdPartyApi'
import { confirmAddModel, closeAddModel, modelIdChange, capabilityChange } from './controller'

export default function AddModel() {
  const { t } = useTranslation()
  const show = useThirdPartyApiStore((s) => s.addSupplierModel)
  const isEdit = useThirdPartyApiStore((s) => s.isEditModelFormData)
  const formData = useThirdPartyApiStore((s) => s.addModelFormData)
  const setFormData = useThirdPartyApiStore((s) => s.setAddModelFormData)
  const cantChoose = useThirdPartyApiStore((s) => s.cantChoose)

  const capabilityOptions = [
    { label: 'LLM', value: 'llm', disabled: cantChoose },
    { label: 'Vision', value: 'vision', disabled: cantChoose },
    { label: 'Embedding', value: 'embedding' },
    { label: 'Tools', value: 'tools', disabled: cantChoose },
  ]

  return (
    <Modal
      open={show}
      onCancel={closeAddModel}
      onOk={confirmAddModel}
      title={isEdit ? t('修改模型') : t('添加模型')}
      width={480}
      destroyOnClose
    >
      <Form layout="vertical">
        <Form.Item label={t('模型ID')} required>
          <Input
            placeholder={t('请输入模型ID')}
            value={formData.modelName}
            onChange={(e) => modelIdChange(e.target.value)}
            disabled={isEdit}
          />
        </Form.Item>
        <Form.Item label={t('模型别名')} required>
          <Input
            placeholder={t('请输入模型别名')}
            value={formData.title}
            onChange={(e) => setFormData({ title: e.target.value })}
          />
        </Form.Item>
        <Form.Item label={t('模型功能')} required>
          <Select
            mode="multiple"
            options={capabilityOptions}
            value={formData.capability}
            onChange={capabilityChange}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
