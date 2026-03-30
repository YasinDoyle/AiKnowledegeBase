import { Modal } from 'antd'
import { useTranslation } from 'react-i18next'
import useThirdPartyApiStore from '@/stores/thirdPartyApi'
import { cancelDelSupplier, confirmDelSupplier } from './controller'

export default function DelSupplierConfirm() {
  const { t } = useTranslation()
  const show = useThirdPartyApiStore((s) => s.deleteSupplierShow)

  return (
    <Modal
      open={show}
      onCancel={cancelDelSupplier}
      onOk={confirmDelSupplier}
      title={t('提示')}
      width={400}
    >
      <span>{t('是否删除当前服务商? 该操作会同时删除下属所有模型，请谨慎操作！')}</span>
    </Modal>
  )
}
