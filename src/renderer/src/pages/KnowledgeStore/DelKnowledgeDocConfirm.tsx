import { Modal } from 'antd'
import { useTranslation } from 'react-i18next'
import useKnowledgeStore from '@/stores/knowledge'
import { confirmDelKnowledgeDoc, cancelDelKnowledgeDoc } from './controller'

export default function DelKnowledgeDocConfirm() {
  const { t } = useTranslation()
  const show = useKnowledgeStore((s) => s.deleteKnowledgeDocShow)
  const doc = useKnowledgeStore((s) => s.deleteKnowledgeDoc)

  return (
    <Modal
      open={show}
      onCancel={cancelDelKnowledgeDoc}
      onOk={confirmDelKnowledgeDoc}
      title={t('提示')}
      width={400}
    >
      <span>
        {t('是否确认删除文档')} <strong>{doc?.doc_name}</strong> ?
      </span>
    </Modal>
  )
}
