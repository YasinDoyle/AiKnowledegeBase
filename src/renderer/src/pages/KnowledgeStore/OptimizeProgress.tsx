import { Modal, Spin } from 'antd'
import { useTranslation } from 'react-i18next'
import useKnowledgeStore from '@/stores/knowledge'

export default function OptimizeProgress() {
  const { t } = useTranslation()
  const show = useKnowledgeStore((s) => s.optimizeKnowledgeShow)

  return (
    <Modal open={show} closable={false} footer={null} width={300}>
      <div className="flex justify-center items-center flex-col py-20">
        <Spin size="large" />
        <div className="mt-16">{t('正在优化知识库...')}</div>
      </div>
    </Modal>
  )
}
