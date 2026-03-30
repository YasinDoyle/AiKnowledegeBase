import { Modal, Form, Input } from 'antd'
import { useTranslation } from 'react-i18next'
import useThirdPartyApiStore from '@/stores/thirdPartyApi'
import { confirmAddSupplier, cancelAddSupplier } from './controller'

export default function AddSupplier() {
  const { t } = useTranslation()
  const show = useThirdPartyApiStore((s) => s.addSupplierShow)
  const formData = useThirdPartyApiStore((s) => s.addSupplierFormData)
  const setFormData = useThirdPartyApiStore((s) => s.setAddSupplierFormData)

  return (
    <Modal
      open={show}
      onCancel={cancelAddSupplier}
      onOk={confirmAddSupplier}
      title={t('添加模型服务商')}
      width={580}
      destroyOnClose
    >
      <Form layout="vertical">
        <Form.Item label={t('供应商名称')} required>
          <Input
            value={formData.supplierTitle}
            onChange={(e) => setFormData({ supplierTitle: e.target.value })}
          />
        </Form.Item>
        <Form.Item label={t('接口地址')} required>
          <div>
            <Input
              value={formData.baseUrl}
              onChange={(e) => setFormData({ baseUrl: e.target.value })}
            />
            <span className="text-12 text-gray-4">{t('需要兼容openAI格式的接口')}</span>
          </div>
        </Form.Item>
        <Form.Item label={t('密钥')} required>
          <Input
            value={formData.apiKey}
            onChange={(e) => setFormData({ apiKey: e.target.value })}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
