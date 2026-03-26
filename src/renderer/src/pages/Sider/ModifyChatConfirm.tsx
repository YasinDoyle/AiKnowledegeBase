import { Modal, Button, Input } from 'antd'
import { useTranslation } from 'react-i18next'
import useSiderStore from '@/stores/sider'
import { modifyChatTitle } from './controller'

function ModifyChatConfirm() {
  const { t } = useTranslation()
  const chatModifyConfirm = useSiderStore((s) => s.chatModifyConfirm)
  const contextIdForModify = useSiderStore((s) => s.contextIdForModify)
  const newChatTitle = useSiderStore((s) => s.newChatTitle)
  const setChatModifyConfirm = useSiderStore((s) => s.setChatModifyConfirm)
  const setNewChatTitle = useSiderStore((s) => s.setNewChatTitle)

  const handleConfirm = () => {
    modifyChatTitle({ context_id: contextIdForModify, title: newChatTitle })
  }

  return (
    <Modal
      title={t('修改对话标题')}
      open={chatModifyConfirm}
      onCancel={() => setChatModifyConfirm(false)}
      footer={
        <div className="flex justify-end gap-3">
          <Button onClick={() => setChatModifyConfirm(false)}>{t('取消')}</Button>
          <Button type="primary" onClick={handleConfirm}>
            {t('确认')}
          </Button>
        </div>
      }
    >
      <Input
        value={newChatTitle}
        placeholder={t('请输入新的对话标题')}
        onChange={(e) => setNewChatTitle(e.target.value)}
        onPressEnter={handleConfirm}
      />
    </Modal>
  )
}

export default ModifyChatConfirm
