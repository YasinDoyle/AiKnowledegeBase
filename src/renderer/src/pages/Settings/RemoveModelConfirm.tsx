import { Modal } from 'antd'
import { useTranslation } from 'react-i18next'
import useSettingsStore from '@/stores/settings'
import { cancelRemoveModel, doRemoveModel } from './controller'

export default function RemoveModelConfirm() {
  const { t } = useTranslation()
  const show = useSettingsStore((s) => s.modelDelConfirm)

  return (
    <Modal
      open={show}
      onCancel={cancelRemoveModel}
      onOk={doRemoveModel}
      title={t('提示')}
      width={400}
    >
      <span>{t('是否确认删除模型，该操作不可逆？')}</span>
    </Modal>
  )
}
