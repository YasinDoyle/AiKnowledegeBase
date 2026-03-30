import { Modal, Input, Button } from 'antd'
import { useTranslation } from 'react-i18next'
import useSoftSettingsStore from '@/stores/softSettings'
import { saveMcpConfigFile } from './controller'

export default function McpConfigFile() {
  const { t } = useTranslation()
  const show = useSoftSettingsStore((s) => s.mcpConfigFileShow)
  const setShow = useSoftSettingsStore((s) => s.setMcpConfigFileShow)
  const content = useSoftSettingsStore((s) => s.mcpConfigFileContent)
  const setContent = useSoftSettingsStore((s) => s.setMcpConfigFileContent)

  return (
    <Modal
      open={show}
      onCancel={() => setShow(false)}
      title={t('编辑配置文件')}
      width={800}
      footer={
        <div className="flex justify-end gap-8">
          <Button onClick={() => setShow(false)}>{t('取消')}</Button>
          <Button type="primary" onClick={() => saveMcpConfigFile({ mcp_config_body: content })}>
            {t('确认')}
          </Button>
        </div>
      }
    >
      <Input.TextArea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="{}"
        rows={16}
      />
      <div className="text-gray-5 mt-8">{t('编辑MCP服务器配置的JSON。保存前请确保格式正确。')}</div>
    </Modal>
  )
}
