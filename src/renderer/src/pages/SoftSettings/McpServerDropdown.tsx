import { List } from 'antd'
import { useTranslation } from 'react-i18next'
import useSoftSettingsStore from '@/stores/softSettings'
import { handleAddMcp } from './controller'

export default function McpSeverDropdown() {
  const { t } = useTranslation()
  const mcpServerTempList = useSoftSettingsStore((s) => s.mcpServerTempList)

  return (
    <div className="max-h-300 overflow-y-auto">
      <div className="text-gray-5 p-8">{t('新配置')}</div>
      <List size="small" bordered={false}>
        <List.Item
          className="cursor-pointer hover:bg-gray-1"
          onClick={() =>
            handleAddMcp({
              name: '',
              description: '',
              type: 'stdio',
              command: 'npx',
              baseUrl: '',
              env: '',
              args: '',
            })
          }
        >
          {t('自定义')}
        </List.Item>
      </List>
      <div className="text-gray-5 p-8">{t('预设模板')}</div>
      <List size="small" bordered={false}>
        {mcpServerTempList.map((item) => (
          <List.Item
            key={item.name}
            className="cursor-pointer hover:bg-gray-1"
            onClick={() => handleAddMcp(item)}
          >
            {item.name}
          </List.Item>
        ))}
      </List>
    </div>
  )
}
