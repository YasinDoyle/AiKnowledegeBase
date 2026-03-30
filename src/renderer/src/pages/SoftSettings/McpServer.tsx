import { useEffect } from 'react'
import { Button, Popover, Tooltip } from 'antd'
import { useTranslation } from 'react-i18next'
import useSoftSettingsStore from '@/stores/softSettings'
import {
  checkEnvStatus,
  getMcpServerList,
  getMcpTempList,
  handleEditMcp,
  openMcpConfigFile,
} from './controller'
import McpServerItemConfig from './McpServerItemConfig'
import McpSeverDropdown from './McpServerDropdown'
import McpConfigFile from './McpConfigFile'

export default function McpServer() {
  const { t } = useTranslation()
  const mcpServerList = useSoftSettingsStore((s) => s.mcpServerList)
  const mcpServerFormShow = useSoftSettingsStore((s) => s.mcpServerFormShow)
  const currentMcpName = useSoftSettingsStore((s) => s.currentMcpName)

  useEffect(() => {
    checkEnvStatus()
    getMcpServerList()
    getMcpTempList()
  }, [])

  return (
    <div className="flex gap-10" style={{ width: 780 }}>
      {/* MCP 列表 */}
      <div className="w-160 border-r border-gray-2 pr-10">
        <Popover trigger="hover" content={<McpSeverDropdown />} placement="bottom">
          <Button type="primary" ghost className="w-full mb-10">
            {t('添加服务器')}
          </Button>
        </Popover>
        <div className="overflow-y-auto" style={{ maxHeight: 440 }}>
          {mcpServerList.map((item) => (
            <div
              key={item.name}
              className={`flex items-center justify-between p-10 cursor-pointer rounded ${currentMcpName === item.name ? 'bg-[var(--bt-theme-color-hover)]' : 'hover:bg-[var(--bt-theme-color-hover)]'}`}
              onClick={() => handleEditMcp(item.name)}
            >
              <Tooltip title={item.name}>
                <div className="flex items-center gap-8">
                  <span className="i-grommet-icons:cli w-16 h-16" />
                  <span className="truncate max-w-88">{item.name}</span>
                  <span
                    className={`w-8 h-8 rounded-full ${item.isActive ? 'bg-green-5' : 'bg-gray-4'}`}
                  />
                </div>
              </Tooltip>
            </div>
          ))}
        </div>
        <Button className="w-full mt-20" onClick={openMcpConfigFile}>
          {t('编辑配置文件')}
        </Button>
      </div>

      {/* MCP 配置面板 */}
      <div className="flex-1 relative" style={{ minWidth: 590 }}>
        {mcpServerFormShow && <McpServerItemConfig />}
      </div>
      <McpConfigFile />
    </div>
  )
}
