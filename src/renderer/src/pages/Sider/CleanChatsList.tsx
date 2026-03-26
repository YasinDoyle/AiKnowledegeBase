import { Modal, Button } from 'antd'
import { useTranslation } from 'react-i18next'
import useSiderStore from '@/stores/sider'
import { cancelCleanAllChats, confirmCleanAllChats } from './controller'

function CleanChatsList() {
  const { t } = useTranslation()
  const chatClearConfirm = useSiderStore((s) => s.chatClearConfirm)

  return (
    <Modal
      title={t('提示')}
      open={chatClearConfirm}
      onCancel={cancelCleanAllChats}
      footer={
        <div className="flex justify-end gap-3">
          <Button onClick={cancelCleanAllChats}>{t('取消')}</Button>
          <Button type="primary" onClick={confirmCleanAllChats}>
            {t('确认')}
          </Button>
        </div>
      }
    >
      {t('是否删除所有对话?')}
    </Modal>
  )
}

export default CleanChatsList
