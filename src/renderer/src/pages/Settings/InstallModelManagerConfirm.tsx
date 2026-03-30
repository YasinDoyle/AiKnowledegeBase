import { Modal, Form, Select, Button, Popover } from 'antd'
import { useTranslation } from 'react-i18next'
import useSettingsStore from '@/stores/settings'
import { chooseOllamaPath, doNotInstallModelManagerNow, installModelManager } from './controller'

export default function InstallModelManagerConfirm() {
  const { t } = useTranslation()
  const show = useSettingsStore((s) => s.managerInstallConfirm)
  const managerForInstall = useSettingsStore((s) => s.managerForInstall)
  const setManager = useSettingsStore((s) => s.setManagerForInstall)
  const installPath = useSettingsStore((s) => s.modelManagerInstallPath)

  return (
    <Modal open={show} closable={false} title={t('提示')} footer={null} width={520}>
      <div className="mb-16">{t('检测到您没有安装模型管理器，是否立即安装？')}</div>
      <Form layout="horizontal" labelCol={{ span: 6 }}>
        <Form.Item label={t('模型管理器')}>
          <Select
            value={managerForInstall}
            onChange={setManager}
            options={[{ label: 'ollama', value: 'ollama' }]}
          />
        </Form.Item>
        <Form.Item label={t('模型存储位置')}>
          <Popover content={installPath || t('请选择模型管理器的安装路径')}>
            <Button onClick={chooseOllamaPath} className="max-w-full truncate">
              {installPath || t('选择')}
            </Button>
          </Popover>
        </Form.Item>
      </Form>
      <div className="flex justify-end gap-8 mt-20">
        <Button onClick={doNotInstallModelManagerNow}>{t('暂不安装')}</Button>
        <Button type="primary" onClick={installModelManager}>
          {t('立即安装')}
        </Button>
      </div>
    </Modal>
  )
}
