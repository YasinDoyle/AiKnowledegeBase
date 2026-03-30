import { Form, Input, Radio, Button, Switch, Tooltip, Modal, Spin } from 'antd'
import { useTranslation } from 'react-i18next'
import useSoftSettingsStore from '@/stores/softSettings'
import {
  handleAddMcpServer,
  handleDeleteMcpServer,
  handleCurrentMcpStatus,
  installEnv,
  onChangeCommadType,
} from './controller'

export default function McpServerItemConfig() {
  const { t } = useTranslation()
  const currentMcpChoose = useSoftSettingsStore((s) => s.currentMcpChoose)
  const editMode = useSoftSettingsStore((s) => s.mcpServerEditMode)
  const envStatus = useSoftSettingsStore((s) => s.envStatus)
  const envInstallShow = useSoftSettingsStore((s) => s.envInstallShow)
  const commadType = useSoftSettingsStore((s) => s.commadType)
  const setCurrentMcpChoose = useSoftSettingsStore((s) => s.setCurrentMcpChoose)

  const update = (field: string, value: any) => {
    setCurrentMcpChoose({ ...currentMcpChoose, [field]: value })
  }

  return (
    <>
      {/* 标题栏 */}
      <div className="flex justify-between items-center border-b border-gray-2 pb-12 mb-10">
        <div className="flex items-center gap-8">
          <span className="font-bold text-16">{currentMcpChoose.name}</span>
          {editMode && (
            <Tooltip title={t('删除MCP服务器')}>
              <span
                className="i-weui:delete-outlined w-20 h-20 cursor-pointer"
                onClick={handleDeleteMcpServer}
              />
            </Tooltip>
          )}
        </div>
        {editMode && 'isActive' in currentMcpChoose && (
          <Tooltip title={t('是否可用')}>
            <Switch
              size="small"
              checked={(currentMcpChoose as any).isActive}
              onChange={handleCurrentMcpStatus}
            />
          </Tooltip>
        )}
      </div>

      {/* 表单 */}
      <div className="overflow-y-auto" style={{ maxHeight: 510 }}>
        <Form layout="vertical" size="small">
          <Form.Item label={t('名称')} required>
            <Input
              placeholder={t('请输入MCP服务器名称')}
              disabled={editMode}
              value={currentMcpChoose.name}
              onChange={(e) => update('name', e.target.value)}
            />
          </Form.Item>
          <Form.Item label={t('描述')}>
            <Input
              placeholder={t('请输入内容')}
              value={currentMcpChoose.description}
              onChange={(e) => update('description', e.target.value)}
            />
          </Form.Item>
          <Form.Item label={t('类型')}>
            <Radio.Group
              value={currentMcpChoose.type}
              onChange={(e) => update('type', e.target.value)}
            >
              <Radio value="stdio">Stdio</Radio>
              <Radio value="sse">SSE</Radio>
            </Radio.Group>
          </Form.Item>

          {currentMcpChoose.type === 'sse' ? (
            <Form.Item label={t('服务器地址')} required>
              <Input
                placeholder={t('请输入服务器URL地址')}
                value={currentMcpChoose.baseUrl}
                onChange={(e) => update('baseUrl', e.target.value)}
              />
            </Form.Item>
          ) : (
            <>
              <Form.Item label={t('程序类型')}>
                <Radio.Group
                  value={commadType}
                  onChange={(e) => onChangeCommadType(e.target.value)}
                >
                  <Radio value="npx">NPX</Radio>
                  <Radio value="custom">{t('自定义')}</Radio>
                </Radio.Group>
              </Form.Item>
              {envStatus.node_npx === 0 && commadType === 'npx' && (
                <div className="mb-10">
                  {t('当前未安装Nodejs环境，点击')}
                  <Button type="link" size="small" onClick={() => installEnv('nodejs')}>
                    {t('立即安装')}
                  </Button>
                </div>
              )}
              {commadType !== 'npx' && (
                <Form.Item label={t('命令')} required>
                  <Input
                    placeholder={t('可执行命令')}
                    value={currentMcpChoose.command}
                    onChange={(e) => update('command', e.target.value)}
                  />
                </Form.Item>
              )}
              <Form.Item label={t('参数')}>
                <Input.TextArea
                  placeholder={t('填写多个参数一行一个')}
                  value={currentMcpChoose.args}
                  onChange={(e) => update('args', e.target.value)}
                />
              </Form.Item>
              <Form.Item label={t('环境变量')}>
                <Input.TextArea
                  placeholder={t('填写多个环境变量一行一个，如：\nak=123456\nsk=678910')}
                  value={currentMcpChoose.env}
                  onChange={(e) => update('env', e.target.value)}
                />
              </Form.Item>
            </>
          )}
        </Form>
      </div>

      <Button
        type="primary"
        size="small"
        className="absolute bottom-0 right-0"
        onClick={handleAddMcpServer}
      >
        {editMode ? t('保存') : t('添加')}
      </Button>

      {/* 环境安装loading */}
      <Modal open={envInstallShow} closable={false} footer={null} width={300}>
        <div className="flex justify-center items-center gap-8 py-20">
          <Spin size="small" />
          <span>{t('正在安装环境,这可能需要几分钟......')}</span>
        </div>
      </Modal>
    </>
  )
}
