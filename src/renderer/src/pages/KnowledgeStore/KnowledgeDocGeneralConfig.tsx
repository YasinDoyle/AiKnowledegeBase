import { Modal, Form, InputNumber, Switch, Button, Card } from 'antd'
import { useTranslation } from 'react-i18next'
import useKnowledgeStore from '@/stores/knowledge'
import { doPreview } from './controller'

export default function KnowledgeDocGeneralConfig() {
  const { t } = useTranslation()
  const show = useKnowledgeStore((s) => s.knowledgeDocConfigShow)
  const setShow = useKnowledgeStore((s) => s.setKnowledgeDocConfigShow)
  const formData = useKnowledgeStore((s) => s.sliceChunkFormData)
  const setFormData = useKnowledgeStore((s) => s.setSliceChunkFormData)
  const customSep = useKnowledgeStore((s) => s.customSeparators)
  const setCustomSep = useKnowledgeStore((s) => s.setCustomSeparators)
  const previewList = useKnowledgeStore((s) => s.slicePreviewList)

  return (
    <Modal
      open={show}
      onCancel={() => setShow(false)}
      title={t('文档分片配置')}
      width={680}
      footer={null}
    >
      <Form layout="vertical">
        <Form.Item label={t('分片大小')}>
          <InputNumber
            min={100}
            max={5000}
            value={formData.chunkSize}
            onChange={(v) => setFormData({ chunkSize: v ?? 500 })}
          />
        </Form.Item>
        <Form.Item label={t('重叠大小')}>
          <InputNumber
            min={0}
            max={1000}
            value={formData.overlapSize}
            onChange={(v) => setFormData({ overlapSize: v ?? 50 })}
          />
        </Form.Item>
        <Form.Item label={t('自定义分隔符')}>
          <Switch checked={customSep} onChange={setCustomSep} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" onClick={doPreview}>
            {t('预览分片')}
          </Button>
        </Form.Item>
      </Form>
      {previewList.length > 0 && (
        <div className="mt-16 max-h-300 overflow-y-auto flex flex-col gap-8">
          {previewList.map((chunk: any, idx: number) => (
            <Card key={idx} size="small" title={`Chunk #${idx + 1}`}>
              <pre className="whitespace-pre-wrap text-12">{chunk}</pre>
            </Card>
          ))}
        </div>
      )}
    </Modal>
  )
}
