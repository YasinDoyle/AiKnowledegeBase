import { Modal } from 'antd'
import { useTranslation } from 'react-i18next'
import useThirdPartyApiStore from '@/stores/thirdPartyApi'
import { cancelDelModel, confirmDelModel } from './controller'

export default function DelModelConfirm() {
  const { t } = useTranslation()
  const show = useThirdPartyApiStore((s) => s.deleteModelShow)

  return (
    <Modal
      open={show}
      onCancel={cancelDelModel}
      onOk={confirmDelModel}
      title={t('提示')}
      width={400}
    >
      <span>{t('是否确定删除当前模型？该操作不可逆')}</span>
    </Modal>
  )
}
