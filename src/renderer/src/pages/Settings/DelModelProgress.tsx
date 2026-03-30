import { Modal, Spin } from 'antd'
import { useTranslation } from 'react-i18next'
import useSettingsStore from '@/stores/settings'

export default function DelModelProgress() {
  const { t } = useTranslation()
  const show = useSettingsStore((s) => s.modelDelLoading)

  return (
    <Modal open={show} closable={false} footer={null} width={300}>
      <div className="flex justify-center items-center flex-col py-20">
        <div className="mb-16">{t('模型删除中，请稍后')}</div>
        <Spin size="large" />
      </div>
    </Modal>
  )
}
