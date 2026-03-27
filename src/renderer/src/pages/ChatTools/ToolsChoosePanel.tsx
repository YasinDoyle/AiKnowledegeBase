import { List } from 'antd'
import { CheckCircleFilled } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import useChatToolsStore from '@/stores/chatTools'
import { chooseMcpServerForChat } from './controller'

export default function ToolsChoosePanel() {
  const { t } = useTranslation()
  const mcpListForChat = useChatToolsStore((s) => s.mcpListForChat)
  const mcpListChoosed = useChatToolsStore((s) => s.mcpListChoosed)

  return (
    <div style={{ width: 300, minHeight: 180 }}>
      <div
        style={{
          borderBottom: '1px solid #ececec',
          padding: '10px 0',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
        }}
      >
        🔧 {t('选择工具')}
      </div>
      <div style={{ maxHeight: 200, overflowY: 'auto' }}>
        <List
          dataSource={mcpListForChat}
          renderItem={(item) => (
            <List.Item
              style={{ cursor: 'pointer', padding: '8px 20px' }}
              onClick={() => chooseMcpServerForChat(item.name)}
            >
              <div className="flex justify-between items-center w-full">
                <span>{item.name}</span>
                {mcpListChoosed.includes(item.name) ? (
                  <CheckCircleFilled style={{ color: '#35ab69', fontSize: 16 }} />
                ) : (
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      border: '1px solid #d9d9d9',
                      display: 'inline-block',
                    }}
                  />
                )}
              </div>
            </List.Item>
          )}
        />
      </div>
    </div>
  )
}
