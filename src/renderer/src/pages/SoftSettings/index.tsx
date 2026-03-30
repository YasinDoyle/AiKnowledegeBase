import { Modal } from 'antd'
import { useTranslation } from 'react-i18next'
import useSoftSettingsStore from '@/stores/softSettings'
import useGlobalStore from '@/stores/global'
import { closeSoftSettings, changeSettingTab } from './controller'
import GeneralSettings from './GeneralSetting'
import McpServer from './McpServer'
import ChangeDirWarning from './ChangeDirWarning'
import DelMcpConfirm from './DelMcpConfirm'

export default function SoftSettings() {
  const { t } = useTranslation()
  const show = useSoftSettingsStore((s) => s.softSettingsShow)
  const currentTab = useSoftSettingsStore((s) => s.currentSettingTab)
  const panelWidth = useSoftSettingsStore((s) => s.settingPanelWidth)
  const settingPanelBorder = useGlobalStore((s) => s.settingPanelBorder)

  return (
    <>
      <Modal
        open={show}
        onCancel={closeSoftSettings}
        title={t('软件设置')}
        footer={null}
        width="auto"
        destroyOnClose
      >
        <div className="flex" style={{ minWidth: 600 }}>
          {/* Tab sidebar */}
          <div className="w-120 flex flex-col">
            <div
              className={`p-10 cursor-pointer ${currentTab === 'general' ? 'bg-[var(--bt-theme-color-hover)]' : ''}`}
              onClick={() => changeSettingTab('general')}
            >
              {t('常规设置')}
            </div>
            <div
              className={`p-10 cursor-pointer ${currentTab === 'mcp' ? 'bg-[var(--bt-theme-color-hover)]' : ''}`}
              onClick={() => changeSettingTab('mcp')}
            >
              {t('MCP服务器')}
            </div>
          </div>
          {/* Panel */}
          <div
            className="p-10 overflow-hidden transition-all"
            style={{ width: panelWidth, borderLeft: settingPanelBorder }}
          >
            {currentTab === 'general' && <GeneralSettings />}
            {currentTab === 'mcp' && <McpServer />}
          </div>
        </div>
      </Modal>
      <ChangeDirWarning />
      <DelMcpConfirm />
    </>
  )
}
