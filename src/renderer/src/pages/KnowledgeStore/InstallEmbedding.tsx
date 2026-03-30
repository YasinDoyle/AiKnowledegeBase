import { Modal, Button } from 'antd'
import { useTranslation } from 'react-i18next'
import useKnowledgeStore from '@/stores/knowledge'

export default function InstallEmbedding() {
  const { t } = useTranslation()
  const show = useKnowledgeStore((s) => s.installEmbeddingShow)
  const setShow = useKnowledgeStore((s) => s.setInstallEmbeddingShow)

  return (
    <Modal
      open={show}
      onCancel={() => setShow(false)}
      title={t('安装嵌入模型')}
      width={480}
      footer={null}
    >
      <div className="flex flex-col gap-16 items-center py-20">
        <p>{t('知识库功能需要嵌入模型，建议安装 bge-m3 或使用第三方API')}</p>
        <div className="flex gap-12">
          <Button type="primary" onClick={() => setShow(false)}>
            {t('安装 bge-m3')}
          </Button>
          <Button onClick={() => setShow(false)}>{t('使用第三方API')}</Button>
        </div>
      </div>
    </Modal>
  )
}
