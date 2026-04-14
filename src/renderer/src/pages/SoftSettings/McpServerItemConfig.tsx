import { Form, Input, Radio, Button, Switch, Tooltip, Modal, Progress } from 'antd'
import { useTranslation } from 'react-i18next'
import useSoftSettingsStore from '@/stores/softSettings'
import {
  handleAddMcpServer,
  handleDeleteMcpServer,
  handleCurrentMcpStatus,
  installEnv,
  cancelEnvDownload,
  onChangeCommadType,
} from './controller'

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i]
}

export default function McpServerItemConfig() {
  const { t } = useTranslation()
  const currentMcpChoose = useSoftSettingsStore((s) => s.currentMcpChoose)
  const editMode = useSoftSettingsStore((s) => s.mcpServerEditMode)
  const envStatus = useSoftSettingsStore((s) => s.envStatus)
  const envInstallShow = useSoftSettingsStore((s) => s.envInstallShow)
  const envInstallProgress = useSoftSettingsStore((s) => s.envInstallProgress)
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
              className="mr-10"
              size="small"
              checked={(currentMcpChoose as any).isActive}
              onChange={handleCurrentMcpStatus}
            />
          </Tooltip>
        )}
      </div>

      {/* 表单 */}
      <div className="overflow-y-auto" style={{ maxHeight: 510, scrollbarGutter: 'stable' }}>
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
                  {t('当前未安装Bun环境，点击')}
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
        className="absolute bottom-4 right-6"
        onClick={handleAddMcpServer}
      >
        {editMode ? t('保存') : t('添加')}
      </Button>

      {/* 环境安装进度 */}
      <Modal open={envInstallShow} closable={false} footer={null} width={400}>
        <div className="flex flex-col items-center gap-4 py-6 px-4">
          <span className="text-sm font-medium">
            {envInstallProgress.status === 2
              ? t('正在解压...')
              : envInstallProgress.status === -1
                ? t('安装失败')
                : envInstallProgress.status === -2
                  ? t('已取消')
                  : t('正在下载环境')}
          </span>
          <Progress
            percent={envInstallProgress.progress || 0}
            status={
              envInstallProgress.status === -1 || envInstallProgress.status === -2
                ? 'exception'
                : 'active'
            }
            size="small"
            className="w-full"
          />
          {envInstallProgress.status === 1 && envInstallProgress.total > 0 && (
            <div className="text-xs text-gray-400 flex justify-between w-full">
              <span>
                {formatBytes(envInstallProgress.completed)} /{' '}
                {formatBytes(envInstallProgress.total)}
              </span>
              {envInstallProgress.speed > 0 && (
                <span>{formatBytes(envInstallProgress.speed)}/s</span>
              )}
            </div>
          )}
          {envInstallProgress.status === 1 && (
            <Button size="small" danger onClick={cancelEnvDownload}>
              {t('取消下载')}
            </Button>
          )}
        </div>
      </Modal>
    </>
  )
}
