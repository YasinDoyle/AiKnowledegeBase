import { Modal } from 'antd'
import { useTranslation } from 'react-i18next'
import useKnowledgeStore from '@/stores/knowledge'
import { confirmDelKnowledge, cancelDelKnowledge } from './controller'

export default function DelKnowledgeConfirm() {
  const { t } = useTranslation()
  const show = useKnowledgeStore((s) => s.deleteKnowledgeShow)
  const activeKnowledge = useKnowledgeStore((s) => s.activeKnowledge)

  return (
    <Modal
      open={show}
      onCancel={cancelDelKnowledge}
      onOk={confirmDelKnowledge}
      title={t('提示')}
      width={400}
    >
      <span>
        {t('是否确认删除知识库')} <strong>{activeKnowledge}</strong> ?
      </span>
    </Modal>
  )
}
