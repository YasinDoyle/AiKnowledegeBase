import { Modal, Button } from 'antd'
import { useTranslation } from 'react-i18next'
import useSiderStore from '@/stores/sider'
import { removeChat } from './controller'

function RemoveChatConfirm() {
  const { t } = useTranslation()
  const chatRemoveConfirm = useSiderStore((s) => s.chatRemoveConfirm)
  const contextIdForDel = useSiderStore((s) => s.contextIdForDel)
  const setChatRemoveConfirm = useSiderStore((s) => s.setChatRemoveConfirm)

  return (
    <Modal
      title={t('删除对话')}
      open={chatRemoveConfirm}
      onCancel={() => setChatRemoveConfirm(false)}
      footer={
        <div className="flex justify-end gap-3">
          <Button onClick={() => setChatRemoveConfirm(false)}>{t('取消')}</Button>
          <Button danger onClick={() => removeChat(contextIdForDel)}>
            {t('删除')}
          </Button>
        </div>
      }
    >
      {t('是否确认删除当前对话')}
    </Modal>
  )
}

export default RemoveChatConfirm
