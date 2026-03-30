import { Modal } from 'antd'
import { useTranslation } from 'react-i18next'
import useSoftSettingsStore from '@/stores/softSettings'
import { cancelDeleteMcpServer, confirmDeleteMcpServer } from './controller'

export default function DelMcpConfirm() {
  const { t } = useTranslation()
  const show = useSoftSettingsStore((s) => s.delMcpConfirmShow)

  return (
    <Modal
      open={show}
      onCancel={cancelDeleteMcpServer}
      onOk={confirmDeleteMcpServer}
      title={t('提示')}
      width={400}
    >
      <span>{t('是否删除当前MCP服务器？')}</span>
    </Modal>
  )
}
